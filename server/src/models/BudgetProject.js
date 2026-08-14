import mongoose from 'mongoose';
import { BUDGET_PROJECT_STATUSES } from '../constants/enums.js';

const budgetProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: [true, 'Ward is required'],
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    estimatedCost: {
      type: Number,
      required: [true, 'Estimated cost is required'],
      min: [0, 'Estimated cost cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: BUDGET_PROJECT_STATUSES,
        message: '{VALUE} is not a valid budget project status',
      },
      default: 'proposed',
      index: true,
    },
    votingStartsAt: {
      type: Date,
      default: null,
    },
    votingEndsAt: {
      type: Date,
      default: null,
    },
    voteCount: {
      type: Number,
      default: 0,
      min: [0, 'Vote count cannot be negative'],
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

budgetProjectSchema.index({ status: 1, votingEndsAt: 1 });
budgetProjectSchema.index({ wardId: 1, status: 1 });
budgetProjectSchema.index({ createdAt: -1 });

budgetProjectSchema.pre('validate', function validateVotingWindow(next) {
  if (this.votingStartsAt && this.votingEndsAt && this.votingStartsAt >= this.votingEndsAt) {
    this.invalidate('votingEndsAt', 'Voting end must be after voting start');
  }
  next();
});

const BudgetProject = mongoose.model('BudgetProject', budgetProjectSchema);

export default BudgetProject;
