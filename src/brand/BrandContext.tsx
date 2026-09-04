import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type BrandId = "original" | "skan-2026";

const STORAGE_KEY = "blueprint-brand-version";

type BrandContextValue = {
  brand: BrandId;
  setBrand: (brand: BrandId) => void;
};

const BrandContext = createContext<BrandContextValue | null>(null);

function readBrand(): BrandId {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("brand");
  if (fromQuery === "original" || fromQuery === "skan-2026") return fromQuery;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "original" || stored === "skan-2026") return stored;
  return "skan-2026";
}

export function applyBrand(brand: BrandId) {
  document.documentElement.dataset.brand = brand;
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrandState] = useState<BrandId>(() => {
    const next = readBrand();
    applyBrand(next);
    return next;
  });

  useEffect(() => {
    applyBrand(brand);
    window.localStorage.setItem(STORAGE_KEY, brand);
    const url = new URL(window.location.href);
    url.searchParams.set("brand", brand);
    window.history.replaceState({}, "", url);
  }, [brand]);

  const value = useMemo(
    () => ({
      brand,
      setBrand: setBrandState,
    }),
    [brand],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
}
