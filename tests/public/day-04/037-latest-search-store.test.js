import { describe, expect, it, vi } from "vitest";
import { LatestSearchStore, } from "../../../src/exercises/day-04/037-latest-search-store";
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
describe("LatestSearchStore", () => {
    it("keeps the latest successful search result when an older request resolves later", async () => {
        const deferreds = {
            al: createDeferred(),
            be: createDeferred(),
        };
        const fetchUsers = vi.fn((query) => deferreds[query].promise);
        const store = new LatestSearchStore(fetchUsers);
        expect(store.getState()).toEqual({
            status: "idle",
            query: "",
            options: [],
            errorMessage: null,
        });
        const firstRequest = store.search("  al ");
        void firstRequest.catch(() => { });
        const firstLoadingState = store.getState();
        expect(firstLoadingState).toEqual({
            status: "loading",
            query: "al",
            options: [],
            errorMessage: null,
        });
        const secondRequest = store.search("be");
        void secondRequest.catch(() => { });
        expect(store.getState()).toEqual({
            status: "loading",
            query: "be",
            options: [],
            errorMessage: null,
        });
        deferreds.be.resolve([
            { id: "u2", name: "Bela", active: true },
            { id: "u1", name: "Ben", active: true, aliases: ["Bee"] },
        ]);
        await expect(secondRequest).resolves.toBeUndefined();
        const latestState = store.getState();
        expect(latestState).toEqual({
            status: "success",
            query: "be",
            options: [
                { id: "u2", label: "Bela" },
                { id: "u1", label: "Ben" },
            ],
            errorMessage: null,
        });
        deferreds.al.resolve([
            { id: "u3", name: "Alice", active: true },
            { id: "u4", name: "Albert", active: true },
        ]);
        await expect(firstRequest).resolves.toBeUndefined();
        expect(store.getState()).toEqual(latestState);
        expect(firstLoadingState).toEqual({
            status: "loading",
            query: "al",
            options: [],
            errorMessage: null,
        });
    });
    it("ignores a stale rejection after a newer request succeeds", async () => {
        const deferreds = {
            al: createDeferred(),
            be: createDeferred(),
        };
        const fetchUsers = vi.fn((query) => deferreds[query].promise);
        const store = new LatestSearchStore(fetchUsers);
        const firstRequest = store.search("al");
        void firstRequest.catch(() => { });
        const secondRequest = store.search("be");
        void secondRequest.catch(() => { });
        deferreds.be.resolve([{ id: "u1", name: "Ben", active: true }]);
        await secondRequest;
        deferreds.al.reject(new Error("Older request failed"));
        await expect(firstRequest).resolves.toBeUndefined();
        expect(store.getState()).toEqual({
            status: "success",
            query: "be",
            options: [{ id: "u1", label: "Ben" }],
            errorMessage: null,
        });
    });
});
