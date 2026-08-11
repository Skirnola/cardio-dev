import { describe, expect, it, vi } from "vitest";
import {
  loadSelectedOptions,
  type ApiSearchUser,
} from "../../../src/exercises/day-04/034-load-selected-options";

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

describe("loadSelectedOptions", () => {
  it("starts unique requests immediately and preserves first-seen id order", async () => {
    const ids = ["b", "a", "b"];
    const snapshot = [...ids];
    const deferreds: Record<string, ReturnType<typeof createDeferred<ApiSearchUser>>> = {
      a: createDeferred<ApiSearchUser>(),
      b: createDeferred<ApiSearchUser>(),
    };
    const fetchUserById = vi.fn((id: string) => deferreds[id].promise);

    const request = loadSelectedOptions(ids, fetchUserById);
    void request.catch(() => {});

    expect(fetchUserById).toHaveBeenCalledTimes(2);
    expect(fetchUserById).toHaveBeenNthCalledWith(1, "b");
    expect(fetchUserById).toHaveBeenNthCalledWith(2, "a");

    deferreds.a.resolve({ id: "a", name: "Alice", active: true });
    deferreds.b.resolve({ id: "b", name: "Bea", active: true });

    await expect(request).resolves.toEqual([
      { id: "b", label: "Bea" },
      { id: "a", label: "Alice" },
    ]);
    expect(ids).toEqual(snapshot);
  });

  it("skips inactive users after loading them", async () => {
    const fetchUserById = vi.fn(async (id: string) => {
      const users: Record<string, ApiSearchUser> = {
        a: { id: "a", name: "Alice", active: false },
        b: { id: "b", name: "Bea", active: true },
      };

      return users[id];
    });

    await expect(loadSelectedOptions(["a", "b"], fetchUserById)).resolves.toEqual([
      { id: "b", label: "Bea" },
    ]);
  });
});
