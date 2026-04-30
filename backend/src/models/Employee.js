const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    hireDate: {
      type: Date,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'temporary'],
      default: 'full-time',
    },
    status: {
      type: String,
      enum: ['active', 'on-leave', 'suspended', 'terminated'],
      default: 'active',
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
    salary: {
      type: Number,
      min: 0,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    qualifications: [
      {
        name: String,
        institution: String,
        year: Number,
        document: String,
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        document: String,
      },
    ],
    availability: {
      monday: { available: Boolean, start: String, end: String },
      tuesday: { available: Boolean, start: String, end: String },
      wednesday: { available: Boolean, start: String, end: String },
      thursday: { available: Boolean, start: String, end: String },
      friday: { available: Boolean, start: String, end: String },
      saturday: { available: Boolean, start: String, end: String },
      sunday: { available: Boolean, start: String, end: String },
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
employeeSchema.index({ user: 1 });
employeeSchema.index({ status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
