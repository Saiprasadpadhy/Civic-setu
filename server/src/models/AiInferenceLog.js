import mongoose from 'mongoose';

const aiInferenceLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['grievance', 'media', 'preview'],
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    pipeline: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    promptVersion: {
      type: String,
      trim: true,
    },
    inputSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    success: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      trim: true,
    },
    latencyMs: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

aiInferenceLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const AiInferenceLog = mongoose.model('AiInferenceLog', aiInferenceLogSchema);

export default AiInferenceLog;
