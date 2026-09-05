import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { CatalogTable } from "../../../src/components/509-catalog-table";
it("normalizes catalog records and lets the user narrow the visible table by category and search text", async () => {
    const user = userEvent.setup();
    const products = [
        {
            id: "p1",
            name: "Cable",
            category: "Office",
            priceCents: 1200,
            featured: false,
            inStock: true,
            updatedAt: "2024-05-01T10:00:00.000Z",
        },
        {
            id: "p1",
            name: "Cable Pro",
            category: "Office",
            priceCents: 1500,
            featured: false,
            inStock: true,
            updatedAt: "2024-05-03T10:00:00.000Z",
        },
        {
            id: "p2",
            name: "Desk Lamp",
            category: "Lighting",
            priceCents: 2500,
            featured: true,
            inStock: true,
            updatedAt: "2024-05-02T10:00:00.000Z",
        },
        {
            id: "p3",
            name: "Adapter",
            category: "Office",
            priceCents: 800,
            featured: true,
            inStock: true,
            updatedAt: "2024-05-04T10:00:00.000Z",
        },
        {
            id: "p4",
            name: "Notebook",
            category: "Office",
            priceCents: 500,
            featured: true,
            inStock: false,
            updatedAt: "2024-05-05T10:00:00.000Z",
        },
        {
            id: "p5",
            name: "   ",
            category: "Office",
            priceCents: 200,
            featured: false,
            inStock: true,
            updatedAt: "2024-05-06T10:00:00.000Z",
        },
    ];
    const snapshot = structuredClone(products);
    render(<CatalogTable products={products}/>);
    const table = screen.getByRole("table", { name: "Catalog" });
    const rowNames = () => within(table)
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0]?.textContent);
    expect(rowNames()).toEqual(["Adapter", "Desk Lamp", "Cable Pro"]);
    await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "Office");
    expect(rowNames()).toEqual(["Adapter", "Cable Pro"]);
    await user.type(screen.getByRole("searchbox", { name: "Search products" }), "cab");
    expect(rowNames()).toEqual(["Cable Pro"]);
    expect(products).toEqual(snapshot);
});
it("shows an empty message when the current controls match no rows", async () => {
    const user = userEvent.setup();
    render(<CatalogTable products={[
            {
                id: "p1",
                name: "Cable",
                category: "Office",
                priceCents: 1200,
                featured: false,
                inStock: true,
                updatedAt: "2024-05-01T10:00:00.000Z",
            },
        ]}/>);
    await user.type(screen.getByRole("searchbox", { name: "Search products" }), "zzz");
    expect(screen.getByText("No matching rows.")).toBeInTheDocument();
});
