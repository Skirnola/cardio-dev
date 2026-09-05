import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { InventoryTable } from "../../../src/components/502-inventory-table";
it("renders newest valid inventory rows with featured items first and keeps the payload unchanged", () => {
    const records = [
        { id: "p1", name: "Notebook", category: "Office", featured: false, updatedAt: "2024-05-01T10:00:00.000Z" },
        { id: "p2", name: "Desk Lamp", category: "Lighting", featured: true, updatedAt: "2024-05-02T10:00:00.000Z" },
        { id: "p3", name: "Cable", category: "Office", featured: true, updatedAt: "2024-05-03T10:00:00.000Z" },
        { id: "p1", name: "Notebook Pro", category: "Office", featured: false, updatedAt: "2024-05-04T10:00:00.000Z" },
        { id: null, name: "Broken", category: "Office", featured: false, updatedAt: "2024-05-05T10:00:00.000Z" },
        { id: "p4", name: "   ", category: "Office", featured: false, updatedAt: "2024-05-06T10:00:00.000Z" },
    ];
    const snapshot = structuredClone(records);
    render(<InventoryTable records={records}/>);
    const table = screen.getByRole("table", { name: "Inventory" });
    const bodyRows = within(table).getAllByRole("row").slice(1);
    expect(bodyRows.map((row) => within(row).getAllByRole("cell").map((cell) => cell.textContent))).toEqual([
        ["Cable", "Office"],
        ["Desk Lamp", "Lighting"],
        ["Notebook Pro", "Office"],
    ]);
    expect(records).toEqual(snapshot);
});
it("shows an empty state when no valid rows remain", () => {
    render(<InventoryTable records={[
            { id: null, name: null, category: "Office", featured: false, updatedAt: "2024-05-01T10:00:00.000Z" },
        ]}/>);
    expect(screen.getByText("No inventory rows.")).toBeInTheDocument();
});
