import { describe, expect, it, vi } from "vitest";
import {
  AbortingLatestSearchStore,
  type ApiSearchUser,
} from "../../../src/exercises/day-04/039-aborting-latest-search-store";

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

describe("AbortingLatestSearchStore", () => {
  it("aborts the previous request when a newer search starts", async () => {
    const deferreds = {
      al: createDeferred<ApiSearchUser[]>(),
      be: createDeferred<ApiSearchUser[]>(),
    };
    const seenSignals = new Map<string, AbortSignal>();
    const fetchUsers = vi.fn((query: string, signal: AbortSignal) => {
      seenSignals.set(query, signal);
      return deferreds[query as "al" | "be"].promise;
    });
    const store = new AbortingLatestSearchStore(fetchUsers);

    const firstRequest = store.search(" al ");
    void firstRequest.catch(() => {});
    expect(store.getState()).toEqual({
      status: "loading",
      query: "al",
      options: [],
      errorMessage: null,
    });

    const firstSignal = seenSignals.get("al");
    const secondRequest = store.search("be");
    void secondRequest.catch(() => {});

    expect(firstSignal?.aborted).toBe(true);
    expect(store.getState()).toEqual({
      status: "loading",
      query: "be",
      options: [],
      errorMessage: null,
    });

    deferreds.be.resolve([{ id: "u1", name: "Ben", active: true }]);
    await expect(secondRequest).resolves.toBeUndefined();

    deferreds.al.reject(new DOMException("Aborted", "AbortError"));
    await expect(firstRequest).resolves.toBeUndefined();

    expect(store.getState()).toEqual({
      status: "success",
      query: "be",
      options: [{ id: "u1", label: "Ben" }],
      errorMessage: null,
    });
  });

  it("stores an error message when the latest request fails", async () => {
    const deferred = createDeferred<ApiSearchUser[]>();
    const fetchUsers = vi.fn((_query: string, _signal: AbortSignal) => deferred.promise);
    const store = new AbortingLatestSearchStore(fetchUsers);

    const request = store.search("al");
    void request.catch(() => {});
    deferred.reject(new Error("Search failed"));

    await expect(request).resolves.toBeUndefined();
    expect(store.getState()).toEqual({
      status: "error",
      query: "al",
      options: [],
      errorMessage: "Search failed",
    });
  });
});
