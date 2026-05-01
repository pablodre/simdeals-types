export type PricePoint = {
  date: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
};

export type VariantHistory = {
  id: string;
  title: string;
  data: PricePoint[];
};

export type PriceHistoryResponse = {
  productId: string;
  variants: VariantHistory[];
};
