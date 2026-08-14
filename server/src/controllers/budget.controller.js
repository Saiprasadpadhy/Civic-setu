import { asyncHandler } from '../middleware/validate.js';
import BudgetProject from '../models/BudgetProject.js';
import BudgetVote from '../models/BudgetVote.js';
import Department from '../models/Department.js';
import Ward from '../models/Ward.js';
import { AppError } from '../middleware/errorHandler.js';

export const listBudgetProjects = asyncHandler(async (req, res) => {
  const { wardId, status, category } = req.query;
  const filter = {};

  if (wardId) filter.wardId = wardId;
  if (status) filter.status = status;
  if (category) filter.category = category;

  const projects = await BudgetProject.find(filter)
    .populate('wardId', 'name code city')
    .populate('departmentId', 'name code')
    .populate('createdById', 'name email role')
    .sort({ voteCount: -1, createdAt: -1 });

  let userVotes = [];
  if (req.user) {
    const votes = await BudgetVote.find({ userId: req.user.userId }).select('budgetProjectId');
    userVotes = votes.map((v) => v.budgetProjectId.toString());
  }

  res.status(200).json({
    success: true,
    data: {
      projects: projects.map((p) => ({
        ...p.toObject(),
        hasVoted: userVotes.includes(p._id.toString()),
      })),
    },
  });
});

export const voteBudgetProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const project = await BudgetProject.findById(id);
  if (!project) {
    throw new AppError('Budget project not found', 404);
  }

  const existingVote = await BudgetVote.findOne({ budgetProjectId: id, userId });
  if (existingVote) {
    // Toggle unvote
    await BudgetVote.deleteOne({ _id: existingVote._id });
    project.voteCount = Math.max(0, (project.voteCount || 1) - 1);
    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Vote removed successfully',
      data: { project, hasVoted: false },
    });
  }

  await BudgetVote.create({ budgetProjectId: id, userId });
  project.voteCount = (project.voteCount || 0) + 1;
  await project.save();

  res.status(200).json({
    success: true,
    message: 'Vote recorded successfully',
    data: { project, hasVoted: true },
  });
});

export const createBudgetProject = asyncHandler(async (req, res) => {
  const { title, description, wardId, departmentId, category, estimatedCost, votingStartsAt, votingEndsAt } = req.body;

  const project = await BudgetProject.create({
    title: title.trim(),
    description: description.trim(),
    wardId,
    departmentId: departmentId || null,
    category: category || 'infrastructure',
    estimatedCost: Number(estimatedCost),
    votingStartsAt: votingStartsAt || new Date(),
    votingEndsAt: votingEndsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdById: req.user.userId,
    status: 'proposed',
    isPublished: true,
  });

  res.status(201).json({
    success: true,
    message: 'Budget project created successfully',
    data: { project },
  });
});

export const getBudgetAnalytics = asyncHandler(async (_req, res) => {
  const [projects, departments, wards] = await Promise.all([
    BudgetProject.find().populate('departmentId', 'name code').populate('wardId', 'name code'),
    Department.find({ isActive: true }),
    Ward.find({ isActive: true }),
  ]);

  const totalBudgetProposed = projects.reduce((sum, p) => sum + (p.estimatedCost || 0), 0);
  const totalVotesCast = projects.reduce((sum, p) => sum + (p.voteCount || 0), 0);

  const byDepartment = departments.map((d) => {
    const deptProjects = projects.filter((p) => p.departmentId?._id?.toString() === d._id.toString());
    return {
      department: d.name,
      code: d.code,
      projectCount: deptProjects.length,
      totalCost: deptProjects.reduce((s, p) => s + p.estimatedCost, 0),
      votes: deptProjects.reduce((s, p) => s + p.voteCount, 0),
    };
  });

  const byWard = wards.map((w) => {
    const wardProjects = projects.filter((p) => p.wardId?._id?.toString() === w._id.toString());
    return {
      ward: w.name,
      code: w.code,
      projectCount: wardProjects.length,
      totalCost: wardProjects.reduce((s, p) => s + p.estimatedCost, 0),
      votes: wardProjects.reduce((s, p) => s + p.voteCount, 0),
    };
  });

  res.status(200).json({
    success: true,
    data: {
      totalProjects: projects.length,
      totalBudgetProposed,
      totalVotesCast,
      byDepartment,
      byWard,
      projects,
    },
  });
});
