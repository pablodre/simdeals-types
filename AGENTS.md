# AGENTS.md — simdeals-types

Tipos TypeScript compartidos que describen las respuestas de la API de SimDeals
(repo `simdeals`, `apps/api`). Solo tipos: sin runtime, sin build, sin dependencias.

## Estructura

```
src/index.ts          Re-exporta todo con `export type { ... }`
src/products.ts       Product, ProductStore, ProductStoreOffer, CanonicalProduct*, ProductsResponse
src/price-history.ts  PricePoint, StoreHistory, VariantHistory, PriceHistoryResponse
src/catalog.ts        La API de Simdeck: CanonicalOffer/CanonicalOffers/OffersResponse (GET /api/catalog/offers),
                      CatalogItem/CatalogResponse (GET /api/catalog), CreateCanonicalBody/CreateCanonicalResponse
                      (POST /api/catalog/canonicals) y CanonicalPriceHistory (GET /api/catalog/:id/price-history)
```

Se publica como `@pablodre/simdeals-types` y se consume desde GitHub
(`"@pablodre/simdeals-types": "github:pablodre/simdeals-types"` en `simdeals-web`).
`package.json` apunta `main`/`types`/`exports` directamente a `src/index.ts`; el consumidor compila el TS.

## Reglas

- Estos tipos son el contrato de `GET /api/products` (`ProductsResponse`) y
  `GET /api/products/:id/price-history` (`PriceHistoryResponse`) para la web, y de toda la API de Simdeck:
  `GET /api/catalog/offers` (`OffersResponse`), `GET /api/catalog` (`CatalogResponse`),
  `POST /api/catalog/canonicals` (`CreateCanonicalBody` / `CreateCanonicalResponse`) y
  `GET /api/catalog/:id/price-history` (`CanonicalPriceHistory`).
  La fuente de verdad es `simdeals/apps/api/src/products/products.service.ts` y, para el catálogo,
  `simdeals/apps/api/src/catalog/catalog.types.ts` (copia idéntica): compara siempre con ese código antes de cambiar nada.
- **Aquí no van valores**, solo tipos: los límites y constantes de esa copia (longitudes máximas, cuántos artículos
  puede pedir un usuario al día) se cuentan en los comentarios, no se exportan como `const`.
- Los endpoints de `/api/catalog` (menos `offers`) piden el token del entorno; en Simdeck es `SIMDEALS_API_TOKEN`.
- Unidades de precio **distintas según endpoint**: en `ProductsResponse` (`minPrice`, `maxCompareAtPrice`) y en
  `OffersResponse` (`minPrice`, `price`, `compareAtPrice`) son enteros en **céntimos**; en `PriceHistoryResponse` (`PricePoint.price`, `compareAtPrice`) la API
  divide entre 100 y devuelve **euros** con decimales.
- Fechas son strings ISO (`PricePoint.date`).
- Campos que pueden faltar en BD se tipan `T | null`, no opcionales.
- Todo tipo nuevo debe re-exportarse en `src/index.ts` con `export type`. Imports relativos con extensión `.js`.
- Comprueba con `npx tsc --noEmit` (no hay tests ni scripts).

## Publicar un cambio

1. Commit + push a `main` (no hay versionado semántico; `version` en `package.json` no se usa).
2. En `simdeals-web`: `pnpm update @pablodre/simdeals-types` para recoger el nuevo commit.
