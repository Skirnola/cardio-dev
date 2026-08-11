import { describe, expect, it, vi } from "vitest";
import {
  AutocompleteModel,
  type ApiSearchUser,
} from "../../../src/exercises/day-04/040-autocomplete-model";

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

describe("AutocompleteModel", () => {
  it("resets to idle for an empty trimmed query and aborts any in-flight request", async () => {
    const deferred = createDeferred<ApiSearchUser[]>();
    let capturedSignal: AbortSignal | undefined;
    const fetchUsers = vi.fn((query: string, signal: AbortSignal) => {
      capturedSignal = signal;
      expect(query).toBe("al");
      return deferred.promise;
    });
    const model = new AutocompleteModel(fetchUsers);

    const firstRequest = model.search("  al ");
    void firstRequest.catch(() => {});

    expect(model.getState()).toEqual({
      status: "loading",
      query: "al",
      options: [],
      errorMessage: null,
    });

    await expect(model.search("   ")).resolves.toBeUndefined();

    expect(capturedSignal?.aborted).toBe(true);
    expect(fetchUsers).toHaveBeenCalledTimes(1);
    expect(model.getState()).toEqual({
      status: "idle",
      query: "",
      options: [],
      errorMessage: null,
    });

    deferred.reject(new DOMException("Aborted", "AbortError"));
    await expect(firstRequest).resolves.toBeUndefined();
  });

  it("keeps the latest successful search result when an older request resolves later", async () => {
    const deferreds = {
      al: createDeferred<ApiSearchUser[]>(),
      be: createDeferred<ApiSearchUser[]>(),
    };
    const seenSignals = new Map<string, AbortSignal>();
    const fetchUsers = vi.fn((query: string, signal: AbortSignal) => {
      seenSignals.set(query, signal);
      return deferreds[query as "al" | "be"].promise;
    });
    const model = new AutocompleteModel(fetchUsers);

    const firstRequest = model.search("al");
    void firstRequest.catch(() => {});
    const secondRequest = model.search(" be ");
    void secondRequest.catch(() => {});

    expect(seenSignals.get("al")?.aborted).toBe(true);
    expect(model.getState()).toEqual({
      status: "loading",
      query: "be",
      options: [],
      errorMessage: null,
    });

    deferreds.be.resolve([
      { id: "u2", name: "Bela", active: true },
      { id: "u1", name: "Ben", active: true, aliases: ["Bee"] },
      { id: "u3", name: "Abe", active: false, aliases: ["beta"] },
    ]);

    await expect(secondRequest).resolves.toBeUndefined();

    expect(model.getState()).toEqual({
      status: "success",
      query: "be",
      options: [
        { id: "u2", label: "Bela" },
        { id: "u1", label: "Ben" },
      ],
      errorMessage: null,
    });

    deferreds.al.resolve([{ id: "u4", name: "Alice", active: true }]);
    await expect(firstRequest).resolves.toBeUndefined();

    expect(model.getState()).toEqual({
      status: "success",
      query: "be",
      options: [
        { id: "u2", label: "Bela" },
        { id: "u1", label: "Ben" },
      ],
      errorMessage: null,
    });
  });

  it("retries the latest non-empty query after an error", async () => {
    const first = createDeferred<ApiSearchUser[]>();
    const second = createDeferred<ApiSearchUser[]>();
    const fetchUsers = vi.fn();
    fetchUsers.mockImplementationOnce((_query: string, _signal: AbortSignal) => first.promise);
    fetchUsers.mockImplementationOnce((_query: string, _signal: AbortSignal) => second.promise);
    const model = new AutocompleteModel(fetchUsers);

    const initialRequest = model.search("  al ");
    void initialRequest.catch(() => {});
    first.reject(new Error("Server error"));

    await expect(initialRequest).resolves.toBeUndefined();
    expect(model.getState()).toEqual({
      status: "error",
      query: "al",
      options: [],
      errorMessage: "Server error",
    });

    const retryRequest = model.retry();
    void retryRequest.catch(() => {});
    second.resolve([
      { id: "u1", name: "Alice", active: true, aliases: ["Al"] },
      { id: "u2", name: "Sally", active: true, aliases: ["Ally"] },
    ]);

    await expect(retryRequest).resolves.toBeUndefined();
    expect(fetchUsers).toHaveBeenNthCalledWith(1, "al", expect.any(AbortSignal));
    expect(fetchUsers).toHaveBeenNthCalledWith(2, "al", expect.any(AbortSignal));
    expect(model.getState()).toEqual({
      status: "success",
      query: "al",
      options: [
        { id: "u1", label: "Alice" },
        { id: "u2", label: "Sally" },
      ],
      errorMessage: null,
    });
  });
});
