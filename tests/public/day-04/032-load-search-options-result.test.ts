import { describe, expect, it, vi } from "vitest";
import { loadSearchOptionsResult } from "../../../src/exercises/day-04/032-load-search-options-result";

describe("loadSearchOptionsResult", () => {
  it("returns a success result with normalized options", async () => {
    const fetchUsers = vi.fn(async (_query: string) => [
      { id: "u2", name: "Sally", active: true, aliases: ["Ally"] },
      { id: "u1", name: "Alice", active: true, aliases: ["Ace"] },
      { id: "u3", name: "ALBERT", active: false, aliases: ["Al"] },
    ]);

    await expect(loadSearchOptionsResult(fetchUsers, " al ")).resolves.toEqual({
      status: "success",
      options: [
        { id: "u1", label: "Alice" },
        { id: "u2", label: "Sally" },
      ],
    });

    expect(fetchUsers).toHaveBeenCalledWith("al");
  });

  it("returns an error result instead of rejecting when the loader throws an Error", async () => {
    const fetchUsers = vi.fn(async () => {
      throw new Error("API unavailable");
    });

    await expect(loadSearchOptionsResult(fetchUsers, "al")).resolves.toEqual({
      status: "error",
      message: "API unavailable",
    });
  });

  it("uses a fallback message for non-Error rejections", async () => {
    const fetchUsers = vi.fn(async () => {
      throw "boom";
    });

    await expect(loadSearchOptionsResult(fetchUsers, "al")).resolves.toEqual({
      status: "error",
      message: "Unknown error",
    });
  });
});
