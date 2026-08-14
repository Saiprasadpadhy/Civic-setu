import mongoose from 'mongoose';
import { GRIEVANCE_STATUSES, USER_ROLES } from '../constants/enums.js';

const grievanceStatusHistorySchema = new mongoose.Schema(
  {
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: [true, 'Grievance reference is required'],
      index: true,
    },
    fromStatus: {
      type: String,
      enum: {
        values: GRIEVANCE_STATUSES,
        message: '{VALUE} is not a valid status',
      },
    },
    toStatus: {
      type: String,
      enum: {
        values: GRIEVANCE_STATUSES,
        message: '{VALUE} is not a valid status',
      },
      required: [true, 'Target status is required'],
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      enum: [...USER_ROLES, 'system'],
      default: 'system',
    },
    note: {
      type: String,
      trim: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

grievanceStatusHistorySchema.index({ grievanceId: 1, createdAt: -1 });
grievanceStatusHistorySchema.index({ actorId: 1, createdAt: -1 });
grievanceStatusHistorySchema.index({ toStatus: 1, createdAt: -1 });

const GrievanceStatusHistory = mongoose.model(
  'GrievanceStatusHistory',
  grievanceStatusHistorySchema
);

export default GrievanceStatusHistory;
