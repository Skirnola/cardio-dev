import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clamp,
  defaultLearnerExerciseState,
  formatTargetActiveTime,
  getManifestExercises,
  isExerciseComplete,
  normalizeExerciseId,
  prerequisiteSatisfied,
  stableExerciseSort,
  type ConceptsFile,
  type Exercise,
  type HistorySummary,
  type LearnerState,
  type ManifestShape,
} from '../src/shared/dev-cardio.ts';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const manifestPath = resolve(repositoryRoot, 'exercises/manifest.json');
const learnerStatePath = resolve(repositoryRoot, 'progress/learner-state.json');
const conceptsPath = resolve(repositoryRoot, 'progress/concepts.json');
const defaultHistorySummaryPath = resolve(repositoryRoot, 'progress/history-summary.json');
const currentBatchPath = resolve(repositoryRoot, 'exercises/current-batch.md');

type GenerationArgs = {
  help: boolean;
  outputPath: string;
};

type DifficultyAction = 'raise' | 'hold' | 'support' | 'step-back';

type BatchEvidence = {
  action: DifficultyAction;
  weakestConcept: string | null;
  strongestTransferConcept: string | null;
  dueReviewConcept: string | null;
  recentStrongHints: string[];
  lastBatchPassRate: number | null;
  historyRecoveredExercises: number;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (!existsSync(manifestPath)) {
    throw new Error('exercises/manifest.json is required before a batch can be generated.');
  }

  const manifest = await readJson<ManifestShape>(manifestPath);
  const exercises = getManifestExercises(manifest).slice().sort(stableExerciseSort);
  const learnerState = await loadLearnerState();
  const concepts = await loadConcepts();
  const historySummary = await loadHistorySummary(learnerState.historySummaryPath);

  const completedIds = new Set(
    exercises
      .filter((exercise) => isExerciseComplete(exercise, learnerState.exercises[normalizeExerciseId(exercise.id)]))
      .map((exercise) => normalizeExerciseId(exercise.id)),
  );

  const evidence = collectEvidence(learnerState, concepts, historySummary);
  const selected = selectExercises(exercises, learnerState, concepts, completedIds, evidence);

  if (selected.length < 2) {
    throw new Error('Fewer than two eligible incomplete exercises were found.');
  }

  const nextBatchNumber = learnerState.currentBatchNumber + 1;
  const batchDay = selected[0].day;
  const markdown = renderBatchMarkdown(selected, nextBatchNumber, batchDay, evidence, learnerState, concepts);

  await mkdir(dirname(args.outputPath), { recursive: true });
  await writeFile(args.outputPath, markdown, 'utf8');

  learnerState.currentBatchNumber = nextBatchNumber;
  learnerState.currentDay = batchDay;
  learnerState.recentBatchIds = selected.map((exercise) => normalizeExerciseId(exercise.id));
  await writeJson(learnerStatePath, learnerState);

  console.log(`Wrote ${relativeToRoot(args.outputPath)} with ${selected.length} exercise(s).`);
  console.log(buildConsoleSummary(selected, evidence));
}

