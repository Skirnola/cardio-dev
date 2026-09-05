import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { SearchableProductList } from "../../../src/components/503-searchable-product-list";
it("filters products from a labeled search input and updates the visible count", async () => {
    const user = userEvent.setup();
    render(<SearchableProductList products={[
            { id: "p1", name: "Camera", inStock: true },
            { id: "p2", name: "Cable", inStock: true },
            { id: "p3", name: "Keyboard", inStock: true },
            { id: "p4", name: "Mouse", inStock: false },
        ]}/>);
    const list = screen.getByRole("list", { name: "Products" });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
        "Cable",
        "Camera",
        "Keyboard",
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("3 products");
    await user.type(screen.getByRole("searchbox", { name: "Search products" }), "ca");
    expect(within(screen.getByRole("list", { name: "Products" })).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
        "Cable",
        "Camera",
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("2 products");
    await user.clear(screen.getByRole("searchbox", { name: "Search products" }));
    await user.type(screen.getByRole("searchbox", { name: "Search products" }), "zzz");
    expect(screen.getByText("No matching products.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("0 products");
});
