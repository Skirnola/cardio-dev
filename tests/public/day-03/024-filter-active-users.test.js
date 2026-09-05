import { describe, expect, it } from "vitest";
import { filterActiveUsers } from "../../../src/exercises/day-03/024-filter-active-users";
describe("filterActiveUsers", () => {
    it("returns only active users whose names match the query, ignoring case and whitespace", () => {
        const users = [
            { id: "1", name: "Maya", active: true },
            { id: "2", name: "Noah", active: false },
            { id: "3", name: "ANNA", active: true },
            { id: "4", name: "Zoe", active: true },
        ];
        const matches = filterActiveUsers(users, "an");
        expect(matches).toEqual([users[2]]);
        expect(matches[0]).toBe(users[2]);
        expect(filterActiveUsers(users, "   ")).toEqual([users[0], users[2], users[3]]);
    });
});
