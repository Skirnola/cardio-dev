import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { SortableCatalog } from "../../../src/components/504-sortable-catalog";
it("toggles sort direction and keeps filtering driven by the current control state", async () => {
    const user = userEvent.setup();
    render(<SortableCatalog products={[
            { id: "p1", name: "Bravo" },
            { id: "p2", name: "Alpha" },
            { id: "p3", name: "Charlie" },
        ]}/>);
    expect(within(screen.getByRole("list", { name: "Catalog products" })).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
        "Alpha",
        "Bravo",
        "Charlie",
    ]);
    await user.click(screen.getByRole("button", { name: "Sort: A to Z" }));
    expect(screen.getByRole("button", { name: "Sort: Z to A" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Catalog products" })).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
        "Charlie",
        "Bravo",
        "Alpha",
    ]);
    await user.type(screen.getByRole("searchbox", { name: "Search catalog" }), "br");
    expect(within(screen.getByRole("list", { name: "Catalog products" })).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
        "Bravo",
    ]);
});
it("shows an empty state when the current filters hide every product", async () => {
    const user = userEvent.setup();
    render(<SortableCatalog products={[{ id: "p1", name: "Alpha" }]}/>);
    await user.type(screen.getByRole("searchbox", { name: "Search catalog" }), "zzz");
    expect(screen.getByText("No catalog products.")).toBeInTheDocument();
});