function parseArgs(argv: string[]): GenerationArgs {
  let help = false;
  let outputPath = currentBatchPath;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }

    if (arg === '--output') {
      outputPath = resolve(repositoryRoot, argv[index + 1] ?? 'exercises/current-batch.md');
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

function printHelp(): void {
  console.log(`Usage: tsx scripts/generate-next-batch.ts [--output exercises/current-batch.md]\n\nSelects the next 2-5 eligible incomplete exercises from exercises/manifest.json and writes a learner-facing current batch without solutions.`);
}

function collectEvidence(
  learnerState: LearnerState,
  concepts: ConceptsFile,
  historySummary: HistorySummary | null,
): BatchEvidence {
  const lastBatch = learnerState.batches.at(-1) ?? null;
  const recentStrongHints = Object.entries(learnerState.exercises)
    .filter(([, state]) => state.hintLevelUsed === 3)
    .map(([id]) => id)
    .slice(-3);

  const weakestConcept = Object.entries(concepts.concepts)
    .sort((left, right) => left[1].mastery - right[1].mastery || left[0].localeCompare(right[0]))
    .find(([, concept]) => concept.successfulUses > 0 || concept.recentFailures > 0)?.[0] ?? null;

  const strongestTransferConcept = Object.entries(concepts.concepts)
    .sort((left, right) => right[1].mastery - left[1].mastery || left[0].localeCompare(right[0]))
    .find(([, concept]) => concept.mastery >= 0.75 && concept.successfulUses >= 2)?.[0] ?? null;

  const dueReviewConcept = Object.entries(concepts.concepts)
    .sort((left, right) => left[0].localeCompare(right[0]))
    .find(([, concept]) => concept.needsSpacedReview)?.[0] ?? null;

  const action = determineDifficultyAction(lastBatch?.passRate ?? null, lastBatch?.strongHintCount ?? 0, recentStrongHints.length);

  return {
    action,
    weakestConcept,
    strongestTransferConcept,
    dueReviewConcept,
    recentStrongHints,
    lastBatchPassRate: lastBatch?.passRate ?? null,
    historyRecoveredExercises: historySummary?.totals.recoveredExercises ?? 0,
  };
}

function determineDifficultyAction(
  lastBatchPassRate: number | null,
  lastBatchStrongHintCount: number,
  recentStrongHints: number,
): DifficultyAction {
  if (recentStrongHints >= 2 || lastBatchStrongHintCount >= 2) {
    return 'step-back';
  }

  if (lastBatchPassRate === null) {
    return 'hold';
  }

  if (lastBatchPassRate < 0.5) {
    return 'step-back';
  }

  if (lastBatchPassRate < 0.7) {
    return 'support';
  }

  if (lastBatchPassRate >= 0.85 && lastBatchStrongHintCount === 0) {
    return 'raise';
  }

  return 'hold';
}

function selectExercises(
  exercises: Exercise[],
  learnerState: LearnerState,
  concepts: ConceptsFile,
  completedIds: Set<string>,
  evidence: BatchEvidence,
): Exercise[] {
  const conceptMap = concepts.concepts;
  const seenConcepts = new Set(
    Object.entries(conceptMap)
      .filter(([, concept]) => concept.mastery > 0 || concept.successfulUses > 0)
      .map(([name]) => name),
  );

  const completedLevels = exercises
    .filter((exercise) => completedIds.has(normalizeExerciseId(exercise.id)))
    .map((exercise) => exercise.level);
  const baselineLevel = completedLevels.length > 0 ? medianNumber(completedLevels) : 1;
  const targetLevel =
    evidence.action === 'raise'
      ? clamp(baselineLevel + 1, 1, 5)
      : evidence.action === 'step-back'
        ? clamp(baselineLevel - 1, 1, 5)
        : baselineLevel;

  const reachableIds = new Set(completedIds);
  const eligible: Exercise[] = [];

  // Build a prerequisite-safe frontier. An exercise may enter the candidate pool
  // when its earlier exercise prerequisites are complete or can be scheduled
  // before it in the same batch.
  for (const exercise of exercises.slice().sort(stableExerciseSort)) {
    const id = normalizeExerciseId(exercise.id);
    if (completedIds.has(id)) {
      continue;
    }

    if (exercise.prerequisites.every((prerequisite) => prerequisiteSatisfied(prerequisite, reachableIds, conceptMap))) {
      eligible.push(exercise);
      reachableIds.add(id);
    }
  }

  if (eligible.length === 0) {
    return [];
  }

  const frontierDay = Math.min(...eligible.map((exercise) => exercise.day));
  const frontierCandidates = eligible.filter((exercise) => exercise.day === frontierDay);
  const candidatePool = frontierCandidates.length >= 2 ? frontierCandidates : eligible;

  const desiredSize = Math.min(5, Math.max(2, evidence.action === 'step-back' ? 3 : 4), candidatePool.length);
  const scored = candidatePool
    .map((exercise) => ({
      exercise,
      score: scoreExercise(exercise, learnerState, seenConcepts, targetLevel, evidence),
    }))
    .sort((left, right) => right.score - left.score || stableExerciseSort(left.exercise, right.exercise));

  const selection: Exercise[] = [];
  const availablePrerequisites = new Set(completedIds);

  while (selection.length < desiredSize) {
    const candidate = scored.find(({ exercise }) => {
      const id = normalizeExerciseId(exercise.id);
      if (availablePrerequisites.has(id)) {
        return false;
      }

      return exercise.prerequisites.every((prerequisite) =>
        prerequisiteSatisfied(prerequisite, availablePrerequisites, conceptMap),
      );
    });

    if (!candidate) {
      break;
    }

    selection.push(candidate.exercise);
    availablePrerequisites.add(normalizeExerciseId(candidate.exercise.id));
  }

  return selection.sort(stableExerciseSort);
}

function scoreExercise(
  exercise: Exercise,
  learnerState: LearnerState,
  seenConcepts: Set<string>,
  targetLevel: number,
  evidence: BatchEvidence,
): number {
  const id = normalizeExerciseId(exercise.id);
  const state = learnerState.exercises[id] ?? defaultLearnerExerciseState();
  let score = 0;

  if (exercise.concepts.some((concept) => concept === evidence.weakestConcept)) {
    score += 5;
  }
  if (exercise.concepts.some((concept) => concept === evidence.dueReviewConcept)) {
    score += 4;
  }
  if (exercise.concepts.some((concept) => concept === evidence.strongestTransferConcept)) {
    score += 2;
  }
  if (state.hintLevelUsed === 3 || state.status === 'supported') {
    score += 5;
  }
  if (state.attempts > 0 && !state.publicTestsPass) {
    score += 3;
  }
  if (exercise.concepts.some((concept) => seenConcepts.has(concept))) {
    score += 3;
  }
  if (exercise.context === 'combined' || exercise.context === 'production') {
    score += 1.5;
  }
  if (exercise.context === 'react') {
    score -= targetLevel < 3 ? 3 : 0;
  }
  if (exercise.context === 'boss') {
    score -= 2;
  }

  const levelDelta = exercise.level - targetLevel;
  if (evidence.action === 'raise') {
    score += levelDelta === 0 ? 2 : 0;
    score += levelDelta === 1 ? 1 : 0;
    score -= Math.max(0, levelDelta - 1) * 4;
  } else if (evidence.action === 'step-back') {
    score += levelDelta <= 0 ? 2 : 0;
    score -= Math.max(0, levelDelta) * 5;
  } else {
    score += Math.abs(levelDelta) <= 1 ? 2 : 0;
    score -= Math.max(0, Math.abs(levelDelta) - 1) * 3;
  }

  return score;
}

function enforceReuseQuota(selection: Exercise[], pool: Exercise[], seenConcepts: Set<string>): Exercise[] {
  const result = [...selection];
  const minimumReuseCount = Math.ceil(result.length * 0.6);

  const isReuseExercise = (exercise: Exercise): boolean => exercise.concepts.some((concept) => seenConcepts.has(concept));
  let reuseCount = result.filter(isReuseExercise).length;
  if (reuseCount >= minimumReuseCount) {
    return result.sort(stableExerciseSort);
  }

  const reusableCandidates = pool.filter(
    (exercise) => !result.some((selected) => normalizeExerciseId(selected.id) === normalizeExerciseId(exercise.id)) && isReuseExercise(exercise),
  );
  const replaceableIndexes = result
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ exercise }) => !isReuseExercise(exercise))
    .map(({ index }) => index);

  for (const index of replaceableIndexes) {
    const replacement = reusableCandidates.shift();
    if (!replacement) {
      break;
    }
    result[index] = replacement;
    reuseCount += 1;
    if (reuseCount >= minimumReuseCount) {
      break;
    }
  }

  return result.sort(stableExerciseSort);
}

