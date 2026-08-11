import { describe, expect, it } from "vitest";
import { applyBoardAction } from "../../../src/exercises/day-03/029-apply-board-action";

describe("applyBoardAction", () => {
  it("moves and renames cards immutably while leaving invalid moves unchanged", () => {
    const state = {
      backlog: [{ id: "task-1", title: "Draft" }],
      active: [{ id: "task-2", title: "Build" }],
      done: [{ id: "task-3", title: "Ship" }],
    };

    const moved = applyBoardAction(state, { type: "move", id: "task-1", from: "backlog", to: "active" });
    expect(moved).toEqual({
      backlog: [],
      active: [
        { id: "task-2", title: "Build" },
        { id: "task-1", title: "Draft" },
      ],
      done: [{ id: "task-3", title: "Ship" }],
    });
    expect(moved.done[0]).toBe(state.done[0]);

    const renamed = applyBoardAction(moved, { type: "rename", id: "task-2", title: "Build v2" });
    expect(renamed.active[0]).toEqual({ id: "task-2", title: "Build v2" });
    expect(applyBoardAction(state, { type: "move", id: "missing", from: "backlog", to: "done" })).toBe(state);
  });
});
