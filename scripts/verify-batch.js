import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultLearnerExerciseState, getManifestExercises, isExerciseId, normalizeExerciseId, parseExerciseIdsFromMarkdown, } from '../src/shared/dev-cardio.js';
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const manifestPath = resolve(repositoryRoot, 'exercises/manifest.json');
const currentBatchPath = resolve(repositoryRoot, 'exercises/current-batch.md');
const learnerStatePath = resolve(repositoryRoot, 'progress/learner-state.json');
const conceptsPath = resolve(repositoryRoot, 'progress/concepts.json');
async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printHelp();
        return;
    }
    const ids = await resolveExerciseIds(args);
    if (ids.length === 0) {
        throw new Error('No exercise IDs were provided or found in exercises/current-batch.md.');
    }
    if (!existsSync(manifestPath)) {
        throw new Error('exercises/manifest.json is required to resolve test files.');
    }
    const manifest = await readJson(manifestPath);
    const exercises = getManifestExercises(manifest);
    const selected = ids.map((id) => {
        const exercise = exercises.find((candidate) => normalizeExerciseId(candidate.id) === id);
        if (!exercise) {
            throw new Error(`Exercise ${id} was not found in exercises/manifest.json.`);
        }
        return exercise;
    });
    const learnerState = await loadLearnerState();
    const concepts = await loadConcepts();
    const now = new Date().toISOString();
    const results = [];
    for (const exercise of selected) {
        results.push(runExerciseVerification(exercise, args, now));
    }
    applyVerificationUpdates(selected, results, learnerState, concepts, now);
    await writeJson(learnerStatePath, learnerState);
    await writeJson(conceptsPath, concepts);
    await writeJson(manifestPath, manifest);
    const passed = results.filter((result) => result.overallPass).length;
    console.log(`Verified ${results.length} exercise(s): ${passed}/${results.length} passing.`);
    for (const result of results) {
        console.log(`- ${result.id}: public=${formatOutcome(result.publicOutcome)} boss=${formatOutcome(result.bossOutcome)} overall=${result.overallPass ? 'pass' : 'fail'}`);
    }
    if (results.some((result) => !result.overallPass)) {
        process.exitCode = 1;
    }
}
function parseArgs(argv) {
    const ids = [];
    let current = false;
    let help = false;
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--help' || arg === '-h') {
            help = true;
            continue;
        }
        if (arg === '--current') {
            current = true;
            continue;
        }
        if (arg === '--ids') {
            ids.push(...splitIdList(argv[index + 1] ?? ''));
            index += 1;
            continue;
        }
        if (arg.startsWith('--ids=')) {
            ids.push(...splitIdList(arg.slice('--ids='.length)));
            continue;
        }
        if (isExerciseId(arg)) {
            ids.push(normalizeExerciseId(arg));
            continue;
        }
        throw new Error(`Unrecognized argument: ${arg}`);
    }
    return {
        current,
        help,
        ids: [...new Set(ids)],
    };
}
function splitIdList(value) {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map(normalizeExerciseId)
        .filter(isExerciseId);
}
async function resolveExerciseIds(args) {
    if (args.ids.length > 0) {
        return args.ids;
    }
    if (args.current || existsSync(currentBatchPath)) {
        if (!existsSync(currentBatchPath)) {
            return [];
        }
        const markdown = await readFile(currentBatchPath, 'utf8');
        return parseExerciseIdsFromMarkdown(markdown);
    }
    return [];
}
function printHelp() {
    console.log(`Usage: node scripts/verify-batch.js [--current] [--ids D1-E01,D1-E02] [D1-E03 ...]\n\nRuns public and boss tests for the selected exercises, then updates progress/learner-state.json and exercises/manifest.json without changing explanation flags.`);
}
function runExerciseVerification(exercise, args, timestamp) {
    const publicFiles = resolveTestFiles(exercise.publicTestFiles);
    const bossFiles = resolveTestFiles(exercise.bossTestFiles ?? []);
    const trackedFiles = [...new Set([...publicFiles, ...bossFiles])];
    if (publicFiles.length === 0) {
        console.warn(`[warn] ${exercise.id}: no public test files resolved.`);
    }
    const publicOutcome = runVitest(exercise.id, 'public', publicFiles, args, timestamp);
    const bossOutcome = bossFiles.length > 0 ? runVitest(exercise.id, 'boss', bossFiles, args, timestamp) : 'not-applicable';
    const overallPass = publicOutcome === 'pass' && (bossOutcome === 'not-applicable' || bossOutcome === 'pass');
    return {
        id: normalizeExerciseId(exercise.id),
        publicOutcome,
        bossOutcome,
        overallPass,
        trackedFiles: trackedFiles.map((filePath) => relative(repositoryRoot, filePath)),
    };
}
function resolveTestFiles(filePaths) {
    return filePaths
        .map((filePath) => resolve(repositoryRoot, filePath))
        .filter((filePath) => existsSync(filePath));
}
function runVitest(exerciseId, suiteName, filePaths, _args, _timestamp) {
    if (filePaths.length === 0) {
        return 'missing';
    }
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const vitestArgs = ['--no-install', 'vitest', 'run', '--config', 'vite.config.js', ...filePaths.map((filePath) => relative(repositoryRoot, filePath))];
    console.log(`\n[verify] ${exerciseId} ${suiteName}: ${vitestArgs.slice(2).join(' ')}`);
    const result = spawnSync(command, vitestArgs, {
        cwd: repositoryRoot,
        stdio: 'inherit',
    });
    if (typeof result.status === 'number' && result.status === 0) {
        return 'pass';
    }
    return 'fail';
}
function applyVerificationUpdates(selected, results, learnerState, concepts, verifiedAt) {
    learnerState.lastVerifiedAt = verifiedAt;
    const resultById = new Map(results.map((result) => [result.id, result]));
    let firstAttemptPasses = 0;
    let explanationCount = 0;
    let strongHintCount = 0;
    for (const exercise of selected) {
        const id = normalizeExerciseId(exercise.id);
        const result = resultById.get(id);
        if (!result) {
            continue;
        }
        const existingState = learnerState.exercises[id] ?? defaultLearnerExerciseState();
        const nextState = {
            ...existingState,
            attempts: existingState.attempts + 1,
            publicTestsPass: result.publicOutcome === 'pass',
            bossTestsPass: result.bossOutcome === 'not-applicable'
                ? existingState.bossTestsPass
                : result.bossOutcome === 'pass',
            lastVerifiedAt: verifiedAt,
            lastResult: result.overallPass ? 'pass' : 'fail',
            testFiles: result.trackedFiles,
        };
        if (result.overallPass) {
            nextState.status = nextState.explanationRecorded ? 'complete' : 'tests-pass';
            if (nextState.attempts === 1) {
                firstAttemptPasses += 1;
            }
        }
        else if (nextState.hintLevelUsed === 3) {
            nextState.status = 'supported';
        }
        else {
            nextState.status = 'in-progress';
        }
        if (nextState.explanationRecorded) {
            explanationCount += 1;
        }
        if (nextState.hintLevelUsed === 3) {
            strongHintCount += 1;
        }
        learnerState.exercises[id] = nextState;
        exercise.completion.publicTestsPass = result.publicOutcome === 'pass';
        if (exercise.bossTestFiles?.length) {
            exercise.completion.bossTestsPass = result.bossOutcome === 'pass';
        }
        exercise.telemetry.attempts = (exercise.telemetry.attempts ?? 0) + 1;
        exercise.telemetry.hintLevelUsed = nextState.hintLevelUsed;
        if (typeof nextState.activeMinutes === 'number') {
            exercise.telemetry.activeMinutes = nextState.activeMinutes;
        }
        updateConceptMastery(exercise, result.overallPass, nextState, concepts);
    }
    learnerState.batches.push({
        batchId: `verify-${verifiedAt}`,
        exerciseIds: selected.map((exercise) => normalizeExerciseId(exercise.id)),
        verifiedAt,
        passRate: round(results.filter((result) => result.overallPass).length / results.length),
        firstAttemptRate: round(firstAttemptPasses / results.length),
        explanationRate: round(explanationCount / results.length),
        strongHintCount,
    });
    learnerState.batches = learnerState.batches.slice(-20);
    learnerState.recentBatchIds = selected.map((exercise) => normalizeExerciseId(exercise.id));
}
function updateConceptMastery(exercise, passed, learnerState, concepts) {
    for (const conceptName of exercise.concepts) {
        const current = concepts.concepts[conceptName] ?? {
            mastery: 0,
            successfulUses: 0,
            recentFailures: 0,
            lastSeenExercise: null,
            highestLevelPassed: 0,
            needsSpacedReview: false,
        };
        const hadPriorSuccess = current.successfulUses > 0;
        const correctness = passed ? 1 : 0;
        const independence = Math.max(0, 1 - learnerState.hintLevelUsed * 0.25);
        const explanation = learnerState.explanationRecorded ? 1 : 0;
        const edgeCaseCoverage = learnerState.learnerTestsAdded > 0 ? 1 : 0;
        const retention = hadPriorSuccess ? correctness : 0.5;
        const quality = 0.45 * correctness
            + 0.2 * independence
            + 0.15 * explanation
            + 0.1 * edgeCaseCoverage
            + 0.1 * retention;
        const regressionPenalty = !passed && current.mastery >= 0.75 ? 0.1 : 0;
        current.mastery = Number(Math.min(1, Math.max(0, current.mastery * 0.75 + quality * 0.25 - regressionPenalty)).toFixed(3));
        current.successfulUses += passed ? 1 : 0;
        current.recentFailures = passed ? 0 : current.recentFailures + 1;
        current.lastSeenExercise = exercise.id;
        current.highestLevelPassed = passed ? Math.max(current.highestLevelPassed, exercise.level) : current.highestLevelPassed;
        current.needsSpacedReview = !passed && hadPriorSuccess;
        concepts.concepts[conceptName] = current;
    }
}
function formatOutcome(outcome) {
    return outcome;
}
function round(value) {
    return Number(value.toFixed(2));
}
async function loadLearnerState() {
    if (!existsSync(learnerStatePath)) {
        return {
            version: 1,
            currentDay: 1,
            dailyTarget: 10,
            currentBatchNumber: 0,
            lastVerifiedAt: null,
            historySummaryPath: 'progress/history-summary.json',
            recentBatchIds: [],
            exercises: {},
            batches: [],
        };
    }
    return readJson(learnerStatePath);
}
async function loadConcepts() {
    if (!existsSync(conceptsPath)) {
        return { version: 1, concepts: {} };
    }
    return readJson(conceptsPath);
}
async function readJson(filePath) {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content);
}
async function writeJson(filePath, value) {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[verify-batch] ${message}`);
    process.exitCode = 1;
});
