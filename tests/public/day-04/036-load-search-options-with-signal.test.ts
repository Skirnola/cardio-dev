import { describe, expect, it, vi } from "vitest";
import {
  loadSearchOptionsWithSignal,
  type ApiSearchUser,
} from "../../../src/exercises/day-04/036-load-search-options-with-signal";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  void promise.catch(() => {});

  return { promise, resolve, reject };
}

describe("loadSearchOptionsWithSignal", () => {
  it("rejects immediately when the signal is already aborted", async () => {
    const controller = new AbortController();
    const reason = new Error("Stopped");
    controller.abort(reason);
    const fetchUsers = vi.fn();

    await expect(
      loadSearchOptionsWithSignal(fetchUsers, "al", controller.signal),
    ).rejects.toBe(reason);
    expect(fetchUsers).not.toHaveBeenCalled();
  });

  it("passes the signal through and resolves normalized options", async () => {
    const controller = new AbortController();
    const fetchUsers = vi.fn(async (_query: string, signal: AbortSignal) => {
      expect(signal).toBe(controller.signal);

      return [
        { id: "u2", name: "Sally", active: true, aliases: ["Ally"] },
        { id: "u1", name: "Alice", active: true, aliases: ["Ace"] },
        { id: "u3", name: "ALBERT", active: false, aliases: ["Al"] },
      ] satisfies ApiSearchUser[];
    });

    await expect(
      loadSearchOptionsWithSignal(fetchUsers, " al ", controller.signal),
    ).resolves.toEqual([
      { id: "u1", label: "Alice" },
      { id: "u2", label: "Sally" },
    ]);

    expect(fetchUsers).toHaveBeenCalledWith("al", controller.signal);
  });

  it("rejects with the abort reason when the signal aborts before the loader settles", async () => {
    const controller = new AbortController();
    const deferred = createDeferred<ApiSearchUser[]>();
    const fetchUsers = vi.fn((_query: string, _signal: AbortSignal) => deferred.promise);

    const request = loadSearchOptionsWithSignal(fetchUsers, "al", controller.signal);
    void request.catch(() => {});
    const reason = new Error("Cancelled by user");

    controller.abort(reason);

    await expect(request).rejects.toBe(reason);

    deferred.resolve([{ id: "u1", name: "Alice", active: true }]);
  });
});
