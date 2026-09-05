import { expect, it } from "vitest";
import { collectUniqueProductTags } from "../../../src/exercises/day-02/017-collect-unique-product-tags";
it("uses only active products, trims tags, removes duplicates, and returns the tags in alphabetical order", () => {
    const products = [
        {
            sku: "P-1",
            name: "Keyboard",
            discontinued: false,
            tags: [" office", "peripheral", ""],
        },
        {
            sku: "P-2",
            name: "Mouse",
            discontinued: true,
            tags: ["peripheral", "wireless"],
        },
        {
            sku: "P-3",
            name: "Monitor",
            discontinued: false,
            tags: ["display", "office"],
        },
    ];
    const snapshot = JSON.parse(JSON.stringify(products));
    expect(collectUniqueProductTags(products)).toEqual(["display", "office", "peripheral"]);
    expect(products).toEqual(snapshot);
});
