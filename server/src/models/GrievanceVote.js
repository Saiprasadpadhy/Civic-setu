import mongoose from 'mongoose';

const grievanceVoteSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: [true, 'Grievance reference is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    voteType: {
      type: String,
      enum: ['support', 'follow'],
      default: 'support',
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

grievanceVoteSchema.index({ grievanceId: 1, userId: 1 }, { unique: true });
grievanceVoteSchema.index({ grievanceId: 1, createdAt: -1 });

const GrievanceVote = mongoose.model('GrievanceVote', grievanceVoteSchema);

export default GrievanceVote;
