import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

const getComparableMemberId = (member) =>
  (member?._id || member)?.toString();

const isProjectMember = (project, userId) =>
  project.members.some(
    (member) => getComparableMemberId(member) === userId.toString()
  );

// @desc    Create a new project
// @route   POST /api/projects
export const createProject = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create projects',
      });
    }

    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description,
      createdBy: req.user.id,
    });

    await project.populate('members', 'name email');
    await project.populate('createdBy', 'name email');

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects the user is part of
// @route   GET /api/projects
export const getProjects = async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : {
            members: req.user.id,
          };

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    // Get task count for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        const doneCount = await Task.countDocuments({
          project: project._id,
          status: 'done',
        });
        return {
          ...project.toObject(),
          taskCount,
          doneCount,
        };
      })
    );

    res.json({ success: true, projects: projectsWithCounts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (req.user.role !== 'admin' && !isProjectMember(project, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project.',
      });
    }

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
export const updateProject = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update projects',
      });
    }

    project.title = title || project.title;
    project.description = description !== undefined ? description : project.description;
    await project.save();

    await project.populate('createdBy', 'name email');
    await project.populate('members', 'name email');

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete projects',
      });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
export const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add members to projects',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (isProjectMember(project, userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    project.members.push(userId);
    await project.save();

    await project.populate('createdBy', 'name email');
    await project.populate('members', 'name email');

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove members from projects',
      });
    }

    if (userId === project.createdBy.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project creator',
      });
    }

    project.members = project.members.filter((m) => m.toString() !== userId);
    await project.save();

    await project.populate('createdBy', 'name email');
    await project.populate('members', 'name email');

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};
