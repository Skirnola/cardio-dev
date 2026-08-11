import { describe, expect, it } from "vitest";
import { reduceRosterAction } from "../../../src/exercises/day-03/030-reduce-roster-action";

describe("reduceRosterAction", () => {
  it("keeps the roster sorted after updates and returns the same state for missing removals", () => {
    const state = {
      members: [
        { id: "3", name: "Zoe", role: "viewer" as const, active: false },
        { id: "1", name: "Maya", role: "editor" as const, active: true },
      ],
    };

    const updated = reduceRosterAction(state, {
      type: "upsert",
      member: { id: "2", name: "Ari", role: "owner", active: true },
    });
    expect(updated.members.map((member) => member.id)).toEqual(["2", "1", "3"]);

    const deactivated = reduceRosterAction(updated, { type: "deactivate", id: "1" });
    expect(deactivated.members.map((member) => `${member.id}:${member.active}`)).toEqual([
      "2:true",
      "1:false",
      "3:false",
    ]);

    expect(reduceRosterAction(deactivated, { type: "remove", id: "missing" })).toBe(deactivated);
  });
});
