import { describe, expect, it } from "vitest";
import { applyCartAction } from "../../../src/exercises/day-03/026-apply-cart-action";
describe("applyCartAction", () => {
    it("updates quantities immutably, removes empty items, and leaves the state unchanged for no-op actions", () => {
        const state = {
            items: [
                { id: "tea", quantity: 1 },
                { id: "coffee", quantity: 2 },
            ],
        };
        const original = {
            items: state.items.map((item) => ({ ...item })),
        };
        const afterAdd = applyCartAction(state, { type: "add", id: "tea", quantity: 3 });
        expect(afterAdd).toEqual({
            items: [
                { id: "tea", quantity: 4 },
                { id: "coffee", quantity: 2 },
            ],
        });
        expect(afterAdd.items[1]).toBe(state.items[1]);
        const afterRemove = applyCartAction(afterAdd, { type: "set", id: "coffee", quantity: 0 });
        expect(afterRemove).toEqual({
            items: [{ id: "tea", quantity: 4 }],
        });
        expect(applyCartAction(afterRemove, { type: "remove", id: "missing" })).toBe(afterRemove);
        expect(state).toEqual(original);
    });
});
