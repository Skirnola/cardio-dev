import { describe, expect, it } from "vitest";
import { appendUniqueTag } from "../../../src/exercises/day-03/022-append-unique-tag";
describe("appendUniqueTag", () => {
    it("adds a missing tag immutably and returns the original profile when the tag already exists", () => {
        const profile = { name: "Ada", tags: ["javascript"] };
        const added = appendUniqueTag(profile, "vitest");
        expect(added).toEqual({ name: "Ada", tags: ["javascript", "vitest"] });
        expect(added).not.toBe(profile);
        expect(added.tags).not.toBe(profile.tags);
        expect(profile).toEqual({ name: "Ada", tags: ["javascript"] });
        const unchanged = appendUniqueTag(profile, "javascript");
        expect(unchanged).toBe(profile);
        expect(unchanged.tags).toBe(profile.tags);
    });
});
