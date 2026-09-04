import { useCallback, useEffect, useRef, useState } from "react";
import iconCurrentTitle from "../assets/icons/icon-current-title.svg";
import iconInfo from "../assets/icons/icon-info.svg";
import { ChartTools, type ThresholdBand } from "./ThresholdPopover";
import iconSelectChevron from "../assets/icons/icon-select-chevron.svg";
import iconSortDown from "../assets/icons/icon-sort-down.svg";
import iconSortFill from "../assets/icons/icon-sort-fill.svg";
import iconRowChevron from "../assets/icons/icon-row-chevron.svg";
import iconExpand from "../assets/icons/icon-expand.svg";
import iconVerified from "../assets/icons/icon-verified.svg";
import iconAdd from "../assets/icons/icon-add.svg";
import iconMinus from "../assets/icons/icon-minus.svg";
import { ProcessView } from "./ProcessView";
import { RoleDeepDive } from "./RoleDeepDive";
import { NatureOfWork } from "./NatureOfWork";

const PAGE_SIZE = 10;
const NESTED_PAGE_SIZE = 5;

const TABS = ["Workstation and Apps", "Process View", "Role Deep-dive", "Nature of Work", "Drift"] as const;

const WS_VIEW_OPTIONS = [
  "Business Unit",
  "Function",
  "Job Title",
  "Segment",
  "Territory",
  "Region",
  "Country",
  "Compensation Band",
  "Manager",
  "Site / Branch",
  "Agency Number",
  "Line of Business",
  "Employment Type",
  "Shift",
] as const;

const APP_VIEW_OPTIONS = ["Application Category", "Application Title"] as const;

type UsageSeg = { key: string; flex: number; color: string; label: string; detail?: string };

type WorkstationRow = {
  name: string;
  participants: string;
  avg: string;
  segments: UsageSeg[];
};

type AppRow = {
  name: string;
  participants: string;
  avg: string;
  verified?: boolean;
  segments: UsageSeg[];
};

const WS_OVER = "var(--ws-over)";
const WS_HEALTHY = "var(--ws-healthy)";
const WS_UNDER = "var(--ws-under)";
const APP_HIGH = "var(--app-high)";
const APP_MOD = "var(--app-mod)";
const APP_LOW = "var(--app-low)";

const WS_SEGMENTS: UsageSeg[][] = [
  [
    { key: "over", flex: 11, color: WS_OVER, label: "Over-used", detail: "182 participants (37%)" },
    { key: "healthy", flex: 827, color: WS_HEALTHY, label: "Healthy" },
    { key: "under", flex: 174, color: WS_UNDER, label: "Under-used" },
  ],
  [
    { key: "over", flex: 44, color: WS_OVER, label: "Over-used", detail: "182 participants (37%)" },
    { key: "healthy", flex: 746, color: WS_HEALTHY, label: "Healthy" },
    { key: "under", flex: 222, color: WS_UNDER, label: "Under-used" },
  ],
  [
    { key: "over", flex: 68, color: WS_OVER, label: "Over-used" },
    { key: "healthy", flex: 863, color: WS_HEALTHY, label: "Healthy" },
    { key: "under", flex: 81, color: WS_UNDER, label: "Under-used" },
  ],
  [
    { key: "over", flex: 107, color: WS_OVER, label: "Over-used" },
    { key: "healthy", flex: 896, color: WS_HEALTHY, label: "Healthy" },
    { key: "under", flex: 9, color: WS_UNDER, label: "Under-used" },
  ],
  [
    { key: "over", flex: 147, color: WS_OVER, label: "Over-used" },
    { key: "healthy", flex: 764, color: WS_HEALTHY, label: "Healthy" },
    { key: "under", flex: 101, color: WS_UNDER, label: "Under-used" },
  ],
];

const WS_STATS = [
  { participants: "1,300", avg: "10.0" },
  { participants: "900", avg: "9.0" },
  { participants: "600", avg: "9.0" },
  { participants: "850", avg: "8.0" },
  { participants: "450", avg: "8.0" },
];

function wsRows(names: string[]): WorkstationRow[] {
  return names.map((name, index) => ({
    name,
    participants: WS_STATS[index].participants,
    avg: WS_STATS[index].avg,
    segments: WS_SEGMENTS[index],
  }));
}

