const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: function() { return !this.googleId; }, trim: true },
    lastname: { type: String, required: function() { return !this.googleId; }, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ['mentee', 'mentor', 'admin'], default: null },
    googleId: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    
    // Application fields for mentees
    applicationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted'
    },
    applicationRole: {
      type: String,
      enum: ['mentee', 'mentor', 'admin'],
      default: null
    },
    applicationData: {
      yearLevel: { type: String },
      program: { type: String },
      specificSkills: { type: String },
      corUrl: { type: String },
      major: { type: String },
      programmingLanguage: { type: String },
      motivation: { type: String },
      currentRole: { type: String },
      organization: { type: String },
      yearsOfExperience: { type: Number },
      expertiseAreas: [{ type: String }],
      mentoringTopics: [{ type: String }],
      mentoringGoals: { type: String },
      interests: [{ type: String }],
      professionalSummary: { type: String },
      achievements: { type: String },
      linkedinUrl: { type: String },
      portfolioUrl: { type: String },
      availabilityDays: [{ type: String }],
      availabilityHoursPerWeek: { type: Number },
      meetingFormats: [{ type: String }],
      supportingDocumentUrl: { type: String }
    },
    applicationSubmittedAt: { type: Date },
    applicationReviewedAt: { type: Date },
    applicationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Indexes for common queries
// Optimize mentor directory lookups and general auth by role/status and email
userSchema.index({ role: 1, applicationStatus: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);


