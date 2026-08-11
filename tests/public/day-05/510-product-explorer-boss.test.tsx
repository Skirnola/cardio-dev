import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ProductExplorerBoss } from "../../../src/components/510-product-explorer-boss";

it("loads products on mount and lets the user filter the current results by category and price direction", async () => {
  const user = userEvent.setup();
  const searchProducts = vi.fn().mockResolvedValue([
    {
      id: "p1",
      name: "Desk Lamp",
      category: "Lighting",
      priceCents: 3000,
      featured: true,
      inStock: true,
      updatedAt: "2024-05-01T10:00:00.000Z",
    },
    {
      id: "p2",
      name: "Cable",
      category: "Office",
      priceCents: 1200,
      featured: false,
      inStock: true,
      updatedAt: "2024-05-01T10:00:00.000Z",
    },
    {
      id: "p3",
      name: "Mouse",
      category: "Office",
      priceCents: 1500,
      featured: false,
      inStock: true,
      updatedAt: "2024-05-01T10:00:00.000Z",
    },
  ]);

  render(<ProductExplorerBoss searchProducts={searchProducts} />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading products...");

  const table = await screen.findByRole("table", { name: "Products" });
  const rowNames = () =>
    within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[0]?.textContent);

  expect(rowNames()).toEqual(["Desk Lamp", "Cable", "Mouse"]);

  await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "Office");
  expect(rowNames()).toEqual(["Cable", "Mouse"]);

  await user.click(screen.getByRole("button", { name: "Sort by price: low to high" }));
  expect(screen.getByRole("button", { name: "Sort by price: high to low" })).toBeInTheDocument();
  expect(rowNames()).toEqual(["Mouse", "Cable"]);
});

it("shows an error message and retries the current request", async () => {
  const user = userEvent.setup();
  const searchProducts = vi
    .fn()
    .mockRejectedValueOnce(new Error("boom"))
    .mockResolvedValueOnce([]);

  render(<ProductExplorerBoss searchProducts={searchProducts} />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load products.");

  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(searchProducts).toHaveBeenNthCalledWith(1, "");
  expect(searchProducts).toHaveBeenNthCalledWith(2, "");
  expect(await screen.findByText("No products found.")).toBeInTheDocument();
});
