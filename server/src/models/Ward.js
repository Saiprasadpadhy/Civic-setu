import mongoose from 'mongoose';

const wardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Ward code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Ward code cannot exceed 20 characters'],
    },
    name: {
      type: String,
      required: [true, 'Ward name is required'],
      trim: true,
      maxlength: [120, 'Ward name cannot exceed 120 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [80, 'City name cannot exceed 80 characters'],
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon',
      },
      coordinates: {
        type: [[[Number]]],
        default: undefined,
      },
    },
    center: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        validate: {
          validator(value) {
            if (!value || value.length === 0) return true;
            return value.length === 2;
          },
          message: 'Center coordinates must be [longitude, latitude]',
        },
      },
    },
    population: {
      type: Number,
      min: [0, 'Population cannot be negative'],
      default: 0,
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

wardSchema.index({ boundary: '2dsphere' }, { sparse: true });
wardSchema.index({ center: '2dsphere' }, { sparse: true });
wardSchema.index({ city: 1, name: 1 });

const Ward = mongoose.model('Ward', wardSchema);

export default Ward;
