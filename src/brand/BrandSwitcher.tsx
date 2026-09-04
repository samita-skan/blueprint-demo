import { useBrand, type BrandId } from "./BrandContext";

const OPTIONS: { id: BrandId; label: string; hint: string }[] = [
  { id: "original", label: "Original", hint: "Current product" },
  { id: "skan-2026", label: "New brand", hint: "Skan AI guidelines" },
];

export function BrandSwitcher() {
  const { brand, setBrand } = useBrand();

  return (
    <div className="brand-switcher" role="region" aria-label="Compare brand versions">
      <p className="brand-switcher__label">Compare versions</p>
      <div className="brand-switcher__tabs" role="tablist" aria-label="Product brand version">
        {OPTIONS.map((option) => {
          const active = brand === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`brand-switcher__tab${active ? " brand-switcher__tab--active" : ""}`}
              onClick={() => setBrand(option.id)}
            >
              <span className="brand-switcher__tab-label">{option.label}</span>
              <span className="brand-switcher__tab-hint">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
