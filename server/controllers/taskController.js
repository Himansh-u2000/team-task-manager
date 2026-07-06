import Task from '../models/Task.js';
import Project from '../models/Project.js';

const getComparableMemberId = (member) =>
  (member?._id || member)?.toString();

const isProjectMember = (project, userId) =>
  project.members.some(
    (member) => getComparableMemberId(member) === userId.toString()
  );

const ensureAdmin = (req, res, message) => {
  if (req.user.role === 'admin') {
    return true;
  }

  res.status(403).json({
    success: false,
    message,
  });

  return false;
};

// @desc    Create a task
// @route   POST /api/tasks
export const createTask = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res, 'Only admins can create tasks')) {
      return;
    }

    const { title, description, project, assignedTo, priority, dueDate } = req.body;

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (!isProjectMember(projectDoc, assignedTo)) {
      return res.status(400).json({
        success: false,
        message: 'Assignee must be a member of this project',
      });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo,
      createdBy: req.user.id,
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });

    // await task.populate('assignedTo', 'name email');
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'project', select: 'title' }
    ]);

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
export const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (req.user.role !== 'admin' && !isProjectMember(project, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks assigned to current user
// @route   GET /api/tasks/my-tasks
export const getMyTasks = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const memberProjects = await Project.find({ members: req.user.id }).select('_id');
    const filter = {
      assignedTo: req.user.id,
      project: { $in: memberProjects.map((project) => project._id) },
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res, 'Only admins can update tasks')) {
      return;
    }

    const { title, description, assignedTo, priority, dueDate, status } = req.body;

    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (assignedTo && !isProjectMember(project, assignedTo)) {
      return res.status(400).json({
        success: false,
        message: 'Assignee must be a member of this project',
      });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (priority) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (status) updates.status = status;

    task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name email')
      .populate('project', 'title');

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['todo', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const canUpdateOwnTask =
      task.assignedTo.toString() === req.user.id && isProjectMember(project, req.user.id);

    if (!canUpdateOwnTask && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update tasks assigned to you',
      });
    }

    task.status = status;
    await task.save();

    await task.populate('assignedTo', 'name email');
    await task.populate('project', 'title');

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
export const deleteTask = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res, 'Only admins can delete tasks')) {
      return;
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
