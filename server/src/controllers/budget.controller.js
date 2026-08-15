import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/validate.js';
import BudgetProject from '../models/BudgetProject.js';
import BudgetVote from '../models/BudgetVote.js';
import Department from '../models/Department.js';
import Ward from '../models/Ward.js';
import { AppError } from '../middleware/errorHandler.js';

export const listBudgetProjects = asyncHandler(async (req, res) => {
  const { wardId, status, category } = req.query;
  const filter = {};

  if (wardId && mongoose.isValidObjectId(wardId)) filter.wardId = wardId;
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

  const now = new Date();
  const totalVotesAll = projects.reduce((sum, p) => sum + (p.voteCount || 0), 0);

  const formattedProjects = projects.map((p, index) => {
    const isVotingOpen =
      p.status !== 'voting_closed' &&
      p.status !== 'cancelled' &&
      (!p.votingStartsAt || new Date(p.votingStartsAt) <= now) &&
      (!p.votingEndsAt || new Date(p.votingEndsAt) >= now);

    const votePercentage = totalVotesAll > 0
      ? Math.round(((p.voteCount || 0) / totalVotesAll) * 100)
      : 0;

    return {
      ...p.toObject(),
      rank: index + 1,
      hasVoted: userVotes.includes(p._id.toString()),
      isVotingOpen,
      votePercentage,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      projects: formattedProjects,
      totalVotes: totalVotesAll,
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

  const now = new Date();
  const isVotingOpen =
    project.status !== 'voting_closed' &&
    project.status !== 'cancelled' &&
    (!project.votingStartsAt || new Date(project.votingStartsAt) <= now) &&
    (!project.votingEndsAt || new Date(project.votingEndsAt) >= now);

  if (!isVotingOpen) {
    throw new AppError('Voting is currently closed for this project', 400);
  }

  const existingVote = await BudgetVote.findOne({ budgetProjectId: id, userId });
  if (existingVote) {
    // Toggle unvote (Withdraw vote)
    await BudgetVote.deleteOne({ _id: existingVote._id });
    project.voteCount = Math.max(0, (project.voteCount || 1) - 1);
    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Vote withdrawn successfully',
      data: { project, hasVoted: false },
    });
  }

  // Cast vote (1 vote per citizen per project enforced by unique index and query)
  await BudgetVote.create({ budgetProjectId: id, userId });
  project.voteCount = (project.voteCount || 0) + 1;
  await project.save();

  res.status(200).json({
    success: true,
    message: 'Vote cast successfully',
    data: { project, hasVoted: true },
  });
});

export const createBudgetProject = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    wardId,
    departmentId,
    category,
    estimatedCost,
    votingStartsAt,
    votingEndsAt,
  } = req.body;

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
    message: 'Budget project proposed successfully',
    data: { project },
  });
});

/**
 * Backend Participatory Budget Simulation Engine.
 * All budget calculations (envelope, selected cost, surplus/over-budget, ranking) happen strictly on backend.
 */
export const simulateBudget = asyncHandler(async (req, res) => {
  const { budgetEnvelope = 2500000, selectedProjectIds = [], wardId } = req.body;
  const envelope = Math.max(0, Number(budgetEnvelope) || 2500000);

  const filter = {};
  if (wardId && mongoose.isValidObjectId(wardId)) {
    filter.wardId = wardId;
  }

  const projects = await BudgetProject.find(filter)
    .populate('wardId', 'name code city')
    .populate('departmentId', 'name code')
    .sort({ voteCount: -1, createdAt: 1 });

  const totalVotesAll = projects.reduce((sum, p) => sum + (p.voteCount || 0), 0);

  // 1. Explicit Selection Simulation (if user picked specific projects)
  let explicitSelectedCost = 0;
  const explicitSelectedProjects = [];
  const explicitUnselectedProjects = [];

  if (Array.isArray(selectedProjectIds) && selectedProjectIds.length > 0) {
    const selectedSet = new Set(selectedProjectIds.map((id) => id.toString()));
    projects.forEach((p) => {
      if (selectedSet.has(p._id.toString())) {
        explicitSelectedCost += p.estimatedCost || 0;
        explicitSelectedProjects.push(p);
      } else {
        explicitUnselectedProjects.push(p);
      }
    });
  }

  // 2. Automated Ranked Cutoff Simulation (allocates budget in order of citizen votes)
  let autoAllocatedCost = 0;
  const fundedByVotes = [];
  const unfundedCutoff = [];

  projects.forEach((p, index) => {
    const cost = p.estimatedCost || 0;
    const votePercentage = totalVotesAll > 0
      ? Math.round(((p.voteCount || 0) / totalVotesAll) * 100)
      : 0;

    const rankedObj = {
      ...p.toObject(),
      rank: index + 1,
      votePercentage,
    };

    if (autoAllocatedCost + cost <= envelope) {
      autoAllocatedCost += cost;
      fundedByVotes.push({ ...rankedObj, isFunded: true, allocatedCost: cost });
    } else {
      unfundedCutoff.push({ ...rankedObj, isFunded: false, allocatedCost: 0 });
    }
  });

  const selectedCost = selectedProjectIds.length > 0 ? explicitSelectedCost : autoAllocatedCost;
  const remainingBudget = Math.max(0, envelope - selectedCost);
  const overBudgetAmount = Math.max(0, selectedCost - envelope);
  const isOverBudget = selectedCost > envelope;

  res.status(200).json({
    success: true,
    data: {
      availableBudget: envelope,
      selectedCost,
      remainingBudget,
      overBudgetAmount,
      isOverBudget,
      fundedCount: fundedByVotes.length,
      totalProjects: projects.length,
      totalVotes: totalVotesAll,
      allocatedProjects: fundedByVotes,
      unallocatedProjects: unfundedCutoff,
      voteRanking: [...fundedByVotes, ...unfundedCutoff],
      explicitSelection: selectedProjectIds.length > 0 ? {
        selectedCost: explicitSelectedCost,
        remainingBudget: Math.max(0, envelope - explicitSelectedCost),
        isOverBudget: explicitSelectedCost > envelope,
        selectedProjects: explicitSelectedProjects,
      } : null,
    },
  });
});

export const updateBudgetProjectStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, votingEndsAt } = req.body;

  const project = await BudgetProject.findById(id);
  if (!project) {
    throw new AppError('Budget project not found', 404);
  }

  if (status) project.status = status;
  if (votingEndsAt) project.votingEndsAt = new Date(votingEndsAt);
  await project.save();

  res.status(200).json({
    success: true,
    message: 'Budget project status updated successfully',
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
