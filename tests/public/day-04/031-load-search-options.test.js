import { describe, expect, it, vi } from "vitest";
import { loadSearchOptions, } from "../../../src/exercises/day-04/031-load-search-options";
describe("loadSearchOptions", () => {
    it("loads, filters, and sorts active matches without mutating source records", async () => {
        const users = [
            { id: "u2", name: "Sally", active: true, aliases: ["Ally"] },
            { id: "u1", name: "Alice", active: true, aliases: ["Ace"] },
            { id: "u3", name: "ALBERT", active: false, aliases: ["Al"] },
            { id: "u4", name: "Bea", active: true, aliases: ["Pal"] },
        ];
        const snapshot = users.map((user) => ({
            ...user,
            aliases: user.aliases ? [...user.aliases] : undefined,
        }));
        const fetchUsers = vi.fn(async (_query) => users);
        await expect(loadSearchOptions(fetchUsers, "  al ")).resolves.toEqual([
            { id: "u1", label: "Alice" },
            { id: "u2", label: "Sally" },
        ]);
        expect(fetchUsers).toHaveBeenCalledWith("al");
        expect(users).toEqual(snapshot);
    });
    it("returns every active user for an empty trimmed query, sorted by label then id", async () => {
        const users = [
            { id: "b", name: "Mila", active: true },
            { id: "a", name: "Mila", active: true },
            { id: "c", name: "Nora", active: false },
        ];
        const fetchUsers = vi.fn(async (_query) => users);
        await expect(loadSearchOptions(fetchUsers, "   ")).resolves.toEqual([
            { id: "a", label: "Mila" },
            { id: "b", label: "Mila" },
        ]);
    });
});
