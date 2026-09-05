import { describe, expect, it, vi } from "vitest";
import { runSearchRequest, } from "../../../src/exercises/day-04/033-run-search-request";
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
describe("runSearchRequest", () => {
    it("emits a loading state immediately and then a success state", async () => {
        const deferred = createDeferred();
        const states = [];
        const fetchUsers = vi.fn((_query) => deferred.promise);
        const request = runSearchRequest(fetchUsers, "  al ", (state) => {
            states.push(state);
        });
        void request.catch(() => { });
        expect(states).toEqual([
            {
                status: "loading",
                query: "al",
                options: [],
                errorMessage: null,
            },
        ]);
        const loadingState = states[0];
        deferred.resolve([
            { id: "u2", name: "Sally", active: true, aliases: ["Ally"] },
            { id: "u1", name: "Alice", active: true, aliases: ["Ace"] },
            { id: "u3", name: "ALBERT", active: false, aliases: ["Al"] },
        ]);
        await expect(request).resolves.toBeUndefined();
        expect(states).toEqual([
            {
                status: "loading",
                query: "al",
                options: [],
                errorMessage: null,
            },
            {
                status: "success",
                query: "al",
                options: [
                    { id: "u1", label: "Alice" },
                    { id: "u2", label: "Sally" },
                ],
                errorMessage: null,
            },
        ]);
        expect(states[0]).not.toBe(states[1]);
        expect(loadingState).toEqual({
            status: "loading",
            query: "al",
            options: [],
            errorMessage: null,
        });
        expect(fetchUsers).toHaveBeenCalledWith("al");
    });
    it("emits an error state and resolves when the loader fails", async () => {
        const states = [];
        const fetchUsers = vi.fn(async () => {
            throw new Error("Network down");
        });
        await expect(runSearchRequest(fetchUsers, "be", (state) => {
            states.push(state);
        })).resolves.toBeUndefined();
        expect(states).toEqual([
            {
                status: "loading",
                query: "be",
                options: [],
                errorMessage: null,
            },
            {
                status: "error",
                query: "be",
                options: [],
                errorMessage: "Network down",
            },
        ]);
    });
});
