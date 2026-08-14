import mongoose from 'mongoose';

const budgetVoteSchema = new mongoose.Schema(
  {
    budgetProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BudgetProject',
      required: [true, 'Budget project reference is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    weight: {
      type: Number,
      default: 1,
      min: [1, 'Vote weight must be at least 1'],
      max: [10, 'Vote weight cannot exceed 10'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

budgetVoteSchema.index({ budgetProjectId: 1, userId: 1 }, { unique: true });
budgetVoteSchema.index({ userId: 1, createdAt: -1 });
budgetVoteSchema.index({ budgetProjectId: 1, createdAt: -1 });

const BudgetVote = mongoose.model('BudgetVote', budgetVoteSchema);

export default BudgetVote;
