// GET /api/catalog/offers?ids=<id>,<id>,... (simdeals/apps/api/src/catalog/). Only canonicals with
// status `promoted` appear; unknown or unpublished ids are simply missing from the response.
// Prices are integer **cents** (unlike PriceHistoryResponse, which is in euros).

export type CanonicalOffer = {
  /** Simdeck builds the store link as /api/go/<productId>. */
  productId: string;
  store: { id: string; name: string };
  title: string;
  /** Main image of the store's product page (http(s) URL hosted by the store), or null. */
  imageUrl: string | null;
  /** Cents: cheapest eligible variant (rule 4.4 of the catalog plan); null when none is left. */
  price: number | null;
  /** Cents, from the same variant as `price`. */
  compareAtPrice: number | null;
  /** Some eligible variant is available (same as `price !== null`). */
  available: boolean;
  updatedAt: string;
};

export type CanonicalOffers = {
  canonicalId: string;
  /**
   * The canonical's own `image_url` (set by the worker or edited in the admin) or, when it has none, the image of the
   * first listed offer that has one (cheapest first). Null when neither exists. Hosted by the store, not by simdeals.
   */
  imageUrl: string | null;
  /** Cents: minimum of the non-null offer prices, or null. */
  minPrice: number | null;
  currency: "EUR";
  offers: CanonicalOffer[];
};

export type OffersResponse = Record<string, CanonicalOffers>;
