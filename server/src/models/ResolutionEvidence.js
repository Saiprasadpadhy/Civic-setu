import mongoose from 'mongoose';
import { RESOLUTION_EVIDENCE_TYPES } from '../constants/enums.js';

const resolutionEvidenceSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: [true, 'Grievance reference is required'],
      index: true,
    },
    uploadedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
      index: true,
    },
    evidenceType: {
      type: String,
      enum: {
        values: RESOLUTION_EVIDENCE_TYPES,
        message: '{VALUE} is not a valid evidence type',
      },
      default: 'after',
    },
    url: {
      type: String,
      required: [true, 'Evidence URL is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [300, 'Caption cannot exceed 300 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

resolutionEvidenceSchema.index({ grievanceId: 1, evidenceType: 1 });
resolutionEvidenceSchema.index({ grievanceId: 1, createdAt: -1 });

const ResolutionEvidence = mongoose.model('ResolutionEvidence', resolutionEvidenceSchema);

export default ResolutionEvidence;
