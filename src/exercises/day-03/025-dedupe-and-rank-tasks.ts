export type Task = {
  readonly id: string;
  readonly title: string;
  readonly priority: number;
  readonly updatedAt: number;
};

export function dedupeAndRankTasks(tasks: readonly Task[]): Task[] {
  throw new Error("Not implemented");
}
