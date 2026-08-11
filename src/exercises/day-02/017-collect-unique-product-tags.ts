export type Product = {
  sku: string;
  name: string;
  discontinued: boolean;
  tags: readonly string[];
};

export function collectUniqueProductTags(products: readonly Product[]): string[] {
  throw new Error("Not implemented");
}
