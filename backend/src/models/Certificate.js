const mongoose = require('mongoose');

const CERTIFICATE_TYPES = ['participation', 'completion', 'excellence'];
const CERTIFICATE_STATUSES = ['active', 'revoked', 'expired'];

const issuanceLogSchema = new mongoose.Schema(
  {
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    channel: {
      type: String,
      enum: ['system', 'admin', 'self-service'],
      default: 'system',
    },
    reason: { type: String, default: 'initial', trim: true },
    notes: { type: String, trim: true },
    pdfUrl: { type: String, trim: true },
  },
  { _id: false }
);

const assetSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
    bytes: { type: Number, min: 0 },
    checksum: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const qrSchema = new mongoose.Schema(
  {
    payload: { type: String, trim: true },
    dataUri: { type: String },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const metricSchema = new mongoose.Schema(
  {
    totalSessions: { type: Number, default: 0, min: 0 },
    completedSessions: { type: Number, default: 0, min: 0 },
    totalHours: { type: Number, default: 0, min: 0 },
    goalsCompleted: { type: Number, default: 0, min: 0 },
    mentorRatingAvg: { type: Number, min: 0, max: 5 },
  },
  { _id: false }
);

const CertificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    programName: { type: String, required: true, trim: true },
    cohort: { type: String, trim: true },
    certificateType: { type: String, enum: CERTIFICATE_TYPES, default: 'completion' },
    status: { type: String, enum: CERTIFICATE_STATUSES, default: 'active' },
    statement: { type: String, trim: true },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    serialNumber: { type: String, required: true, unique: true, index: true },
    verificationCode: { type: String, required: true, unique: true, index: true },
    verificationUrl: { type: String, required: true },
  checksum: { type: String, trim: true },
    pdfAsset: assetSchema,
    qrCode: qrSchema,
    badgeUrl: { type: String, trim: true },
    metadata: {
      signedBy: { type: String, trim: true },
      signerTitle: { type: String, trim: true },
      sealUrl: { type: String, trim: true },
    },
    metrics: metricSchema,
    issuanceLog: { type: [issuanceLogSchema], default: [] },
    reissueCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CertificateSchema.index({ user: 1, certificateType: 1, status: 1 });
CertificateSchema.index({ mentor: 1, issuedAt: -1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
module.exports.CERTIFICATE_TYPES = CERTIFICATE_TYPES;
module.exports.CERTIFICATE_STATUSES = CERTIFICATE_STATUSES;