function renderBatchMarkdown(
  exercises: Exercise[],
  batchNumber: number,
  day: number,
  evidence: BatchEvidence,
  learnerState: LearnerState,
  concepts: ConceptsFile,
): string {
  const whyThisBatch = buildLearnerFacingNote(exercises, evidence, learnerState, concepts);
  const sections = exercises.map((exercise) => renderExerciseSection(exercise)).join('\n\n');
  return `# Day ${day}, Batch ${batchNumber}\n\n## Why this batch\n\n${whyThisBatch}\n\n${sections}\n`;
}

function buildLearnerFacingNote(
  exercises: Exercise[],
  evidence: BatchEvidence,
  learnerState: LearnerState,
  concepts: ConceptsFile,
): string {
  const notes: string[] = [];
  if (evidence.lastBatchPassRate !== null) {
    notes.push(`Recent batch pass rate: ${Math.round(evidence.lastBatchPassRate * 100)}%.`);
  } else {
    notes.push('No prior verified batch data was available, so this selection stays conservative.');
  }

  const focusConcepts = [evidence.weakestConcept, evidence.dueReviewConcept, evidence.strongestTransferConcept]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index);

  if (focusConcepts.length > 0) {
    notes.push(`Focus concepts: ${focusConcepts.join(', ')}.`);
  }

  if (evidence.recentStrongHints.length > 0) {
    notes.push(`Strong-hint exercises scheduled for safer retry support: ${evidence.recentStrongHints.join(', ')}.`);
  }

  notes.push(`Difficulty action: ${describeAction(evidence.action)}.`);
  notes.push(`Selection reuses prior concepts in ${reuseCount(exercises, concepts)} of ${exercises.length} exercises.`);

  if (evidence.historyRecoveredExercises > 0) {
    notes.push(`History summary shows ${evidence.historyRecoveredExercises} recovered exercise flow(s); this batch keeps progression incremental.`);
  }

  return notes.join(' ');
}

