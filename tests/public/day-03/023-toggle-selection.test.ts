import { describe, expect, it } from "vitest";
import { toggleSelection } from "../../../src/exercises/day-03/023-toggle-selection";

describe("toggleSelection", () => {
  it("adds or removes an id without mutating the original selection", () => {
    const selectedIds = ["alpha", "gamma"];
    const original = [...selectedIds];

    expect(toggleSelection(selectedIds, "beta")).toEqual(["alpha", "gamma", "beta"]);
    expect(toggleSelection(selectedIds, "alpha")).toEqual(["gamma"]);
    expect(selectedIds).toEqual(original);
  });
});
