import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getManifestExercises, normalizeExerciseId, } from '../src/shared/dev-cardio.js';
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const manifestPath = resolve(repositoryRoot, 'exercises/manifest.json');
const learnerStatePath = resolve(repositoryRoot, 'progress/learner-state.json');
const defaultOutputPath = resolve(repositoryRoot, 'progress/history-summary.json');
async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printHelp();
        return;
    }
    const manifestExercises = await loadManifestExercises();
    const exerciseIndex = new Map(manifestExercises.map((exercise) => [normalizeExerciseId(exercise.id), exercise]));
    const learnerState = await loadLearnerState();
    const summary = isGitRepository()
        ? buildGitSummary(readGitHistory(), exerciseIndex, learnerState)
        : buildEmptySummary(['Git metadata is unavailable in the current working tree.']);
    await writeJson(args.outputPath, summary);
    console.log(`Wrote safe history summary to ${relativeToRoot(args.outputPath)}.`);
    console.log(`cardio commits=${summary.totals.cardioCommits}, exercise commits=${summary.totals.exerciseCommits}, reflections=${summary.totals.reflectionCommits}`);
}
function parseArgs(argv) {
    let help = false;
    let outputPath = defaultOutputPath;
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--help' || arg === '-h') {
            help = true;
            continue;
        }
        if (arg === '--output') {
            outputPath = resolve(repositoryRoot, argv[index + 1] ?? 'progress/history-summary.json');
            index += 1;
            continue;
        }
        if (arg.startsWith('--output=')) {
            outputPath = resolve(repositoryRoot, arg.slice('--output='.length));
            continue;
        }
        throw new Error(`Unrecognized argument: ${arg}`);
    }
    return { help, outputPath };
}
function printHelp() {
    console.log(`Usage: node scripts/summarize-history.js [--output progress/history-summary.json]\n\nCollects safe git metrics and recorded active minutes without inferring work time from commit gaps.`);
}
function isGitRepository() {
    try {
        execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
            cwd: repositoryRoot,
            stdio: 'ignore',
        });
        return true;
    }
    catch {
        return false;
    }
}
function readGitHistory() {
    const raw = execFileSync('git', ['log', '--date=iso-strict', '--pretty=format:__COMMIT__%n%H%n%ad%n%s', '--numstat'], { cwd: repositoryRoot, encoding: 'utf8' });
    const sections = raw.split('__COMMIT__\n').map((chunk) => chunk.trim()).filter(Boolean);
    return sections.map((section) => {
        const lines = section.split(/\r?\n/);
        const [hash = '', date = '', subject = '', ...rest] = lines;
        const files = rest
            .map((line) => line.trim())
            .filter(Boolean)
            .map(parseNumstatLine)
            .filter((item) => item !== null);
        return { hash, date, subject, files };
    });
}
function parseNumstatLine(line) {
    const parts = line.split(/\t+/);
    if (parts.length < 3) {
        return null;
    }
    return {
        insertions: Number(parts[0]) || 0,
        deletions: Number(parts[1]) || 0,
        filePath: parts[2],
    };
}
function buildGitSummary(commits, exerciseIndex, learnerState) {
    const branch = safeGitValue(['rev-parse', '--abbrev-ref', 'HEAD']);
    const summary = {
        version: 1,
        generatedAt: new Date().toISOString(),
        gitAvailable: true,
        branch,
        totals: {
            cardioCommits: 0,
            exerciseCommits: 0,
            reflectionCommits: 0,
            fixOrRevertCommits: 0,
            recoveredExercises: 0,
        },
        exercises: {},
        recentExerciseIds: [],
        comparableActiveMinutes: buildComparableMinutes(learnerState, exerciseIndex),
        warnings: [
            'No active time is inferred from commit timestamps. Comparable minutes come only from progress/learner-state.json.',
        ],
    };
    const recovered = new Set();
    const recentExerciseIds = [];
    for (const commit of commits) {
        const subject = commit.subject.toLowerCase();
        const relatedIds = collectExerciseIds(commit.subject, commit.files.map((file) => file.filePath));
        const isCardioCommit = subject.includes('cardio(') || relatedIds.length > 0;
        const isReflectionCommit = subject.includes('reflection');
        const isFixCommit = /\bfix\b|\bregression\b/.test(subject);
        const isRevertCommit = /\brevert\b/.test(subject);
        const isPassCommit = /\bpass\b|\bcomplete\b/.test(subject);
        if (isCardioCommit) {
            summary.totals.cardioCommits += 1;
        }
        if (isReflectionCommit) {
            summary.totals.reflectionCommits += 1;
        }
        if (isFixCommit || isRevertCommit) {
            summary.totals.fixOrRevertCommits += 1;
        }
        if (relatedIds.length === 0) {
            continue;
        }
        summary.totals.exerciseCommits += 1;
        for (const id of relatedIds) {
            const manifestExercise = exerciseIndex.get(id);
            const existing = summary.exercises[id] ?? {
                commitCount: 0,
                passCommits: 0,
                fixCommits: 0,
                revertCommits: 0,
                insertions: 0,
                deletions: 0,
                lastCommit: null,
                level: manifestExercise?.level ?? null,
                context: manifestExercise?.context ?? null,
                concepts: manifestExercise?.concepts ?? [],
            };
            existing.commitCount += 1;
            existing.passCommits += isPassCommit ? 1 : 0;
            existing.fixCommits += isFixCommit ? 1 : 0;
            existing.revertCommits += isRevertCommit ? 1 : 0;
            existing.insertions += commit.files.reduce((total, file) => total + file.insertions, 0);
            existing.deletions += commit.files.reduce((total, file) => total + file.deletions, 0);
            existing.lastCommit = commit.hash;
            summary.exercises[id] = existing;
            if (isFixCommit) {
                recovered.add(id);
            }
            if (isPassCommit && recovered.has(id)) {
                summary.totals.recoveredExercises += 1;
                recovered.delete(id);
            }
            if (!recentExerciseIds.includes(id)) {
                recentExerciseIds.push(id);
            }
        }
    }
    summary.recentExerciseIds = recentExerciseIds.slice(0, 5);
    return summary;
}
function collectExerciseIds(subject, filePaths) {
    const matches = new Set();
    const combined = [subject, ...filePaths].join(' ');
    for (const match of combined.match(/\bD\d+-E\d+\b/gi) ?? []) {
        matches.add(normalizeExerciseId(match));
    }
    return [...matches];
}
function buildComparableMinutes(learnerState, exerciseIndex) {
    const groups = new Map();
    for (const [id, state] of Object.entries(learnerState.exercises)) {
        const exercise = exerciseIndex.get(id);
        if (!exercise || typeof state.activeMinutes !== 'number') {
            continue;
        }
        const groupKey = `L${exercise.level}:${exercise.context}`;
        const bucket = groups.get(groupKey) ?? [];
        bucket.push({ id, minutes: state.activeMinutes });
        groups.set(groupKey, bucket);
    }
    return {
        note: 'Uses learner-state.activeMinutes only; never uses commit timestamp gaps as active time.',
        groups: [...groups.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, bucket]) => ({
            key,
            sampleSize: bucket.length,
            medianMinutes: median(bucket.map((item) => item.minutes)),
            exerciseIds: bucket.map((item) => item.id).slice(-5),
        })),
    };
}
function median(values) {
    const sorted = [...values].sort((left, right) => left - right);
    if (sorted.length === 0) {
        return 0;
    }
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
        return sorted[middle];
    }
    return Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(2));
}
function buildEmptySummary(warnings) {
    return {
        version: 1,
        generatedAt: new Date().toISOString(),
        gitAvailable: false,
        branch: null,
        totals: {
            cardioCommits: 0,
            exerciseCommits: 0,
            reflectionCommits: 0,
            fixOrRevertCommits: 0,
            recoveredExercises: 0,
        },
        exercises: {},
        recentExerciseIds: [],
        comparableActiveMinutes: {
            note: 'Uses learner-state.activeMinutes only; never uses commit timestamp gaps as active time.',
            groups: [],
        },
        warnings,
    };
}
function safeGitValue(args) {
    try {
        return execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim() || null;
    }
    catch {
        return null;
    }
}
async function loadManifestExercises() {
    if (!existsSync(manifestPath)) {
        return [];
    }
    const manifest = await readJson(manifestPath);
    return getManifestExercises(manifest);
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
function relativeToRoot(filePath) {
    return filePath.startsWith(repositoryRoot) ? filePath.slice(repositoryRoot.length + 1) : filePath;
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
    console.error(`[summarize-history] ${message}`);
    process.exitCode = 1;
});
