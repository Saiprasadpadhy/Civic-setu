import mongoose from 'mongoose';
import { USER_ROLES, LANGUAGES } from '../constants/enums.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: '{VALUE} is not a valid role',
      },
      default: 'citizen',
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      default: null,
    },
    preferredLanguage: {
      type: String,
      enum: {
        values: LANGUAGES.filter((lang) => lang !== 'unknown'),
        message: '{VALUE} is not a supported language',
      },
      default: 'en',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1, departmentId: 1 });
userSchema.index({ wardId: 1 });

userSchema.pre('validate', function validateOfficerDepartment(next) {
  if (this.role === 'officer' && !this.departmentId) {
    this.invalidate('departmentId', 'Officers must be assigned to a department');
  }
  next();
});

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;