function describeAction(action: DifficultyAction): string {
  switch (action) {
    case 'raise':
      return 'raise one step while keeping most of the batch familiar';
    case 'support':
      return 'hold the level and reduce composition pressure';
    case 'step-back':
      return 'step back one level and isolate the shaky primitive';
    case 'hold':
      return 'hold the current level and reinforce transfer';
  }
}

function reuseCount(exercises: Exercise[], concepts: ConceptsFile): number {
  const seen = new Set(
    Object.entries(concepts.concepts)
      .filter(([, concept]) => concept.mastery > 0 || concept.successfulUses > 0)
      .map(([name]) => name),
  );
  return exercises.filter((exercise) => exercise.concepts.some((concept) => seen.has(concept))).length;
}

function renderExerciseSection(exercise: Exercise): string {
  const requirements = exercise.requirements.map((requirement, index) => `${index + 1}. ${requirement}`).join('\n');
  const constraints = exercise.constraints.length > 0
    ? exercise.constraints.map((constraint) => `- ${constraint}`).join('\n')
    : '- Keep the observable behavior deterministic.';

  return `## Exercise ${exercise.id}: ${exercise.title}\n\n- Level: ${exercise.level}\n- Context: ${exercise.context}\n- Concepts: ${exercise.concepts.join(', ')}\n- Target active time: ${formatTargetActiveTime(exercise.level)}\n\n### Objective\n\n${exercise.objective}\n\n### Requirements\n\n${requirements}\n\n### Constraints\n\n${constraints}\n\n### Before coding\n\n- Predict: ${buildPredictionPrompt(exercise)}\n- List: ${buildEdgeCasePrompt(exercise)}\n\n### Completion\n\n- [ ] Public tests pass\n- [ ] Required learner test added\n- [ ] Explanation recorded\n- [ ] Exercise committed`;
}

function buildPredictionPrompt(exercise: Exercise): string {
  const firstExample = exercise.examples[0];
  if (!firstExample) {
    return 'What should be observably different when the first public test passes?';
  }

  return `What should the first documented example produce for input ${formatExampleValue(firstExample.input)}?`;
}

function buildEdgeCasePrompt(exercise: Exercise): string {
  if (exercise.constraints.length > 0) {
    return `Name one edge case implied by this constraint: "${exercise.constraints[0]}".`;
  }

  switch (exercise.context) {
    case 'react':
      return 'Name one loading, empty, or rerender behavior to check before coding.';
    case 'production':
      return 'Name one malformed, duplicate, or tie-breaking record case to check before coding.';
    case 'combined':
      return 'Name one ordering or immutability case to check before coding.';
    case 'boss':
      return 'Name one invariant that should still hold after refactoring.';
    case 'isolated':
      return 'Name one empty, duplicate, or single-item input to check before coding.';
  }
}

function formatExampleValue(value: unknown): string {
  const json = JSON.stringify(value);
  if (!json) {
    return String(value);
  }
  return json.length > 120 ? `${json.slice(0, 117)}...` : json;
}

function medianNumber(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length === 0) {
    return 1;
  }
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function buildConsoleSummary(exercises: Exercise[], evidence: BatchEvidence): string {
  return [
    `action=${evidence.action}`,
    `selected=${exercises.map((exercise) => exercise.id).join(', ')}`,
    evidence.weakestConcept ? `weakest=${evidence.weakestConcept}` : null,
    evidence.dueReviewConcept ? `review=${evidence.dueReviewConcept}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' | ');
}

async function loadLearnerState(): Promise<LearnerState> {
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

  return readJson<LearnerState>(learnerStatePath);
}

async function loadConcepts(): Promise<ConceptsFile> {
  if (!existsSync(conceptsPath)) {
    return { version: 1, concepts: {} };
  }

  return readJson<ConceptsFile>(conceptsPath);
}

async function loadHistorySummary(configuredPath?: string): Promise<HistorySummary | null> {
  const filePath = resolve(repositoryRoot, configuredPath ?? relativeToRoot(defaultHistorySummaryPath));
  if (!existsSync(filePath)) {
    return null;
  }

  return readJson<HistorySummary>(filePath);
}

function relativeToRoot(filePath: string): string {
  return filePath.startsWith(repositoryRoot) ? filePath.slice(repositoryRoot.length + 1) : filePath;
}

async function readJson<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content) as T;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[generate-next-batch] ${message}`);
  process.exitCode = 1;
});
