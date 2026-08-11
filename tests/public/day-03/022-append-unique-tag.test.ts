import { describe, expect, it } from "vitest";
import { appendUniqueTag } from "../../../src/exercises/day-03/022-append-unique-tag";

describe("appendUniqueTag", () => {
  it("adds a missing tag immutably and returns the original profile when the tag already exists", () => {
    const profile = { name: "Ada", tags: ["typescript"] };

    const added = appendUniqueTag(profile, "vitest");
    expect(added).toEqual({ name: "Ada", tags: ["typescript", "vitest"] });
    expect(added).not.toBe(profile);
    expect(added.tags).not.toBe(profile.tags);
    expect(profile).toEqual({ name: "Ada", tags: ["typescript"] });

    const unchanged = appendUniqueTag(profile, "typescript");
    expect(unchanged).toBe(profile);
    expect(unchanged.tags).toBe(profile.tags);
  });
});
