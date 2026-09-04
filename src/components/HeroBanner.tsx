import { useBrand } from "../brand/BrandContext";

export function HeroBanner() {
  const { brand } = useBrand();
  const branded = brand === "skan-2026";

  return (
    <section className="hero">
      <div className="hero__primary">
        <p className="hero__value">$125M–150M</p>
        <p className="hero__caption">Total Capacity Recovery Opportunity</p>
      </div>
      <div className="hero__right">
        <p className="hero__observed">
          {branded ? "Over 18 days, Skan AI Blueprint observed" : "Over 18 days, Blueprint observed"}
        </p>
        <div className="hero__stats">
          <div className="stat">
            <p className="stat__value">5</p>
            <p className="stat__label">Business Units</p>
          </div>
          <div className="stat">
            <p className="stat__value">9,414</p>
            <p className="stat__label">Participants</p>
          </div>
          <div className="stat">
            <p className="stat__value">214</p>
            <p className="stat__label">Apps</p>
          </div>
          <div className="stat">
            <p className="stat__value">48</p>
            <p className="stat__label">Processes</p>
          </div>
        </div>
      </div>
    </section>
  );
}
