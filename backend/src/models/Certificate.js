const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    programName: { type: String, required: true },
    certificateType: { type: String, enum: ['participation', 'completion'], required: true },
    issuedAt: { type: Date, default: Date.now },
    issuanceLog: [
      {
        issuedAt: { type: Date, default: Date.now },
        issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin or system
        reason: { type: String, default: 'initial' },
      },
    ],
    reissueCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', CertificateSchema);
