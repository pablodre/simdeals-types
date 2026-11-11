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
  /**
   * Name of the configuration `price` is for, as the store calls it ("2 Pedales / Sin Base"). Set when the
   * product has several configurations at different prices and a person chose which one is the item; null
   * when there is nothing to explain (one price, or identified by its barcode) or there is no price.
   */
  variantTitle: string | null;
  /** The store sells dearer configurations of this product today: show `price` as a "from" price. */
  fromPrice: boolean;
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
 * - `retired`: published once and withdrawn;
 * - `removed`: an admin discarded it (it was nonsense and matched nothing): Simdeck drops it from every
 *   setup, as if nobody had ever added it. Only the environments that asked for it get it.
 */
export type CatalogItemState = "published" | "pending" | "rejected" | "retired" | "merged" | "removed";

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

// ---------- GET /api/catalog/deals (plan docs/plans/simdeck-deals.md in simdeals, section 5) ----------
// The deal list: what is really cheap today, ranked by how good the drop is against what that same variant
// used to cost. Needs the environment's token, like the catalog itself.
//
// Two things worth knowing before using it:
// - `compareAtPrice` is what the store declares as the old price (63 % of the live catalog carries one), so
//   it is shown but it never means "this is a deal". The signal is `dropFromMedianBp` + `isWindowLow`.
// - the headline may only name `coverageFrom`, the oldest price simdeals has of that item ("the lowest since
//   3 September"). The window is 90 days, but the data does not always go that far back.

export type DealItem = {
  canonicalId: string;
  /** Never null: only published items are listed. */
  slug: string;
  name: string;
  brand: { slug: string | null; label: string };
  /** Simdeck's `GearType`; `OTHER` when its category has no mapping. */
  gearType: string;
  category: string;
  imageUrl: string | null;
  /** Cents: the price right now, re-read when the request is served. */
  price: number;
  /** Cents: the old price the store declares, or null. */
  compareAtPrice: number | null;
  /** Cents: cheapest and median day before this price started, of the variant that gives it. */
  windowMinPrice: number;
  windowMedianPrice: number;
  /** Drop against `windowMedianPrice` in basis points (1 250 = 12,5 %). */
  dropFromMedianBp: number;
  /** Cheaper than every day before `priceSince`. */
  isWindowLow: boolean;
  /** When this price started. */
  priceSince: string;
  /** Oldest price simdeals has of this item: the only span a headline may name. */
  coverageFrom: string;
  store: { id: string; slug: string; name: string };
  /** How many stores sell it today, whatever stores the request asked for. */
  storeCount: number;
  /** Simdeck builds the store link as /api/go/<productId>. */
  productId: string;
  /** 0-100. Only meaningful as an order. */
  score: number;
};

export type DealsFacets = {
  gearTypes: { value: string; count: number }[];
  brands: { slug: string; label: string; count: number }[];
  /** Every store with deals today, asked for or not; `isDefault` is what simdeals' admin preselects. */
  stores: { slug: string; name: string; count: number; isDefault: boolean }[];
};

export type DealsResponse = {
  items: DealItem[];
  page: number;
  pageSize: number;
  /** Items matching the filters. It can be slightly above what is servable: see `price`. */
  total: number;
  /** When the ranking was computed; null when there is nothing. The prices are from now. */
  computedAt: string | null;
  /** The ranking is more than 36 h old: decide whether to show the section. */
  stale: boolean;
  facets: DealsFacets;
};
