import { describe, expect, it, vi } from "vitest";
import { createSharedUserLoader, } from "../../../src/exercises/day-04/038-shared-user-loader";
function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    void promise.catch(() => { });
    return { promise, resolve, reject };
}
describe("createSharedUserLoader", () => {
    it("shares one in-flight request and caches a successful result", async () => {
        const deferred = createDeferred();
        const fetchUserById = vi.fn((_id) => deferred.promise);
        const loader = createSharedUserLoader(fetchUserById);
        const first = loader.load("u1");
        void first.catch(() => { });
        const second = loader.load("u1");
        void second.catch(() => { });
        expect(fetchUserById).toHaveBeenCalledTimes(1);
        deferred.resolve({ id: "u1", name: "Alice", active: true });
        await expect(Promise.all([first, second])).resolves.toEqual([
            { id: "u1", label: "Alice" },
            { id: "u1", label: "Alice" },
        ]);
        await expect(loader.load("u1")).resolves.toEqual({
            id: "u1",
            label: "Alice",
        });
        expect(fetchUserById).toHaveBeenCalledTimes(1);
    });
    it("retries after a rejection instead of caching the failure", async () => {
        const fetchUserById = vi.fn();
        fetchUserById.mockRejectedValueOnce(new Error("Temporary issue"));
        fetchUserById.mockResolvedValueOnce({ id: "u2", name: "Bea", active: true });
        const loader = createSharedUserLoader(fetchUserById);
        await expect(loader.load("u2")).rejects.toThrow("Temporary issue");
        await expect(loader.load("u2")).resolves.toEqual({
            id: "u2",
            label: "Bea",
        });
        expect(fetchUserById).toHaveBeenCalledTimes(2);
    });
    it("caches an inactive user as null", async () => {
        const fetchUserById = vi.fn(async () => ({
            id: "u3",
            name: "Casey",
            active: false,
        }));
        const loader = createSharedUserLoader(fetchUserById);
        await expect(loader.load("u3")).resolves.toBeNull();
        await expect(loader.load("u3")).resolves.toBeNull();
        expect(fetchUserById).toHaveBeenCalledTimes(1);
    });
});
