export type Product = {
  id: string;
  title: string;
  handle: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  productUrl: string;
  isActive: boolean;
  store: {
    id: string;
    name: string;
  };
  minPrice: number | null;
  maxCompareAtPrice: number | null;
};

export type ProductsResponse = {
  items: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};
