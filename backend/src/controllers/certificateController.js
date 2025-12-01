const CertificateModel = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const AuditLog = require('../models/AuditLog');
const { ok, fail } = require('../utils/responses');
const { generateCertificatePDF } = require('../utils/certificatePdf');
const { generateQrDataUri } = require('../utils/qr');
const {
    issueCertificate,
    getCertificateForDownload,
    reissueCertificate,
    verifyCertificate,
    signCertificate,
} = require('../services/certificateService');
const { incrementAchievement } = require('../services/achievementService');
const { sendNotification } = require('../utils/notificationService');

const CERTIFICATE_TYPES = CertificateModel.CERTIFICATE_TYPES || ['participation', 'completion', 'excellence'];

const formatFullName = (user) => `${user.firstname || ''} ${user.lastname || ''}`.trim();

const resolveUserName = (user) => {
    if (!user || typeof user !== 'object') {
        return '';
    }
    return user.profile?.displayName || formatFullName(user);
};

const resolveUserId = (user) => {
    if (!user) {
        return null;
    }
    if (typeof user === 'string') {
        return user;
    }
    if (user._id) {
        return user._id.toString();
    }
    if (typeof user.toString === 'function') {
        return user.toString();
    }
    return null;
};

const formatCertificateListItem = (certificate) => ({
    id: certificate._id.toString(),
    programName: certificate.programName,
    cohort: certificate.cohort,
    certificateType: certificate.certificateType,
    status: certificate.status,
    issuedAt: certificate.issuedAt,
    mentorName: certificate.metadata?.signedBy || certificate.mentor?.displayName || formatFullName(certificate.mentor || {}),
    mentorId: certificate.mentor?._id ? certificate.mentor._id.toString() : null,
    menteeId: resolveUserId(certificate.user),
    menteeName: resolveUserName(certificate.user),
    menteeStudentId: certificate.user?.studentId,
    serialNumber: certificate.serialNumber,
    verificationCode: certificate.verificationCode,
    verificationUrl: certificate.verificationUrl,
    pdfUrl: certificate.pdfAsset?.url,
    reissueCount: certificate.reissueCount || 0,
    signatureStatus: certificate.signature?.signedAt ? 'signed' : 'pending',
    signature: certificate.signature
        ? {
              signedAt: certificate.signature.signedAt,
              signedByName: certificate.signature.signedByName,
              signedByTitle: certificate.signature.signedByTitle,
              statement: certificate.signature.statement,
              method: certificate.signature.method,
          }
        : null,
});

exports.listCertificates = async (req, res) => {
    try {
        let filter;
        if (req.user.role === 'mentor') {
            filter = { mentor: req.user.id };
        } else if (req.user.role === 'admin') {
            filter = {};
        } else {
            filter = { user: req.user.id };
        }

        const certificates = await CertificateModel.find(filter)
            .sort({ issuedAt: -1 })
            .limit(50)
            .populate('mentor', 'firstname lastname profile.displayName')
            .populate('user', 'firstname lastname profile.displayName studentId')
            .lean();

        return ok(res, {
            certificates: certificates.map(formatCertificateListItem),
        });
    } catch (error) {
        return fail(res, 500, 'CERTIFICATES_FAILED', error.message || 'Unable to load certificates.');
    }
};

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

        const isAdmin = req.user.role === 'admin';
        const certificate = await issueCertificate({
            menteeId: targetMenteeId,
            mentorId,
            requestedBy: isAdmin ? req.user.id : undefined,
            programName,
            certificateType,
            statement,
            cohort,
            allowEligibilityOverride: isAdmin,
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
        const code = error.message || 'DOWNLOAD_FAILED';
        const message = code === 'SIGNATURE_PENDING'
            ? 'Certificate is pending mentor verification. You will be notified once it is signed.'
            : 'Unable to download certificate.';
        return fail(res, status, code, message);
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

exports.requestReissue = async (req, res) => {
    try {
        if (req.user.role !== 'mentee') {
            return fail(res, 403, 'FORBIDDEN', 'Only mentees can request certificate reissues.');
        }

        const certificate = await CertificateModel.findOne({ _id: req.params.id, user: req.user.id })
            .populate('mentor', 'firstname lastname profile.displayName')
            .lean();

        if (!certificate) {
            return fail(res, 404, 'NOT_FOUND', 'Certificate not found.');
        }

        const reason = (req.body?.reason || 'Mentee requested a certificate reissue.').trim();

        await AuditLog.create({
            actorId: req.user.id,
            action: 'certificate.reissue_request',
            resourceType: 'certificate',
            resourceId: certificate._id.toString(),
            metadata: { reason },
        });

        if (certificate.mentor?._id) {
            await sendNotification({
                userId: certificate.mentor._id,
                type: 'CERTIFICATE_REISSUE_REQUEST',
                title: 'Certificate reissue requested',
                message: `${req.user.name || 'Your mentee'} asked for a certificate reissue.`,
                data: {
                    certificateId: certificate._id,
                    menteeId: req.user.id,
                    reason,
                },
            });
        }

        return ok(res, { acknowledged: true });
    } catch (error) {
        return fail(res, 500, 'REISSUE_REQUEST_FAILED', error.message || 'Unable to submit reissue request.');
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

exports.signCertificate = async (req, res) => {
    if (req.user.role !== 'mentor') {
        return fail(res, 403, 'FORBIDDEN', 'Only mentors may sign certificates.');
    }

    try {
        const certificate = await signCertificate({
            certificateId: req.params.id,
            mentorId: req.user.id,
            signerTitle: req.body?.title,
            statement: req.body?.statement,
            ipAddress: req.ip,
        });

        return ok(res, { certificate: formatCertificateListItem(certificate) });
    } catch (error) {
        const status = error.status || 500;
        const code = error.message || 'SIGN_FAILED';
        return fail(res, status, code, 'Unable to sign certificate.');
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
