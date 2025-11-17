const CertificateModel = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const { ok, fail } = require('../utils/responses');
const { generateCertificatePDF } = require('../utils/certificatePdf');
const { generateQrDataUri } = require('../utils/qr');
const {
    issueCertificate,
    getCertificateForDownload,
    reissueCertificate,
    verifyCertificate,
} = require('../services/certificateService');
const { incrementAchievement } = require('../services/achievementService');

const CERTIFICATE_TYPES = CertificateModel.CERTIFICATE_TYPES || ['participation', 'completion', 'excellence'];

const formatFullName = (user) => `${user.firstname || ''} ${user.lastname || ''}`.trim();

exports.issueCertificate = async (req, res) => {
    try {
        const { certificateType = 'completion', programName, mentorId, statement, cohort, menteeId: menteeOverride } =
            req.body || {};

        if (!programName) {
            return fail(res, 400, 'PROGRAM_REQUIRED', 'Program name is required.');
        }
        if (!CERTIFICATE_TYPES.includes(certificateType)) {
            return fail(res, 400, 'INVALID_CERTIFICATE_TYPE', 'Unsupported certificate type.');
        }

        const targetMenteeId = req.user.role === 'admin' && menteeOverride ? menteeOverride : req.user.id;

        const certificate = await issueCertificate({
            menteeId: targetMenteeId,
            mentorId,
            requestedBy: req.user.role === 'admin' ? req.user.id : undefined,
            programName,
            certificateType,
            statement,
            cohort,
        });

        return ok(res, {
            certificate: {
                id: certificate._id,
                serialNumber: certificate.serialNumber,
                verificationCode: certificate.verificationCode,
                programName: certificate.programName,
                type: certificate.certificateType,
                pdfUrl: certificate.pdfAsset?.url,
            },
        });
    } catch (error) {
        const status = error.status || 500;
        const code = error.message || 'ISSUE_FAILED';
        return fail(res, status, code, 'Unable to issue certificate at this time.');
    }
};

exports.downloadCertificate = async (req, res) => {
    try {
        const certificate = await getCertificateForDownload({
            certificateId: req.params.id,
            requester: req.user,
        });

        const qrDataUri = certificate.qrCode?.dataUri || (await generateQrDataUri(certificate.verificationUrl));
        const buffer = await generateCertificatePDF({
            certificate,
            mentee: { fullName: formatFullName(certificate.user) },
            mentor: {
                fullName: certificate.metadata?.signedBy || formatFullName(certificate.mentor),
                title: certificate.metadata?.signerTitle || 'Mentor',
            },
            metrics: certificate.metrics || {},
            qrDataUri,
            brand: {
                primary: process.env.CERTIFICATE_COLOR_PRIMARY,
                accent: process.env.CERTIFICATE_COLOR_ACCENT,
            },
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.serialNumber}.pdf`);
        return res.send(buffer);
    } catch (error) {
        const status = error.status || 500;
        return fail(res, status, error.message || 'DOWNLOAD_FAILED', 'Unable to download certificate.');
    }
};

exports.reissueCertificate = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return fail(res, 403, 'FORBIDDEN', 'Only administrators may reissue certificates.');
        }
        const certificate = await reissueCertificate({
            certificateId: req.params.id,
            adminId: req.user.id,
            reason: req.body?.reason || 'reissue',
        });
        return ok(res, {
            certificate: {
                id: certificate._id,
                reissueCount: certificate.reissueCount,
                pdfUrl: certificate.pdfAsset?.url,
            },
        });
    } catch (error) {
        const status = error.status || 500;
        return fail(res, status, error.message || 'REISSUE_FAILED', 'Unable to reissue certificate.');
    }
};

exports.verifyCertificate = async (req, res) => {
    try {
        const payload = await verifyCertificate(req.params.code);
        return ok(res, { certificate: payload });
    } catch (error) {
        const status = error.status || 500;
        return fail(res, status, error.message || 'VERIFY_FAILED', 'Certificate could not be verified.');
    }
};

exports.listAchievements = async (req, res) => {
    try {
        const items = await Achievement.find({ user: req.user.id }).sort({ earnedAt: -1, createdAt: -1 }).lean();
        return ok(res, { achievements: items });
    } catch (error) {
        return fail(res, 500, 'ACHIEVEMENTS_FAILED', 'Failed to load achievements.');
    }
};

exports.triggerAchievement = async (req, res) => {
    try {
        const { code, delta = 1, title, description, icon, target = 1 } = req.body || {};
        if (!code) {
            return fail(res, 400, 'CODE_REQUIRED', 'Achievement code is required.');
        }
        const definition = title
            ? {
                  title,
                  description: description || '',
                  icon: icon || '🏅',
                  target,
                  category: 'custom',
                  color: '#10b981',
                  rewardPoints: 0,
              }
            : undefined;
        const achievement = await incrementAchievement({
            code,
            userId: req.user.id,
            delta,
            meta: req.body?.meta || {},
            overrideDefinition: definition,
        });
        return ok(res, { achievement });
    } catch (error) {
        return fail(res, 500, error.message || 'ACHIEVEMENT_FAILED', 'Unable to update achievement.');
    }
};
