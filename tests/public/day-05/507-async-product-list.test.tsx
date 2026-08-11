import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AsyncProductList } from "../../../src/components/507-async-product-list";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

it("loads products on mount and renders the resolved list", async () => {
  const deferred = createDeferred<readonly { id: string; name: string }[]>();
  const loadProducts = vi.fn(() => deferred.promise);

  render(<AsyncProductList loadProducts={loadProducts} />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading products...");
  expect(loadProducts).toHaveBeenCalledTimes(1);

  deferred.resolve([
    { id: "p1", name: "Cable" },
    { id: "p2", name: "Camera" },
  ]);

  const list = await screen.findByRole("list", { name: "Products" });
  expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "Cable",
    "Camera",
  ]);
});

it("shows an error state and retries the request when asked", async () => {
  const user = userEvent.setup();
  const secondAttempt = createDeferred<readonly { id: string; name: string }[]>();
  const loadProducts = vi
    .fn()
    .mockRejectedValueOnce(new Error("boom"))
    .mockImplementationOnce(() => secondAttempt.promise);

  render(<AsyncProductList loadProducts={loadProducts} />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load products.");

  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(loadProducts).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("status")).toHaveTextContent("Loading products...");

  secondAttempt.resolve([{ id: "p3", name: "Lamp" }]);

  const list = await screen.findByRole("list", { name: "Products" });
  expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "Lamp",
  ]);
});

it("renders an empty state when the loader returns no products", async () => {
  const loadProducts = vi.fn().mockResolvedValue([]);

  render(<AsyncProductList loadProducts={loadProducts} />);

  expect(await screen.findByText("No products available.")).toBeInTheDocument();
});
