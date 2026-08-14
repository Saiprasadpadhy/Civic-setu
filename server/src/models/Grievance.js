import mongoose from 'mongoose';
import {
  LANGUAGES,
  GRIEVANCE_STATUSES,
  PRIORITIES,
  SEVERITY_LEVELS,
  SLA_STATUSES,
  SPAM_DECISION_SOURCES,
  AI_STATUSES,
} from '../constants/enums.js';

const grievanceImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [200, 'Caption cannot exceed 200 characters'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const duplicateCandidateSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    matchReason: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const grievanceSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
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
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    originalLanguage: {
      type: String,
      enum: {
        values: LANGUAGES,
        message: '{VALUE} is not a supported language',
      },
      default: 'unknown',
    },
    titleNormalized: {
      type: String,
      trim: true,
      maxlength: [200, 'Normalized title cannot exceed 200 characters'],
    },
    descriptionNormalized: {
      type: String,
      trim: true,
      maxlength: [5000, 'Normalized description cannot exceed 5000 characters'],
    },
    voiceTranscript: {
      type: String,
      trim: true,
      maxlength: [5000, 'Voice transcript cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: [true, 'Ward is required'],
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: [true, 'Location coordinates are required'],
        validate: {
          validator(value) {
            return Array.isArray(value) && value.length === 2;
          },
          message: 'Location coordinates must be [longitude, latitude]',
        },
      },
      addressText: {
        type: String,
        trim: true,
        maxlength: [300, 'Address cannot exceed 300 characters'],
      },
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    images: {
      type: [grievanceImageSchema],
      default: [],
      validate: {
        validator: (images) => images.length <= 10,
        message: 'A grievance cannot have more than 10 images',
      },
    },
    status: {
      type: String,
      enum: {
        values: GRIEVANCE_STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITIES,
        message: '{VALUE} is not a valid priority',
      },
      default: 'medium',
      index: true,
    },
    priorityScore: {
      type: Number,
      min: [0, 'Priority score must be at least 0'],
      max: [100, 'Priority score cannot exceed 100'],
      default: 50,
    },
    severity: {
      type: String,
      enum: {
        values: SEVERITY_LEVELS,
        message: '{VALUE} is not a valid severity level',
      },
      default: 'medium',
    },
    severityTags: {
      type: [String],
      default: [],
    },
    aiStatus: {
      type: String,
      enum: {
        values: AI_STATUSES,
        message: '{VALUE} is not a valid AI status',
      },
      default: 'pending',
      index: true,
    },
    aiError: {
      type: String,
      trim: true,
      default: null,
    },
    aiAnalysis: {
      summary: { type: String, trim: true },
      suggestedCategory: { type: String, trim: true },
      suggestedSubcategory: { type: String, trim: true },
      suggestedDepartmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
      imageLabels: { type: [String], default: [] },
      confidence: { type: Number, min: 0, max: 1 },
      priorityExplanation: { type: String, trim: true },
      urgencyExplanation: { type: String, trim: true },
      language: { type: String, trim: true },
      normalizedText: {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
      },
      semanticHints: {
        safetyImpact: { type: Number, min: 0, max: 1 },
        affectedPopulation: { type: Number, min: 0, max: 1 },
        essentialServiceImpact: { type: Number, min: 0, max: 1 },
        recurrence: { type: Number, min: 0, max: 1 },
        vulnerability: { type: Number, min: 0, max: 1 },
      },
      imageAnalysis: {
        likelyIssue: { type: String, trim: true },
        visibleDamage: { type: String, trim: true },
        category: { type: String, trim: true },
        observations: { type: [String], default: [] },
        confidence: { type: Number, min: 0, max: 1 },
        uncertaintyNotes: { type: String, trim: true },
        error: { type: String, trim: true },
      },
      modelVersion: { type: String, trim: true },
      processedAt: { type: Date },
      isPending: { type: Boolean, default: true },
    },
    spamResult: {
      score: { type: Number, min: 0, max: 1, default: 0 },
      isSpam: { type: Boolean, default: false, index: true },
      reasons: { type: [String], default: [] },
      aiSignal: { type: Number, min: 0, max: 1 },
      decidedBy: {
        type: String,
        enum: SPAM_DECISION_SOURCES,
        default: 'auto',
      },
      reviewedAt: { type: Date },
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      default: null,
      index: true,
    },
    duplicateCandidates: {
      type: [duplicateCandidateSchema],
      default: [],
    },
    isDuplicate: {
      type: Boolean,
      default: false,
      index: true,
    },
    sla: {
      predictedDueAt: { type: Date, index: true },
      breachedAt: { type: Date },
      resolvedAt: { type: Date },
      hoursAllocated: { type: Number, min: 0 },
      status: {
        type: String,
        enum: SLA_STATUSES,
        default: 'on_track',
      },
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen is required'],
      index: true,
    },
    assignedOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    resolutionSummary: {
      type: String,
      trim: true,
      maxlength: [2000, 'Resolution summary cannot exceed 2000 characters'],
    },
    metadata: {
      source: {
        type: String,
        enum: ['web', 'mobile_web', 'voice'],
        default: 'web',
      },
      ipHash: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

grievanceSchema.index({ location: '2dsphere' });
grievanceSchema.index({ wardId: 1, status: 1 });
grievanceSchema.index({ departmentId: 1, status: 1 });
grievanceSchema.index({ category: 1, status: 1 });
grievanceSchema.index({ priority: 1, status: 1 });
grievanceSchema.index({ citizenId: 1, createdAt: -1 });
grievanceSchema.index({ assignedOfficerId: 1, status: 1 });
grievanceSchema.index({ createdAt: -1 });
grievanceSchema.index(
  { titleNormalized: 'text', descriptionNormalized: 'text', title: 'text', description: 'text' },
  { weights: { titleNormalized: 10, title: 8, descriptionNormalized: 5, description: 3 } }
);

grievanceSchema.pre('validate', function syncCoordinates(next) {
  if (this.location?.coordinates?.length === 2) {
    this.longitude = this.location.coordinates[0];
    this.latitude = this.location.coordinates[1];
  } else if (this.latitude != null && this.longitude != null) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
      addressText: this.location?.addressText,
    };
  }
  next();
});

grievanceSchema.pre('save', async function generateTicketId(next) {
  if (this.ticketId) return next();

  const year = new Date().getFullYear();
  const count = await mongoose.model('Grievance').countDocuments();
  this.ticketId = `CS-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

const Grievance = mongoose.model('Grievance', grievanceSchema);

export default Grievance;
