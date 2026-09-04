import iconRoadmap from "../assets/icons/icon-roadmap.svg";
import iconSparkle from "../assets/icons/icon-sparkle.svg";
import { ExploreButton } from "./ExploreButton";
import type { PageId } from "./LeftNavbar";

export function RoadmapCard({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <section className="card">
      <div className="card-header">
        <div className="card-header__left">
          <div className="card-header__icon">
            <img className="icon" src={iconRoadmap} width={20} height={20} alt="" />
          </div>
          <div className="card-header__titles">
            <h2>Roadmap</h2>
            <p>How we can get there · Current to Target State Transformation</p>
          </div>
        </div>
        <ExploreButton onClick={() => onNavigate("roadmap")} />
      </div>

      <div className="waves">
        <div className="wave wave--1">
          <div className="wave-bar wave-bar--1">$9M-11M</div>
          <div className="wave-kpi wave-kpi--1">
            <p className="wave-kpi__title">Wave 1</p>
            <p className="wave-kpi__desc">
              4 focus areas · quick-win automations already proven in observed workflows
            </p>
          </div>
        </div>
        <div className="wave wave--2">
          <div className="wave-bar wave-bar--2">$12M-15M</div>
          <div className="wave-kpi wave-kpi--2">
            <p className="wave-kpi__title">Wave 2</p>
            <p className="wave-kpi__desc">
              3 focus areas · assisted decisioning across claims and renewals
            </p>
          </div>
        </div>
        <div className="wave wave--3">
          <div className="wave-bar wave-bar--3">$9M-11M</div>
          <div className="wave-kpi wave-kpi--3">
            <p className="wave-kpi__title">Wave 3</p>
            <p className="wave-kpi__desc">
              4 focus areas · structural transformation of core processing
            </p>
          </div>
        </div>
      </div>

      <div className="recommended">
        <div className="recommended__inner">
          <img className="icon" src={iconSparkle} width={16.14} height={16.14} alt="" />
          <p className="recommended__text">
            <span className="recommended__lead">Recommended first move:&nbsp;</span>
            <span className="recommended__rest">
              Policy Renewal and Servicing Engine — readiness 91/100, highest of all focus areas.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
