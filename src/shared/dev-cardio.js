export const EXERCISE_ID_PATTERN = /\bD\d+-E\d+\b/gi;
export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
export function isExerciseId(value) {
    return /^D\d+-E\d+$/i.test(value.trim());
}
export function normalizeExerciseId(value) {
    return value.trim().toUpperCase();
}
export function uniqueExerciseIds(values) {
    return [...new Set(values.map(normalizeExerciseId).filter(isExerciseId))];
}
export function parseExerciseIdsFromMarkdown(markdown) {
    const explicitMatches = [...markdown.matchAll(/Exercise\s+(D\d+-E\d+)/gi)].map((match) => match[1]);
    if (explicitMatches.length > 0) {
        return uniqueExerciseIds(explicitMatches);
    }
    const fallbackMatches = markdown.match(EXERCISE_ID_PATTERN) ?? [];
    return uniqueExerciseIds(fallbackMatches);
}
export function defaultLearnerExerciseState() {
    return {
        status: 'not-started',
        attempts: 0,
        hintLevelUsed: 0,
        activeMinutes: null,
        startedAt: null,
        pausedAt: null,
        completedAt: null,
        publicTestsPass: false,
        bossTestsPass: null,
        explanationRecorded: false,
        learnerTestsAdded: 0,
        lastVerifiedAt: null,
        lastResult: 'not-run',
        lastCommit: null,
        testFiles: [],
    };
}
export function getManifestExercises(manifest) {
    return Array.isArray(manifest) ? manifest : manifest.exercises;
}
export function isExerciseComplete(exercise, learnerState) {
    const publicTestsPass = learnerState?.publicTestsPass ?? exercise.completion.publicTestsPass;
    const explanationRecorded = learnerState?.explanationRecorded ?? exercise.completion.explanationRecorded;
    const hasBossTests = Boolean(exercise.bossTestFiles?.length);
    const bossTestsPass = hasBossTests
        ? (learnerState?.bossTestsPass ?? exercise.completion.bossTestsPass ?? false)
        : true;
    return publicTestsPass && explanationRecorded && bossTestsPass;
}
export function prerequisiteSatisfied(prerequisite, completedExerciseIds, concepts) {
    const normalized = prerequisite.trim();
    if (isExerciseId(normalized)) {
        return completedExerciseIds.has(normalizeExerciseId(normalized));
    }
    const conceptRequirement = normalized.replace(/^concept:/i, '');
    const thresholdMatch = conceptRequirement.match(/^(.+?)\s*>=\s*(0(?:\.\d+)?|1(?:\.0+)?)$/);
    if (thresholdMatch) {
        const [, conceptName, rawThreshold] = thresholdMatch;
        return (concepts[conceptName.trim()]?.mastery ?? 0) >= Number(rawThreshold);
    }
    const concept = concepts[conceptRequirement];
    return (concept?.mastery ?? 0) >= 0.75 || (concept?.successfulUses ?? 0) > 0;
}
export function formatTargetActiveTime(level) {
    switch (level) {
        case 1:
            return '10–15 minutes';
        case 2:
            return '15–25 minutes';
        case 3:
            return '25–35 minutes';
        case 4:
            return '35–50 minutes';
        case 5:
            return '45–60 minutes';
    }
}
export function stableExerciseSort(left, right) {
    return left.day - right.day || left.level - right.level || left.id.localeCompare(right.id);
}
