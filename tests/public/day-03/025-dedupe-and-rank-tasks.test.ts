import { describe, expect, it } from "vitest";
import { dedupeAndRankTasks } from "../../../src/exercises/day-03/025-dedupe-and-rank-tasks";

describe("dedupeAndRankTasks", () => {
  it("keeps the newest task for each id and sorts the final list deterministically", () => {
    const tasks = [
      { id: "a", title: "Gamma", priority: 2, updatedAt: 4 },
      { id: "b", title: "Alpha", priority: 3, updatedAt: 2 },
      { id: "a", title: "Delta", priority: 3, updatedAt: 4 },
      { id: "c", title: "Beta", priority: 3, updatedAt: 1 },
    ];
    const original = tasks.map((task) => ({ ...task }));

    const result = dedupeAndRankTasks(tasks);
    expect(result.map((task) => task.id)).toEqual(["b", "c", "a"]);
    expect(result[0]).toBe(tasks[1]);
    expect(result[2]).toBe(tasks[2]);
    expect(tasks).toEqual(original);
  });
});