const WORKSTATION_BY_VIEW: Record<(typeof WS_VIEW_OPTIONS)[number], WorkstationRow[]> = {
  "Business Unit": wsRows(["Personal Lines", "Retail Services", "Wholesale Distribution", "Finance & Actuarial", "E-commerce Solutions"]),
  Function: wsRows(["Underwriting", "Claims", "Customer Service", "Actuarial", "IT Operations"]),
  "Job Title": wsRows(["Claims Adjuster", "Underwriter", "Customer Service Rep", "Actuary", "Team Lead"]),
  Segment: wsRows(["Personal", "Commercial", "Specialty", "Life", "Group Benefits"]),
  Territory: wsRows(["Northeast", "Southeast", "Midwest", "Southwest", "West"]),
  Region: wsRows(["North America", "EMEA", "APAC", "LATAM", "Global Shared Services"]),
  Country: wsRows(["United States", "Canada", "United Kingdom", "Germany", "India"]),
  "Compensation Band": wsRows(["Band 1", "Band 2", "Band 3", "Band 4", "Band 5"]),
  Manager: wsRows(["A. Patel", "J. Chen", "M. Rossi", "S. Okonkwo", "L. Berg"]),
  "Site / Branch": wsRows(["Chicago HQ", "Dallas Hub", "London Office", "Toronto Branch", "Remote"]),
  "Agency Number": wsRows(["AG-1042", "AG-1188", "AG-2210", "AG-3345", "AG-4091"]),
  "Line of Business": wsRows(["Auto", "Home", "Workers Comp", "Commercial Property", "Liability"]),
  "Employment Type": wsRows(["Full-time", "Part-time", "Contract", "Seasonal", "Temporary"]),
  Shift: wsRows(["Day", "Evening", "Night", "Weekend", "Rotating"]),
};

const PARENT_SEGMENTS: UsageSeg[] = [
  { key: "high", flex: 354, color: APP_HIGH, label: "High", detail: "820 participants (77%)" },
  { key: "mod", flex: 142, color: APP_MOD, label: "Moderate" },
  { key: "low", flex: 588, color: APP_LOW, label: "Low" },
];

