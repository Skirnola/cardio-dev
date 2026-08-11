export type ExerciseId = `D${number}-E${number}`;
export type ExerciseContext = 'isolated' | 'combined' | 'production' | 'react' | 'boss';
export type ExerciseLevel = 1 | 2 | 3 | 4 | 5;

export type Exercise = {
  id: string;
  title: string;
  day: 1 | 2 | 3 | 4 | 5;
  level: ExerciseLevel;
  concepts: string[];
  prerequisites: string[];
  context: ExerciseContext;
  objective: string;
  requirements: string[];
  constraints: string[];
  examples: Array<{ input: unknown; output: unknown }>;
  starterFiles: string[];
  publicTestFiles: string[];
  bossTestFiles?: string[];
  hiddenTestContract?: string[];
  completion: {
    publicTestsPass: boolean;
    bossTestsPass?: boolean;
    explanationRecorded: boolean;
    learnerTestsAdded?: number;
  };
  telemetry: {
    attempts: number;
    hintLevelUsed: 0 | 1 | 2 | 3;
    activeMinutes?: number;
    commit?: string;
  };
};

export type ManifestShape = Exercise[] | { exercises: Exercise[] };

export type LearnerExerciseStatus =
  | 'not-started'
  | 'in-progress'
  | 'tests-pass'
  | 'complete'
  | 'supported'
  | 'taught';

export type LearnerExerciseState = {
  status: LearnerExerciseStatus;
  attempts: number;
  hintLevelUsed: 0 | 1 | 2 | 3;
  activeMinutes: number | null;
  startedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  publicTestsPass: boolean;
  bossTestsPass: boolean | null;
  explanationRecorded: boolean;
  learnerTestsAdded: number;
  lastVerifiedAt: string | null;
  lastResult: 'not-run' | 'pass' | 'fail';
  lastCommit: string | null;
  testFiles: string[];
};

export type BatchVerificationRecord = {
  batchId: string;
  exerciseIds: string[];
  verifiedAt: string;
  passRate: number;
  firstAttemptRate: number;
  explanationRate: number;
  strongHintCount: number;
};

export type LearnerState = {
  version: number;
  currentDay: number;
  dailyTarget: number;
  currentBatchNumber: number;
  lastVerifiedAt: string | null;
  historySummaryPath: string;
  recentBatchIds: string[];
  exercises: Record<string, LearnerExerciseState>;
  batches: BatchVerificationRecord[];
};

export type ConceptState = {
  mastery: number;
  successfulUses: number;
  recentFailures: number;
  lastSeenExercise: string | null;
  highestLevelPassed: number;
  needsSpacedReview: boolean;
};

export type ConceptsFile = {
  version: number;
  concepts: Record<string, ConceptState>;
};

export type HistoryExerciseSummary = {
  commitCount: number;
  passCommits: number;
  fixCommits: number;
  revertCommits: number;
  insertions: number;
  deletions: number;
  lastCommit: string | null;
  level: number | null;
  context: ExerciseContext | null;
  concepts: string[];
};

export type HistorySummary = {
  version: number;
  generatedAt: string;
  gitAvailable: boolean;
  branch: string | null;
  totals: {
    cardioCommits: number;
    exerciseCommits: number;
    reflectionCommits: number;
    fixOrRevertCommits: number;
    recoveredExercises: number;
  };
  exercises: Record<string, HistoryExerciseSummary>;
  recentExerciseIds: string[];
  comparableActiveMinutes: {
    note: string;
    groups: Array<{
      key: string;
      sampleSize: number;
      medianMinutes: number;
      exerciseIds: string[];
    }>;
  };
  warnings: string[];
};

export const EXERCISE_ID_PATTERN = /\bD\d+-E\d+\b/gi;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isExerciseId(value: string): value is ExerciseId {
  return /^D\d+-E\d+$/i.test(value.trim());
}

export function normalizeExerciseId(value: string): string {
  return value.trim().toUpperCase();
}

export function uniqueExerciseIds(values: string[]): string[] {
  return [...new Set(values.map(normalizeExerciseId).filter(isExerciseId))];
}

export function parseExerciseIdsFromMarkdown(markdown: string): string[] {
  const explicitMatches = [...markdown.matchAll(/Exercise\s+(D\d+-E\d+)/gi)].map((match) => match[1]);
  if (explicitMatches.length > 0) {
    return uniqueExerciseIds(explicitMatches);
  }

  const fallbackMatches = markdown.match(EXERCISE_ID_PATTERN) ?? [];
  return uniqueExerciseIds(fallbackMatches);
}

export function defaultLearnerExerciseState(): LearnerExerciseState {
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

export function getManifestExercises(manifest: ManifestShape): Exercise[] {
  return Array.isArray(manifest) ? manifest : manifest.exercises;
}

export function isExerciseComplete(exercise: Exercise, learnerState?: LearnerExerciseState): boolean {
  const publicTestsPass = learnerState?.publicTestsPass ?? exercise.completion.publicTestsPass;
  const explanationRecorded = learnerState?.explanationRecorded ?? exercise.completion.explanationRecorded;
  const hasBossTests = Boolean(exercise.bossTestFiles?.length);
  const bossTestsPass = hasBossTests
    ? (learnerState?.bossTestsPass ?? exercise.completion.bossTestsPass ?? false)
    : true;

  return publicTestsPass && explanationRecorded && bossTestsPass;
}

export function prerequisiteSatisfied(
  prerequisite: string,
  completedExerciseIds: Set<string>,
  concepts: Record<string, ConceptState>,
): boolean {
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

export function formatTargetActiveTime(level: ExerciseLevel): string {
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

export function stableExerciseSort(left: Exercise, right: Exercise): number {
  return left.day - right.day || left.level - right.level || left.id.localeCompare(right.id);
}
