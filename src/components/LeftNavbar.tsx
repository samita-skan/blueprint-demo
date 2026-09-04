import navSummary from "../assets/icons/nav-summary.svg";
import navSummaryActive from "../assets/icons/nav-summary-active.svg";
import navCurrent from "../assets/icons/nav-current.svg";
import navCurrentActive from "../assets/icons/nav-current-active.svg";
import navTarget from "../assets/icons/nav-target.svg";
import navTargetActive from "../assets/icons/nav-target-active.svg";
import navRoadmap from "../assets/icons/nav-roadmap.svg";
import navRoadmapActive from "../assets/icons/nav-roadmap-active.svg";
import navInfo from "../assets/icons/nav-info.svg";
import navSettings from "../assets/icons/nav-settings.svg";
import avatarBg from "../assets/icons/avatar-group.svg";
import avatarShoulders from "../assets/icons/avatar-group-1.svg";
import avatarHead from "../assets/icons/avatar-head.svg";

export type PageId = "summary" | "current" | "target" | "roadmap";

type LeftNavbarProps = {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
};

function NavButton({
  label,
  active,
  icons,
  onClick,
}: {
  label: string;
  active?: boolean;
  icons: { default: string; active: string };
  onClick?: () => void;
}) {
  return (
    <button
      className={`nav-btn${active ? " nav-btn--active" : ""}`}
      type="button"
      aria-current={active ? "page" : undefined}
      aria-label={label}
      onClick={onClick}
    >
      <img className="icon" src={active ? icons.active : icons.default} width={20} height={20} alt="" />
    </button>
  );
}

export function LeftNavbar({ currentPage, onNavigate }: LeftNavbarProps) {
  return (
    <nav className="left-nav" aria-label="Primary">
      <div className="nav-group">
        <NavButton
          label="Executive Summary"
          active={currentPage === "summary"}
          icons={{ default: navSummary, active: navSummaryActive }}
          onClick={() => onNavigate("summary")}
        />
        <NavButton
          label="Current State"
          active={currentPage === "current"}
          icons={{ default: navCurrent, active: navCurrentActive }}
          onClick={() => onNavigate("current")}
        />
        <NavButton
          label="Target State"
          active={currentPage === "target"}
          icons={{ default: navTarget, active: navTargetActive }}
          onClick={() => onNavigate("target")}
        />
        <NavButton
          label="Roadmap"
          active={currentPage === "roadmap"}
          icons={{ default: navRoadmap, active: navRoadmapActive }}
          onClick={() => onNavigate("roadmap")}
        />
      </div>
      <div className="nav-group">
        <NavButton label="Help" icons={{ default: navInfo, active: navInfo }} />
        <NavButton label="User management" icons={{ default: navSettings, active: navSettings }} />
        <div className="nav-rule" />
        <div className="avatar" aria-hidden="true">
          <img className="avatar__bg" src={avatarBg} width={32} height={32} alt="" />
          <img className="avatar__shoulders" src={avatarShoulders} width={32} height={32} alt="" />
          <img className="avatar__head" src={avatarHead} width={14.72} height={17.28} alt="" />
        </div>
      </div>
    </nav>
  );
}
