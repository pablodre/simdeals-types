export type PricePoint = {
  date: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
};

export type StoreHistory = {
  store: {
    id: string;
    name: string;
  };
  productId: string;
  productUrl: string;
  sku: string | null;
  ean: string | null;
  barcode: string | null;
  data: PricePoint[];
};

export type VariantHistory = {
  id: string;
  title: string;
  data: PricePoint[];
  stores?: StoreHistory[];
};

export type PriceHistoryResponse = {
  productId: string;
  canonicalProductId?: string | null;
  variants: VariantHistory[];
};
