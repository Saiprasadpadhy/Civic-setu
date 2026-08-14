import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Department code cannot exceed 20 characters'],
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [120, 'Department name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    categories: {
      type: [String],
      default: [],
      validate: {
        validator: (categories) => new Set(categories).size === categories.length,
        message: 'Categories must be unique',
      },
    },
    defaultSlaHours: {
      type: Number,
      required: [true, 'Default SLA hours are required'],
      min: [1, 'SLA hours must be at least 1'],
      max: [8760, 'SLA hours cannot exceed one year'],
      default: 72,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid contact email'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.index({ categories: 1 });
departmentSchema.index({ name: 'text', code: 'text' });

const Department = mongoose.model('Department', departmentSchema);

export default Department;
