import { describe, expect, it } from "vitest";
import { offsetNumbers } from "../../../src/exercises/day-03/021-offset-numbers";
describe("offsetNumbers", () => {
    it("returns a new array with each number shifted by the offset without changing the input", () => {
        const values = [2, -1, 5];
        const original = [...values];
        expect(offsetNumbers(values, 3)).toEqual([5, 2, 8]);
        expect(offsetNumbers([], 4)).toEqual([]);
        expect(values).toEqual(original);
    });
});
