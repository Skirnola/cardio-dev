import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { ProductList, type ProductListItem } from "../../../src/components/501-product-list";

it("renders in-stock products in name order and leaves the source array unchanged", () => {
  const products: ProductListItem[] = [
    { id: "p3", name: "Monitor", priceCents: 21900, inStock: true },
    { id: "p1", name: "Cable", priceCents: 1200, inStock: true },
    { id: "p2", name: "Mouse", priceCents: 3500, inStock: false },
    { id: "p4", name: "Keyboard", priceCents: 4999, inStock: true },
  ];
  const snapshot = structuredClone(products);

  render(<ProductList products={products} />);

  const list = screen.getByRole("list", { name: "Products" });
  expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "Cable — $12.00",
    "Keyboard — $49.99",
    "Monitor — $219.00",
  ]);
  expect(screen.queryByText(/Mouse/)).not.toBeInTheDocument();
  expect(products).toEqual(snapshot);
});

it("shows an empty state when no products can be displayed", () => {
  render(
    <ProductList
      products={[
        { id: "p1", name: "Mouse", priceCents: 3500, inStock: false },
      ]}
    />,
  );

  expect(screen.getByText("No products available.")).toBeInTheDocument();
  expect(screen.queryByRole("list", { name: "Products" })).not.toBeInTheDocument();
});
