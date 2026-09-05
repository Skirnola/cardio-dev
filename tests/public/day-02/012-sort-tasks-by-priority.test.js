import { expect, it } from "vitest";
import { sortTasksByPriority } from "../../../src/exercises/day-02/012-sort-tasks-by-priority";
it("sorts higher priority tasks first, then earlier due dates, without mutating the input", () => {
    const tasks = [
        { id: "A", title: "Write summary", priority: 2, dueAt: "2024-05-02T10:00:00.000Z" },
        { id: "B", title: "Fix bug", priority: 3, dueAt: "2024-05-03T10:00:00.000Z" },
        { id: "C", title: "Archive logs", priority: 3, dueAt: "2024-05-01T10:00:00.000Z" },
    ];
    const snapshot = JSON.parse(JSON.stringify(tasks));
    expect(sortTasksByPriority(tasks)).toEqual([
        { id: "C", title: "Archive logs", priority: 3, dueAt: "2024-05-01T10:00:00.000Z" },
        { id: "B", title: "Fix bug", priority: 3, dueAt: "2024-05-03T10:00:00.000Z" },
        { id: "A", title: "Write summary", priority: 2, dueAt: "2024-05-02T10:00:00.000Z" },
    ]);
    expect(tasks).toEqual(snapshot);
});
