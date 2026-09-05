import { expect, it } from "vitest";
import { countTicketsByAssignee } from "../../../src/exercises/day-02/015-count-tickets-by-assignee";
it("counts tickets by assignee, normalizes blank assignees to Unassigned, and returns a deterministically ordered Map", () => {
    const tickets = [
        { id: "T-1", assignee: "Ava" },
        { id: "T-2", assignee: null },
        { id: "T-3", assignee: "Bo" },
        { id: "T-4", assignee: "Ava" },
        { id: "T-5", assignee: " " },
    ];
    const snapshot = JSON.parse(JSON.stringify(tickets));
    const result = countTicketsByAssignee(tickets);
    expect(result instanceof Map).toBe(true);
    expect([...result.entries()]).toEqual([
        ["Ava", 2],
        ["Unassigned", 2],
        ["Bo", 1],
    ]);
    expect(tickets).toEqual(snapshot);
});