const CATEGORY_CHILDREN: AppRow[] = [
  { name: "Outlook", participants: "1,300", avg: "5.1", verified: true, segments: [{ key: "high", flex: 381, color: APP_HIGH, label: "High" }, { key: "mod", flex: 221, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 527, color: APP_LOW, label: "Low" }] },
  { name: "MS Teams · meetings", participants: "800", avg: "5.1", verified: true, segments: [{ key: "high", flex: 354, color: APP_HIGH, label: "High" }, { key: "mod", flex: 176, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 527, color: APP_LOW, label: "Low" }] },
  { name: "Guidewire ClaimCenter", participants: "1,300", avg: "4.0", verified: true, segments: [{ key: "high", flex: 354, color: APP_HIGH, label: "High" }, { key: "mod", flex: 281, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
  { name: "Duck Creek Policy", participants: "1,300", avg: "2.5", verified: true, segments: [{ key: "high", flex: 354, color: APP_HIGH, label: "High" }, { key: "mod", flex: 489, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
];

const TITLE_APPS: AppRow[] = [
  { name: "MS Teams · meetings", participants: "1,300", avg: "5.1", verified: true, segments: [{ key: "high", flex: 354, color: APP_HIGH, label: "High", detail: "820 participants (77%)" }, { key: "mod", flex: 142, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
  { name: "Outlook", participants: "1,300", avg: "4.8", verified: true, segments: [{ key: "high", flex: 235, color: APP_HIGH, label: "High" }, { key: "mod", flex: 310, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
  { name: "Guidewire ClaimCenter", participants: "1,300", avg: "4.0", verified: true, segments: [{ key: "high", flex: 354, color: APP_HIGH, label: "High" }, { key: "mod", flex: 281, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
  { name: "Duck Creek Policy", participants: "1,300", avg: "2.5", verified: true, segments: [{ key: "high", flex: 354, color: APP_HIGH, label: "High" }, { key: "mod", flex: 489, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
  { name: "Sumo", participants: "1,300", avg: "5.0", segments: [{ key: "high", flex: 461, color: APP_HIGH, label: "High" }, { key: "mod", flex: 534, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
  { name: "Salesforce", participants: "900", avg: "2.0", segments: [{ key: "high", flex: 354, color: APP_HIGH, label: "High" }, { key: "mod", flex: 547, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
  { name: "Guidewire PolicyCenter", participants: "900", avg: "2.0", verified: true, segments: [{ key: "high", flex: 759, color: APP_HIGH, label: "High" }, { key: "mod", flex: 142, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
  { name: "Chrome · research", participants: "900", avg: "1.0", verified: true, segments: [{ key: "high", flex: 443, color: APP_HIGH, label: "High" }, { key: "mod", flex: 551, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
  { name: "MS Teams", participants: "900", avg: "3.8", verified: true, segments: [{ key: "high", flex: 301, color: APP_HIGH, label: "High" }, { key: "mod", flex: 382, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
  { name: "Word", participants: "900", avg: "1.0", verified: true, segments: [{ key: "high", flex: 461, color: APP_HIGH, label: "High" }, { key: "mod", flex: 534, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 588, color: APP_LOW, label: "Low" }] },
];

const MORE_APPS: AppRow[] = [
  { name: "SharePoint", participants: "920", avg: "2.4", verified: true, segments: [{ key: "high", flex: 280, color: APP_HIGH, label: "High" }, { key: "mod", flex: 340, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 392, color: APP_LOW, label: "Low" }] },
  { name: "Excel", participants: "1,120", avg: "3.1", verified: true, segments: [{ key: "high", flex: 310, color: APP_HIGH, label: "High" }, { key: "mod", flex: 260, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 442, color: APP_LOW, label: "Low" }] },
  { name: "ServiceNow", participants: "510", avg: "1.9", verified: true, segments: [{ key: "high", flex: 180, color: APP_HIGH, label: "High" }, { key: "mod", flex: 290, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 542, color: APP_LOW, label: "Low" }] },
  { name: "Zoom", participants: "780", avg: "1.6", verified: true, segments: [{ key: "high", flex: 160, color: APP_HIGH, label: "High" }, { key: "mod", flex: 250, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 602, color: APP_LOW, label: "Low" }] },
  { name: "Slack", participants: "430", avg: "1.4", verified: true, segments: [{ key: "high", flex: 140, color: APP_HIGH, label: "High" }, { key: "mod", flex: 220, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 652, color: APP_LOW, label: "Low" }] },
  { name: "Adobe Acrobat", participants: "390", avg: "1.1", verified: true, segments: [{ key: "high", flex: 90, color: APP_HIGH, label: "High" }, { key: "mod", flex: 210, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 712, color: APP_LOW, label: "Low" }] },
  { name: "Jira", participants: "270", avg: "0.9", verified: true, segments: [{ key: "high", flex: 70, color: APP_HIGH, label: "High" }, { key: "mod", flex: 180, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 762, color: APP_LOW, label: "Low" }] },
  { name: "Confluence", participants: "210", avg: "0.7", verified: true, segments: [{ key: "high", flex: 50, color: APP_HIGH, label: "High" }, { key: "mod", flex: 160, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 802, color: APP_LOW, label: "Low" }] },
  { name: "PowerPoint", participants: "640", avg: "1.2", verified: true, segments: [{ key: "high", flex: 200, color: APP_HIGH, label: "High" }, { key: "mod", flex: 280, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 532, color: APP_LOW, label: "Low" }] },
  { name: "OneNote", participants: "310", avg: "0.8", verified: true, segments: [{ key: "high", flex: 80, color: APP_HIGH, label: "High" }, { key: "mod", flex: 170, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 762, color: APP_LOW, label: "Low" }] },
];

const EXTRA_TITLE_APPS: AppRow[] = [
  { name: "OneDrive", participants: "580", avg: "1.3", verified: true, segments: [{ key: "high", flex: 190, color: APP_HIGH, label: "High" }, { key: "mod", flex: 240, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 582, color: APP_LOW, label: "Low" }] },
  { name: "MS Teams · chat", participants: "870", avg: "2.2", verified: true, segments: [{ key: "high", flex: 250, color: APP_HIGH, label: "High" }, { key: "mod", flex: 300, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 462, color: APP_LOW, label: "Low" }] },
  { name: "Visio", participants: "180", avg: "0.6", verified: true, segments: [{ key: "high", flex: 40, color: APP_HIGH, label: "High" }, { key: "mod", flex: 140, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 832, color: APP_LOW, label: "Low" }] },
  { name: "Notepad", participants: "260", avg: "0.5", segments: [{ key: "high", flex: 30, color: APP_HIGH, label: "High" }, { key: "mod", flex: 120, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 862, color: APP_LOW, label: "Low" }] },
  { name: "Remote Desktop", participants: "340", avg: "1.5", verified: true, segments: [{ key: "high", flex: 160, color: APP_HIGH, label: "High" }, { key: "mod", flex: 220, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 632, color: APP_LOW, label: "Low" }] },
  { name: "Citrix Workspace", participants: "410", avg: "2.7", verified: true, segments: [{ key: "high", flex: 280, color: APP_HIGH, label: "High" }, { key: "mod", flex: 260, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 472, color: APP_LOW, label: "Low" }] },
  { name: "Adobe Illustrator", participants: "90", avg: "0.4", verified: true, segments: [{ key: "high", flex: 20, color: APP_HIGH, label: "High" }, { key: "mod", flex: 100, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 892, color: APP_LOW, label: "Low" }] },
  { name: "Snipping Tool", participants: "150", avg: "0.3", segments: [{ key: "high", flex: 10, color: APP_HIGH, label: "High" }, { key: "mod", flex: 80, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 922, color: APP_LOW, label: "Low" }] },
  { name: "GlobalProtect VPN", participants: "700", avg: "0.9", verified: true, segments: [{ key: "high", flex: 60, color: APP_HIGH, label: "High" }, { key: "mod", flex: 190, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 762, color: APP_LOW, label: "Low" }] },
  { name: "Calculator", participants: "120", avg: "0.2", segments: [{ key: "high", flex: 8, color: APP_HIGH, label: "High" }, { key: "mod", flex: 70, color: APP_MOD, label: "Moderate" }, { key: "low", flex: 934, color: APP_LOW, label: "Low" }] },
];

const TITLE_ALL: AppRow[] = [...TITLE_APPS, ...MORE_APPS, ...EXTRA_TITLE_APPS];
const MEETING_CHILDREN: AppRow[] = [...CATEGORY_CHILDREN, ...MORE_APPS];

function fillApps(count: number, seed: AppRow[]): AppRow[] {
  return Array.from({ length: count }, (_, index) => {
    const source = seed[index % seed.length];
    if (index < seed.length) return source;
    return { ...source, name: `${source.name} ${index + 1}` };
  });
}

const CATEGORY_BAR: UsageSeg[] = PARENT_SEGMENTS;

type AppCategory = {
  key: string;
  label: string;
  participants: string;
  avg: string;
  segments: UsageSeg[];
  children: AppRow[];
};

const APP_CATEGORIES: AppCategory[] = [
  { key: "meeting", label: "Meeting and Collaboration (14)", participants: "1,300", avg: "5.1", segments: CATEGORY_BAR, children: MEETING_CHILDREN },
  { key: "lob", label: "Core LOB / Insurance Systems (28)", participants: "1,000", avg: "5.1", segments: CATEGORY_BAR, children: fillApps(28, TITLE_ALL) },
  { key: "email", label: "Email & Messaging (28)", participants: "950", avg: "5.1", segments: CATEGORY_BAR, children: fillApps(28, TITLE_ALL) },
  { key: "docs", label: "Productivity & Documents (28)", participants: "946", avg: "5.1", segments: CATEGORY_BAR, children: fillApps(28, TITLE_ALL) },
  { key: "crm", label: "CRM & Sales Systems (28)", participants: "879", avg: "5.1", segments: CATEGORY_BAR, children: fillApps(28, TITLE_ALL) },
  { key: "research", label: "Research & External (28)", participants: "800", avg: "5.1", segments: CATEGORY_BAR, children: fillApps(28, TITLE_ALL) },
  { key: "knowledge", label: "Knowledge Management (28)", participants: "800", avg: "5.1", segments: CATEGORY_BAR, children: fillApps(28, TITLE_ALL) },
  { key: "browser", label: "Browser & Utilities (28)", participants: "800", avg: "5.1", segments: CATEGORY_BAR, children: fillApps(28, TITLE_ALL) },
  { key: "ops", label: "Operations Support (28)", participants: "800", avg: "5.1", segments: CATEGORY_BAR, children: fillApps(28, TITLE_ALL) },
  { key: "custom", label: "Custom (28)", participants: "800", avg: "5.1", segments: CATEGORY_BAR, children: fillApps(28, TITLE_ALL) },
  { key: "finance", label: "Finance & Accounting (12)", participants: "720", avg: "4.8", segments: CATEGORY_BAR, children: fillApps(12, TITLE_ALL) },
  { key: "hr", label: "HR & People Systems (11)", participants: "680", avg: "4.2", segments: CATEGORY_BAR, children: fillApps(11, TITLE_ALL) },
  { key: "itsm", label: "IT Service Management (9)", participants: "610", avg: "3.9", segments: CATEGORY_BAR, children: fillApps(9, TITLE_ALL) },
  { key: "security", label: "Security & Identity (8)", participants: "540", avg: "3.1", segments: CATEGORY_BAR, children: fillApps(8, TITLE_ALL) },
  { key: "analytics", label: "Analytics & Reporting (7)", participants: "480", avg: "2.8", segments: CATEGORY_BAR, children: fillApps(7, TITLE_ALL) },
  { key: "design", label: "Design & Creative (6)", participants: "410", avg: "2.2", segments: CATEGORY_BAR, children: fillApps(6, TITLE_ALL) },
  { key: "other", label: "Uncategorized (5)", participants: "320", avg: "1.6", segments: CATEGORY_BAR, children: fillApps(5, TITLE_ALL) },
];

function UsageBar({ name, segments }: { name: string; segments: UsageSeg[] }) {
  return (
    <div className="usage-bar" role="img" aria-label={`${name} usage distribution`}>
      {segments.map((segment, index) => (
        <div
          key={segment.key}
          className={`usage-bar__seg${index === 0 ? " usage-bar__seg--first" : ""}${
            index === segments.length - 1 ? " usage-bar__seg--last" : ""
          }`}
          style={{ flexGrow: segment.flex, background: segment.color }}
        >
          <span className="usage-tip">
            <strong>{name}</strong>
            <span className="usage-tip__row">
              <span className="usage-tip__dot" style={{ background: segment.color }} />
              {segment.label}
              {segment.detail ? ` : ${segment.detail}` : ""}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function ViewByMenu({
  label,
  value,
  displayValue,
  options,
  searchable,
  open,
  onToggle,
  onClose,
  onSelect,
}: {
  label?: string;
  value: string;
  displayValue?: string;
  options: readonly string[];
  searchable?: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (option: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const filtered = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="view-by" ref={rootRef}>
      {label ? <span>{label}</span> : null}
      <div className="view-by__wrap">
        <button
          className={`view-by__control${open ? " view-by__control--open" : ""}`}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={onToggle}
        >
          <span>{displayValue ?? value}</span>
          <img className={`icon view-by__chevron${open ? " view-by__chevron--open" : ""}`} src={iconSelectChevron} width={24} height={24} alt="" />
        </button>
        {open ? (
          <div className={`view-by__menu${searchable ? " view-by__menu--wide" : ""}`} role="listbox" aria-label={label ?? "View by"}>
            {searchable ? (
              <input
                className="view-by__search"
                type="text"
                placeholder="Search fields..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />
            ) : null}
            <div className="view-by__list">
              {filtered.length === 0 ? (
                <div className="view-by__empty">No matching fields</div>
              ) : null}
              {filtered.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={option === value}
                  className={`view-by__item${option === value ? " view-by__item--active" : ""}`}
                  onClick={() => onSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function parseMetric(value: string) {
  return Number(value.replace(/,/g, ""));
}

type SortKey = "participants" | "avg";
type SortDir = "asc" | "desc";
type SortState = { key: SortKey; dir: SortDir };

const DEFAULT_SORT: SortState = { key: "avg", dir: "desc" };

function sortMetricRows<T extends { participants: string; avg: string }>(rows: T[], sort: SortState): T[] {
  const sign = sort.dir === "asc" ? 1 : -1;
  const secondary: SortKey = sort.key === "avg" ? "participants" : "avg";
  return [...rows].sort((a, b) => {
    const primary = (parseMetric(a[sort.key]) - parseMetric(b[sort.key])) * sign;
    if (primary !== 0) return primary;
    return (parseMetric(a[secondary]) - parseMetric(b[secondary])) * sign;
  });
}

function nextSort(current: SortState, key: SortKey, dir?: SortDir): SortState {
  if (dir) return { key, dir };
  if (current.key === key) return { key, dir: current.dir === "desc" ? "asc" : "desc" };
  return { key, dir: "desc" };
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey, dir?: SortDir) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <div className="cs-table__sortable">
      <button
        className="cs-table__sort-label"
        type="button"
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
        onClick={() => onSort(sortKey)}
      >
        {label}
      </button>
      {active ? (
        <button
          className="cs-table__sort-icon"
          type="button"
          aria-label={`Sort ${label} ${sort.dir === "asc" ? "descending" : "ascending"}`}
          onClick={() => onSort(sortKey)}
        >
          <img
            className={`icon sort-fill${sort.dir === "asc" ? " sort-fill--asc" : ""}`}
            src={iconSortFill}
            width={20}
            height={20}
            alt=""
          />
        </button>
      ) : (
        <span className="sort-pair">
          <button type="button" aria-label={`Sort ${label} ascending`} onClick={() => onSort(sortKey, "asc")}>
            <img className="icon sort-pair__up" src={iconSortDown} width={10} height={5} alt="" />
          </button>
          <button type="button" aria-label={`Sort ${label} descending`} onClick={() => onSort(sortKey, "desc")}>
            <img className="icon" src={iconSortDown} width={10} height={5} alt="" />
          </button>
        </span>
      )}
    </div>
  );
}

function ShowMoreBar({
  visible,
  total,
  initialSize = PAGE_SIZE,
  onMore,
  onLess,
  indent,
}: {
  visible: number;
  total: number;
  initialSize?: number;
  onMore: () => void;
  onLess: () => void;
  indent?: boolean;
}) {
  if (total <= initialSize) return null;
  const canMore = visible < total;
  const canLess = visible > initialSize;
  if (!canMore && !canLess) return null;
  return (
    <div className={`cs-table__more${indent ? " cs-table__more--indent" : ""}`}>
      {canLess ? (
        <button className="btn-more" type="button" onClick={onLess}>
          <img className="icon" src={iconMinus} width={16} height={16} alt="" />
          Show less
        </button>
      ) : null}
      {canMore ? (
        <button className="btn-more" type="button" onClick={onMore}>
          <img className="icon" src={iconAdd} width={16} height={16} alt="" />
          Show 10 more
        </button>
      ) : null}
    </div>
  );
}

function AppName({ name, verified }: { name: string; verified?: boolean }) {
  return (
    <div className="cs-table__name cs-table__name--app">
      <span>{name}</span>
      {verified ? (
        <span className="safe-badge">
          <img className="icon" src={iconVerified} width={16} height={16} alt="" />
          <span className="icon-btn__tip">Safelisted</span>
        </span>
      ) : null}
    </div>
  );
}

function truncateAppView(value: (typeof APP_VIEW_OPTIONS)[number]) {
  return value === "Application Category" ? "Applications Categ.." : "Applications Title";
}

export function CurrentStatePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Workstation and Apps");
  const [wsView, setWsView] = useState<(typeof WS_VIEW_OPTIONS)[number]>("Business Unit");
  const [appView, setAppView] = useState<(typeof APP_VIEW_OPTIONS)[number]>("Application Category");
  const [openMenu, setOpenMenu] = useState<"ws" | "app" | null>(null);
  const [expandedKey, setExpandedKey] = useState("meeting");
  const [catVisible, setCatVisible] = useState(PAGE_SIZE);
  const [childVisible, setChildVisible] = useState(NESTED_PAGE_SIZE);
  const [titleVisible, setTitleVisible] = useState(PAGE_SIZE);
  const [wsSort, setWsSort] = useState<SortState>(DEFAULT_SORT);
  const [appSort, setAppSort] = useState<SortState>(DEFAULT_SORT);
  const [wsBand, setWsBand] = useState<ThresholdBand>({ high: 8, low: 6 });
  const [appBand, setAppBand] = useState<ThresholdBand>({ high: 4, low: 1 });
  const closeMenus = useCallback(() => setOpenMenu(null), []);

  const workstationRows = sortMetricRows(WORKSTATION_BY_VIEW[wsView], wsSort);
  const sortedCategories = sortMetricRows(APP_CATEGORIES, appSort);
  const visibleCategories = sortedCategories.slice(0, catVisible);
  const visibleTitleApps = sortMetricRows(TITLE_ALL, appSort).slice(0, titleVisible);

  return (
    <div className="stack-32">
      <div className="page-title">
        <img className="icon" src={iconCurrentTitle} width={24} height={24} alt="" />
        <h1>Current State</h1>
      </div>

      <div className="cs-tabs" role="tablist" aria-label="Current State views">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={`cs-tab${tab === item ? " cs-tab--active" : ""}`}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Process View" ? <ProcessView /> : null}
      {tab === "Role Deep-dive" ? <RoleDeepDive /> : null}
      {tab === "Nature of Work" ? <NatureOfWork /> : null}
      {tab !== "Workstation and Apps" ? null : (
      <>
      <div className="cs-kpis">
        <article className="cs-kpi">
          <p className="cs-kpi__label">Total Participants</p>
          <p className="cs-kpi__value">9,414</p>
          <p className="cs-kpi__meta">100% of 9,414 participants</p>
        </article>
        <article className="cs-kpi">
          <p className="cs-kpi__label">Avg hrs/day at Workstation</p>
          <p className="cs-kpi__value">9</p>
        </article>
        <article className="cs-kpi">
          <p className="cs-kpi__label">Apps Observed</p>
          <p className="cs-kpi__value">214</p>
        </article>
      </div>

      <section className="card cs-chart">
        <div className="cs-chart__header">
          <div>
            <div className="cs-chart__title-row">
              <h2>Workstation Usage (Daily)</h2>
              <img className="icon" src={iconInfo} width={20} height={20} alt="" />
            </div>
            <p>Grouped by {wsView}</p>
          </div>
          <div className="cs-chart__controls">
            <ViewByMenu
              label="View by:"
              value={wsView}
              options={WS_VIEW_OPTIONS}
              searchable
              open={openMenu === "ws"}
              onToggle={() => setOpenMenu((current) => (current === "ws" ? null : "ws"))}
              onClose={closeMenus}
              onSelect={(option) => {
                setWsView(option as (typeof WS_VIEW_OPTIONS)[number]);
                setOpenMenu(null);
              }}
            />
            <ChartTools variant="workstation" value={wsBand} onApply={setWsBand} />
          </div>
        </div>

        <div className="cs-table">
            <div className="cs-table__row cs-table__row--head">
            <div>{wsView}</div>
            <SortHeader
              label="Participants"
              sortKey="participants"
              sort={wsSort}
              onSort={(key, dir) => setWsSort((current) => nextSort(current, key, dir))}
            />
            <div>Usage Distribution</div>
            <SortHeader
              label="Avg hrs/day"
              sortKey="avg"
              sort={wsSort}
              onSort={(key, dir) => setWsSort((current) => nextSort(current, key, dir))}
            />
          </div>
          {workstationRows.map((row) => (
            <div className="cs-table__row" key={row.name}>
              <div className="cs-table__name">{row.name}</div>
              <div>{row.participants}</div>
              <UsageBar name={row.name} segments={row.segments} />
              <div className="cs-table__avg">
                <span>{row.avg}</span>
                <img className="icon" src={iconRowChevron} width={20} height={20} alt="" />
              </div>
            </div>
          ))}
        </div>

        <div className="cs-legend">
          <span className="cs-legend__item">
            <span className="cs-legend__dot" style={{ background: WS_OVER }} />
            Over-used (&gt;{wsBand.high} hrs/day)
          </span>
          <span className="cs-legend__item">
            <span className="cs-legend__dot" style={{ background: WS_HEALTHY }} />
            Healthy ({wsBand.low}-{wsBand.high} hrs/day)
          </span>
          <span className="cs-legend__item">
            <span className="cs-legend__dot" style={{ background: WS_UNDER }} />
            Under-used (&lt;{wsBand.low} hrs/day)
          </span>
        </div>
      </section>

      <section className="card cs-chart">
        <div className="cs-chart__header">
          <div>
            <div className="cs-chart__title-row">
              <h2>Application Usage (Daily)</h2>
              <img className="icon" src={iconInfo} width={20} height={20} alt="" />
            </div>
            <p>
              {appView === "Application Category"
                ? "Grouped by Application Category · Click any row for more details"
                : "Showing usage for individual applications"}
            </p>
          </div>
          <div className="cs-chart__controls">
            <ViewByMenu
              label="View by:"
              value={appView}
              displayValue={truncateAppView(appView)}
              options={APP_VIEW_OPTIONS}
              open={openMenu === "app"}
              onToggle={() => setOpenMenu((current) => (current === "app" ? null : "app"))}
              onClose={closeMenus}
              onSelect={(option) => {
                setAppView(option as (typeof APP_VIEW_OPTIONS)[number]);
                setCatVisible(PAGE_SIZE);
                setChildVisible(NESTED_PAGE_SIZE);
                setTitleVisible(PAGE_SIZE);
                setExpandedKey("meeting");
                setOpenMenu(null);
              }}
            />
            <ChartTools variant="apps" value={appBand} onApply={setAppBand} />
          </div>
        </div>

        {appView === "Application Category" ? (
          <div className="cs-table">
            <div className="cs-table__row cs-table__row--head">
              <div>Application Category ({APP_CATEGORIES.length})</div>
              <SortHeader
                label="Avg Participants"
                sortKey="participants"
                sort={appSort}
                onSort={(key, dir) => setAppSort((current) => nextSort(current, key, dir))}
              />
              <div>Usage Distribution</div>
              <SortHeader
                label="Avg hrs/day"
                sortKey="avg"
                sort={appSort}
                onSort={(key, dir) => setAppSort((current) => nextSort(current, key, dir))}
              />
            </div>

            {visibleCategories.map((category) => {
              const isOpen = expandedKey === category.key;
              const visibleChildren = sortMetricRows(category.children, appSort).slice(0, childVisible);
              return (
                <div key={category.key}>
                  <button
                    className="cs-table__row cs-table__row--parent"
                    type="button"
                    onClick={() => {
                      setExpandedKey((current) => (current === category.key ? "" : category.key));
                      setChildVisible(NESTED_PAGE_SIZE);
                    }}
                  >
                    <div className="cs-table__name cs-table__name--parent">
                      <img
                        className={`icon cs-expand${isOpen ? " cs-expand--open" : ""}`}
                        src={iconExpand}
                        width={20}
                        height={20}
                        alt=""
                      />
                      {category.label}
                    </div>
                    <div>{category.participants}</div>
                    <UsageBar name={category.label} segments={category.segments} />
                    <div className="cs-table__avg">
                      <span>{category.avg}</span>
                      <img className="icon" src={iconRowChevron} width={20} height={20} alt="" />
                    </div>
                  </button>
                  {isOpen
                    ? visibleChildren.map((row, index) => (
                        <div className="cs-table__row" key={`${category.key}-${row.name}-${index}`}>
                          <div className="cs-table__name cs-table__name--child">
                            <span>{row.name}</span>
                            {row.verified ? (
                              <span className="safe-badge">
                                <img className="icon" src={iconVerified} width={16} height={16} alt="" />
                                <span className="icon-btn__tip">Safelisted</span>
                              </span>
                            ) : null}
                          </div>
                          <div>{row.participants}</div>
                          <UsageBar name={row.name} segments={row.segments} />
                          <div className="cs-table__avg">
                            <span>{row.avg}</span>
                            <img className="icon" src={iconRowChevron} width={20} height={20} alt="" />
                          </div>
                        </div>
                      ))
                    : null}
                  {isOpen ? (
                    <ShowMoreBar
                      visible={childVisible}
                      total={category.children.length}
                      initialSize={NESTED_PAGE_SIZE}
                      indent
                      onMore={() => setChildVisible((count) => Math.min(count + PAGE_SIZE, category.children.length))}
                      onLess={() => setChildVisible(NESTED_PAGE_SIZE)}
                    />
                  ) : null}
                </div>
              );
            })}

            <ShowMoreBar
              visible={catVisible}
              total={APP_CATEGORIES.length}
              onMore={() => setCatVisible((count) => Math.min(count + PAGE_SIZE, APP_CATEGORIES.length))}
              onLess={() => setCatVisible(PAGE_SIZE)}
            />
          </div>
        ) : (
          <div className="cs-table">
            <div className="cs-table__row cs-table__row--head">
              <div>Application</div>
              <SortHeader
                label="Avg Participants"
                sortKey="participants"
                sort={appSort}
                onSort={(key, dir) => setAppSort((current) => nextSort(current, key, dir))}
              />
              <div>Usage Distribution</div>
              <SortHeader
                label="Avg hrs/day"
                sortKey="avg"
                sort={appSort}
                onSort={(key, dir) => setAppSort((current) => nextSort(current, key, dir))}
              />
            </div>
            {visibleTitleApps.map((row, index) => (
              <div className="cs-table__row" key={`${row.name}-${index}`}>
                <AppName name={row.name} verified={row.verified} />
                <div>{row.participants}</div>
                <UsageBar name={row.name} segments={row.segments} />
                <div className="cs-table__avg">
                  <span>{row.avg}</span>
                  <img className="icon" src={iconRowChevron} width={20} height={20} alt="" />
                </div>
              </div>
            ))}
            <ShowMoreBar
              visible={titleVisible}
              total={TITLE_ALL.length}
              onMore={() => setTitleVisible((count) => Math.min(count + PAGE_SIZE, TITLE_ALL.length))}
              onLess={() => setTitleVisible(PAGE_SIZE)}
            />
          </div>
        )}

        <div className="cs-legend cs-legend--apps">
          <span className="cs-legend__safe">
            <img className="icon" src={iconVerified} width={16.79} height={16.79} alt="" />
            Safe Listed
          </span>
          <span className="cs-legend__rule" />
          <span className="cs-legend__avg">Avg. Usage</span>
          <span className="cs-legend__item">
            <span className="cs-legend__dot" style={{ background: APP_HIGH }} />
            High (&gt;{appBand.high} hrs/day)
          </span>
          <span className="cs-legend__item">
            <span className="cs-legend__dot" style={{ background: APP_MOD }} />
            Moderate ({appBand.low}-{appBand.high} hrs/day)
          </span>
          <span className="cs-legend__item">
            <span className="cs-legend__dot" style={{ background: APP_LOW }} />
            Low (&lt;{appBand.low} hrs/day)
          </span>
        </div>
      </section>
      </>
      )}
    </div>
  );
}
