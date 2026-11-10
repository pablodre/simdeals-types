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

// ---------- GET /api/catalog (simdeals/apps/api/src/catalog/, token per environment) ----------
// The whole item catalog Simdeck reads instead of keeping its own `Gear` table. Every id simdeals
// ever handed to that environment is here, so an id stored in a user's setup always resolves.

/**
 * State of an item **as that environment sees it today**:
 * - `published`: on sale (canonical `promoted`), the only state with offers and a page;
 * - `pending` / `rejected`: a user of that environment asked for it and it is not published yet;
 * - `merged`: it was merged into another item (`mergedIntoId` is the final destination);
 * - `retired`: published once and withdrawn.
 */
export type CatalogItemState = "published" | "pending" | "rejected" | "retired" | "merged";

export type CatalogItem = {
  /** The canonical's uuid: what Simdeck stores in a setup. */
  id: string;
  /** URL of its page in Simdeck. Set when it is first published and never changed; null before that. */
  slug: string | null;
  state: CatalogItemState;
  /** Final destination, already resolved through a chain of merges. Null unless `state` is `merged`. */
  mergedIntoId: string | null;
  /** `label` is the brand's name ("Moza Racing"); `slug` is null while the brand is not resolved. */
  brand: { slug: string | null; label: string; websiteUrl: string | null };
  /** Model, without the brand. */
  name: string;
  /** Category slug in simdeals (`product_categories.slug`). */
  category: string;
  /** Simdeck's own `GearType` for that category; `OTHER` when it has no mapping. */
  gearType: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
  specs: Record<string, string>;
  updatedAt: string;
};

export type CatalogResponse = {
  /** Hash of `items`: send it back as `If-None-Match` to get a 304 while nothing changed. */
  version: string;
  generatedAt: string;
  items: CatalogItem[];
};

// ---------- POST /api/catalog/canonicals ----------
// The item a Simdeck user asks for from the setup editor. Idempotent: the same brand, name and user
// always give the same item back and leave no new rows, and a duplicate is never a 409.

/** 201 when it creates the item, 200 when it already existed, 429 over the per-user daily limit. */
export type CreateCanonicalBody = {
  /** 1-80 characters. */
  brand: string;
  /** 1-120 characters. simdeals strips the brand from the front of it. */
  name: string;
  /** Simdeck `GearType`; simdeals picks the category from it, and an unknown one falls back to `OTHER`. */
  gearType: string;
  websiteUrl?: string;
  /** Simdeck's `User.id` (1-80 chars) and nickname: they feed the per-user limit and "who is waiting". */
  requestedBy: { id: string; nickname?: string };
};

/**
 * `created: false` when an item with the same brand and name already existed, whatever its state. The
 * limit behind the 429 is 10 **different** items per user, environment and day; asking again for one
 * the user already asked for does not count.
 */
export type CreateCanonicalResponse = { created: boolean; item: CatalogItem };

// ---------- GET /api/catalog/:id/price-history?days=30|90|365|all ----------
// Only published items; anything else is a 404. Prices in **cents**, as in OffersResponse.

export type CatalogPricePoint = {
  /** Calendar day in `Europe/Madrid` ("2026-11-10"). */
  date: string;
  /** Cents: the lowest the store had that day, or null when it had nothing on sale. */
  price: number | null;
  /** Same as `price !== null`, as in `OffersResponse`. */
  available: boolean;
};

export type CatalogPriceSeries = {
  store: { id: string; name: string };
  /** One point per day of the window, oldest first. */
  points: CatalogPricePoint[];
};

export type CanonicalPriceHistory = {
  canonicalId: string;
  /** Days asked for, or `all` (the whole history). */
  days: number | "all";
  /** First and last day of the window, in `Europe/Madrid`. */
  from: string;
  to: string;
  /** A store with no price in the whole window is left out, not drawn as a line of nulls. */
  series: CatalogPriceSeries[];
  /** Cheapest point of the window (earliest day of that price), or null if there was never one. */
  lowest: { price: number; date: string; storeId: string } | null;
};
