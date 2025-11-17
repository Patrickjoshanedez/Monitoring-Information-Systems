const Achievement = require('../models/Achievement');
const { sendNotification } = require('../utils/notificationService');

const ACHIEVEMENT_DEFINITIONS = {
    FIRST_CERTIFICATE: {
        title: 'Certified Trailblazer',
        description: 'Earn your first mentorship certificate.',
        icon: '🥇',
        target: 1,
        category: 'certificates',
        color: '#2563eb',
        rewardPoints: 25,
    },
    CERTIFICATE_COLLECTOR: {
        title: 'Certificate Collector',
        description: 'Collect three mentorship certificates.',
        icon: '🏆',
        target: 3,
        category: 'certificates',
        color: '#f97316',
        rewardPoints: 75,
    },
};

const bootstrapAchievement = (definition, code, userId) => ({
    user: userId,
    code,
    title: definition.title,
    description: definition.description,
    icon: definition.icon,
    category: definition.category,
    color: definition.color,
    rewardPoints: definition.rewardPoints,
    progress: {
        target: definition.target,
        unit: 'count',
    },
});

const persistAchievement = async ({ definition, code, userId, meta, delta }) => {
    let achievement = await Achievement.findOne({ user: userId, code });
    if (!achievement) {
        achievement = await Achievement.create(bootstrapAchievement(definition, code, userId));
    }

    if (achievement.status === 'unlocked') {
        return achievement;
    }

    if (!achievement.progress) {
        achievement.progress = { current: 0, target: definition.target, unit: 'count' };
    }

    achievement.progress.current = Math.min(
        definition.target,
        (achievement.progress.current || 0) + (delta || 1)
    );
    achievement.lastProgressAt = new Date();
    achievement.meta = { ...achievement.meta, ...meta };

    if (achievement.progress.current >= definition.target) {
        achievement.status = 'unlocked';
        achievement.earnedAt = new Date();
        await achievement.save();
        await sendNotification({
            userId,
            type: 'ACHIEVEMENT_UNLOCKED',
            title: `${definition.title} unlocked`,
            message: definition.description,
            data: { code },
        });
    } else {
        achievement.status = 'in_progress';
        await achievement.save();
    }

    return achievement;
};

const incrementAchievement = async ({ code, userId, delta = 1, meta = {}, overrideDefinition }) => {
    const definition = overrideDefinition || ACHIEVEMENT_DEFINITIONS[code];
    if (!definition) {
        throw new Error(`Unknown achievement code: ${code}`);
    }
    return persistAchievement({ definition, code, userId, meta, delta });
};

const recordCertificateAchievements = async ({ userId, certificateType, serialNumber }) => {
    const results = [];
    results.push(
        await incrementAchievement({
            code: 'FIRST_CERTIFICATE',
            userId,
            meta: { certificateType, serialNumber },
        })
    );
    results.push(
        await incrementAchievement({
            code: 'CERTIFICATE_COLLECTOR',
            userId,
            meta: { certificateType, serialNumber },
        })
    );
    return results;
};

module.exports = {
    recordCertificateAchievements,
    incrementAchievement,
    ACHIEVEMENT_DEFINITIONS,
};
