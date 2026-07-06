import Task from '../models/Task.js';
import Project from '../models/Project.js';
import mongoose from 'mongoose';

const getComparableMemberId = (member) =>
  (member?._id || member)?.toString();

const isProjectMember = (project, userId) =>
  project.members.some(
    (member) => getComparableMemberId(member) === userId.toString()
  );

// @desc    Get dashboard stats (global)
// @route   GET /api/dashboard/stats
export const getStats = async (req, res, next) => {
  try {
    const projectFilter = req.user.role === 'admin' ? {} : { members: req.user.id };
    const projects = await Project.find(projectFilter).select('_id');

    const projectIds = projects.map((p) => p._id);

    const totalTasks = await Task.countDocuments({
      project: { $in: projectIds },
    });

    const todoCount = await Task.countDocuments({
      project: { $in: projectIds },
      status: 'todo',
    });
    const inProgressCount = await Task.countDocuments({
      project: { $in: projectIds },
      status: 'in_progress',
    });
    const doneCount = await Task.countDocuments({
      project: { $in: projectIds },
      status: 'done',
    });

    const overdueCount = await Task.countDocuments({
      project: { $in: projectIds },
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
    });

    const tasksPerUser = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const lowCount = await Task.countDocuments({
      project: { $in: projectIds },
      priority: 'low',
    });
    const mediumCount = await Task.countDocuments({
      project: { $in: projectIds },
      priority: 'medium',
    });
    const highCount = await Task.countDocuments({
      project: { $in: projectIds },
      priority: 'high',
    });

    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalTasks,
        todoCount,
        inProgressCount,
        doneCount,
        overdueCount,
        tasksPerUser,
        priorityBreakdown: { low: lowCount, medium: mediumCount, high: highCount },
        recentTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats for a specific project
// @route   GET /api/dashboard/stats/:projectId
export const getProjectStats = async (req, res, next) => {
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

    const totalTasks = await Task.countDocuments({ project: projectId });
    const todoCount = await Task.countDocuments({ project: projectId, status: 'todo' });
    const inProgressCount = await Task.countDocuments({ project: projectId, status: 'in_progress' });
    const doneCount = await Task.countDocuments({ project: projectId, status: 'done' });
    const overdueCount = await Task.countDocuments({
      project: projectId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
    });

    const tasksPerUser = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalTasks,
        todoCount,
        inProgressCount,
        doneCount,
        overdueCount,
        tasksPerUser,
      },
    });
  } catch (error) {
    next(error);
  }
};
