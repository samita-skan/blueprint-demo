import skanLogo from "../assets/icons/skan-logo.svg";
import skanBrandIcon from "../assets/brand/skanai_icon.svg";
import filterFunnel from "../assets/icons/filter-funnel.svg";
import calendar from "../assets/icons/calendar.svg";
import chevronDown from "../assets/icons/icon-chevron-down.svg";
import { useBrand } from "../brand/BrandContext";

export function TopNavbar() {
  const { brand } = useBrand();
  const branded = brand === "skan-2026";

  return (
    <header className="top-nav">
      <div className="top-nav__left">
        <div className="logo-wrap">
          <img
            className="icon"
            src={branded ? skanBrandIcon : skanLogo}
            width={branded ? 32 : 36.34}
            height={branded ? 32 : 30.75}
            alt="Skan AI"
          />
        </div>
        <div className="brand-block">
          <div className={`brand-name${branded ? " brand-name--wordmark" : ""}`}>
            {branded ? (
              <p className="brand-name__text">
                Skan AI <span className="brand-name__product">Blueprint</span>
              </p>
            ) : (
              <p className="brand-name__text">
                Skan<span className="brand-name__ai">AI</span> Blueprint
              </p>
            )}
          </div>
          <div className="v-divider" />
          <div className="persona-title">
            <p className="persona-title__text">Strategic Team</p>
          </div>
        </div>
      </div>
      <div className="top-nav__right">
        <button className="btn-filter" type="button">
          <img className="icon" src={filterFunnel} width={16} height={16} alt="" />
          <span className="btn-filter__label">Filter</span>
        </button>
        <button className="date-range" type="button" aria-label="Observation period Jul 10, 2026 to Jul 28, 2026">
          <img className="icon" src={calendar} width={16} height={16} alt="" />
          <span className="date-range__full">Jul 10, 2026 - Jul 28, 2026</span>
          <span className="date-range__short">Jul 10–28</span>
          <img className="icon date-range__chevron" src={chevronDown} width={20} height={20} alt="" />
        </button>
      </div>
    </header>
  );
}
