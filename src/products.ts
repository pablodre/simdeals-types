export type ProductStore = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  title: string;
  handle: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  sku: string | null;
  ean: string | null;
  barcode: string | null;
  productUrl: string;
  isActive: boolean;
  store: ProductStore;
  canonicalProductId: string | null;
  minPrice: number | null;
  maxCompareAtPrice: number | null;
};

export type CanonicalProduct = {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  description: string | null;
  category: string;
};

export type CanonicalProductWithProducts = CanonicalProduct & {
  products: Product[];
  minPrice: number | null;
  maxCompareAtPrice: number | null;
};

export type ProductStoreOffer = ProductStore & {
  productId: string;
  productUrl: string;
  sku: string | null;
  ean: string | null;
  barcode: string | null;
  minPrice: number | null;
  maxCompareAtPrice: number | null;
};

export type CanonicalProductListItem = Product & {
  stores: ProductStoreOffer[];
};

export type ProductsResponse = {
  items: Array<Product | CanonicalProductListItem>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};
