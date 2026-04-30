const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },
    clockIn: {
      time: {
        type: Date,
        required: true,
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
      ip: String,
      device: String,
    },
    clockOut: {
      time: Date,
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
      ip: String,
      device: String,
    },
    breaks: [
      {
        start: {
          type: Date,
          required: true,
        },
        end: Date,
        duration: Number, // in minutes
      },
    ],
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'half-day', 'on-break'],
      default: 'present',
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    earlyDepartureMinutes: {
      type: Number,
      default: 0,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for geospatial queries
attendanceSchema.index({ 'clockIn.location': '2dsphere' });
attendanceSchema.index({ 'clockOut.location': '2dsphere' });

// Index for queries
attendanceSchema.index({ employee: 1, 'clockIn.time': -1 });
attendanceSchema.index({ shift: 1 });
attendanceSchema.index({ status: 1 });

// Calculate total hours worked
attendanceSchema.pre('save', function (next) {
  if (this.clockIn.time && this.clockOut.time) {
    let totalMinutes = (this.clockOut.time - this.clockIn.time) / (1000 * 60);

    // Subtract break time
    if (this.breaks && this.breaks.length > 0) {
      const breakMinutes = this.breaks.reduce((total, brk) => {
        if (brk.end) {
          return total + (brk.end - brk.start) / (1000 * 60);
        }
        return total;
      }, 0);
      totalMinutes -= breakMinutes;
    }

    this.totalHours = Math.max(0, totalMinutes / 60);
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
