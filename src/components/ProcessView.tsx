import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import iconInfo from "../assets/icons/icon-info.svg";
import iconInfo16 from "../assets/icons/icon-info-16.svg";
import { ExportButton } from "./IconButton";
import iconSelectChevron from "../assets/icons/icon-select-chevron.svg";
import iconSortDown from "../assets/icons/icon-sort-down.svg";
import iconSortFill from "../assets/icons/icon-sort-fill.svg";
import iconAdd from "../assets/icons/icon-add.svg";
import iconMinus from "../assets/icons/icon-minus.svg";
import iconExpand from "../assets/icons/icon-expand.svg";
import iconChevronRight from "../assets/icons/icon-chevron-right.svg";
import iconChevronDownBlue from "../assets/icons/icon-chevron-down-blue.svg";
import iconClose from "../assets/icons/icon-close.svg";
import iconSparkle from "../assets/icons/icon-sparkle-24.svg";
import iconInfoFilled from "../assets/icons/icon-info-filled.svg";
import iconProcess from "../assets/icons/icon-process.svg";
import iconSubprocess from "../assets/icons/icon-subprocess.svg";
import iconTask from "../assets/icons/icon-task.svg";
import iconActivity from "../assets/icons/icon-activity.svg";
import iconCrumbChevron from "../assets/icons/icon-crumb-chevron.svg";
import { BackButton } from "./BackButton";
import {
  HIERARCHY_LEVELS,
  deepestHierarchyLevel,
  isHierarchyCrumbReached,
  toggleHierarchyExpand,
} from "../hierarchy";

const PAGE_SIZE = 10;
const PV_VIEW_OPTIONS = ["Enterprise", "Business Unit"] as const;

type PvView = (typeof PV_VIEW_OPTIONS)[number];
type SortKey = "participants" | "cost";
type TreeSortKey = "group" | "participants" | "hrs" | "freq" | "salary" | "pct" | "cost";
type SortDir = "asc" | "desc";
type SortState = { key: SortKey; dir: SortDir };
type TreeSortState = { key: TreeSortKey; dir: SortDir };
type HowKind = "formula" | "row";
type TreeLevel = "process" | "subprocess" | "task" | "activity";

type ProcessRow = {
  id: string;
  name: string;
  subprocesses: number;
  tasks: number;
  activities: number;
  participants: number;
  cost: number;
  unit: string;
};

type TreeNode = {
  id: string;
  name: string;
  level: TreeLevel;
  childCount: number;
  participants: string;
  hrs: string;
  freq: string;
  salary: string;
  pct: string;
  cost: string;
  children?: TreeNode[];
};

const PROCESSES: ProcessRow[] = [
  { id: "engagement", name: "Engagement Delivery", subprocesses: 140, tasks: 470, activities: 1300, participants: 4600, cost: 22, unit: "Personal Lines" },
  { id: "pmo", name: "Project Management & PMO", subprocesses: 3, tasks: 40, activities: 600, participants: 1900, cost: 18, unit: "Personal Lines" },
  { id: "invoice", name: "Invoice-to-Pay", subprocesses: 38, tasks: 404, activities: 6000, participants: 1050, cost: 16, unit: "Personal Lines" },
  { id: "resource", name: "Resource Deployment & Staffing", subprocesses: 3, tasks: 40, activities: 600, participants: 1300, cost: 13, unit: "Personal Lines" },
  { id: "otc", name: "Order-to-Cash & Collections", subprocesses: 3, tasks: 40, activities: 600, participants: 950, cost: 12, unit: "Personal Lines" },
  { id: "lnd", name: "Learning & Development Ops", subprocesses: 3, tasks: 40, activities: 600, participants: 1050, cost: 14, unit: "Personal Lines" },
  { id: "r2r", name: "Record-to-Report & Reconciliation", subprocesses: 3, tasks: 40, activities: 600, participants: 650, cost: 9, unit: "Personal Lines" },
  { id: "hrsc", name: "HR Service Center", subprocesses: 3, tasks: 40, activities: 600, participants: 850, cost: 12, unit: "Personal Lines" },
  { id: "knowledge", name: "Knowledge & Delivery Excellence", subprocesses: 3, tasks: 40, activities: 600, participants: 1200, cost: 8, unit: "Personal Lines" },
  { id: "tne", name: "Travel & Expense", subprocesses: 3, tasks: 40, activities: 600, participants: 350, cost: 5, unit: "Personal Lines" },
  { id: "claims", name: "Claims Adjudication", subprocesses: 12, tasks: 90, activities: 1100, participants: 720, cost: 7.5, unit: "Personal Lines" },
  { id: "policy", name: "Policy Administration", subprocesses: 8, tasks: 64, activities: 880, participants: 610, cost: 6.8, unit: "Personal Lines" },
  { id: "vendor", name: "Vendor Management", subprocesses: 6, tasks: 48, activities: 720, participants: 540, cost: 6.2, unit: "Retail Services" },
  { id: "support", name: "Customer Support Ops", subprocesses: 9, tasks: 70, activities: 940, participants: 980, cost: 5.8, unit: "Retail Services" },
  { id: "underwriting", name: "Underwriting Operations", subprocesses: 11, tasks: 82, activities: 1010, participants: 430, cost: 5.4, unit: "Retail Services" },
  { id: "compliance", name: "Compliance & Audit", subprocesses: 5, tasks: 36, activities: 510, participants: 290, cost: 4.9, unit: "Retail Services" },
  { id: "itsm", name: "IT Service Management", subprocesses: 7, tasks: 58, activities: 760, participants: 410, cost: 4.4, unit: "Retail Services" },
  { id: "close", name: "Finance Close", subprocesses: 4, tasks: 28, activities: 390, participants: 260, cost: 3.8, unit: "Retail Services" },
  { id: "talent", name: "Talent Acquisition", subprocesses: 6, tasks: 44, activities: 640, participants: 380, cost: 3.2, unit: "Retail Services" },
  { id: "facilities", name: "Facilities Management", subprocesses: 3, tasks: 22, activities: 280, participants: 210, cost: 2.6, unit: "Retail Services" },
];

const MAX_COST = Math.max(...PROCESSES.map((row) => row.cost));

function formatCost(value: number) {
  return `$${value.toFixed(1)}M`;
}

function formatMeta(row: ProcessRow) {
  return `${row.subprocesses} subprocesses · ${row.tasks} tasks · ${row.activities.toLocaleString()} activities`;
}

function formatPeople(value: number) {
  return value.toLocaleString();
}

function node(partial: TreeNode): TreeNode {
  return partial;
}

function makeActivities(prefix: string, count = 4): TreeNode[] {
  const names = [
    "Open source record",
    "Validate required fields",
    "Update status and notes",
    "Notify downstream owner",
    "Attach supporting files",
    "Close work item",
  ];
  return names.slice(0, count).map((name, index) =>
    node({
      id: `${prefix}-a${index}`,
      name,
      level: "activity",
      childCount: 0,
      participants: String(180 - index * 12),
      hrs: (0.4 - index * 0.04).toFixed(1),
      freq: (1.8 - index * 0.1).toFixed(1),
      salary: "$72,400",
      pct: `${(1.2 - index * 0.1).toFixed(1)}%`,
      cost: `$${(0.9 - index * 0.1).toFixed(1)}M`,
    }),
  );
}

function makeTasks(prefix: string): TreeNode[] {
  const items = [
    ["Client Onboarding Setup", 1300],
    ["Client Needs Assessment", 1500],
    ["Solution Design Workshop", 1800],
    ["Stakeholder Alignment", 1240],
    ["Documentation and Handoff", 900],
    ["Kickoff Readiness Review", 820],
    ["Access Provisioning", 760],
    ["Quality Gate Review", 640],
  ] as const;
  return items.map(([name, count], index) =>
    node({
      id: `${prefix}-t${index}`,
      name,
      level: "task",
      childCount: count,
      participants: String(520 - index * 28),
      hrs: (1.6 - index * 0.08).toFixed(1),
      freq: (2.8 - index * 0.1).toFixed(1),
      salary: "$84,200",
      pct: `${(3.4 - index * 0.2).toFixed(1)}%`,
      cost: `$${(2.4 - index * 0.15).toFixed(1)}M`,
      children: makeActivities(`${prefix}-t${index}`),
    }),
  );
}

function hierarchyFor(process: ProcessRow): TreeNode {
  const subprocesses = [
    ["Client Onboarding", 470],
    ["Delivery Execution", 470],
    ["Quality Assurance", 350],
    ["Resource Planning", 280],
    ["Status Reporting", 220],
    ["Risk Management", 180],
    ["Change Control", 160],
  ] as const;
  return node({
    id: process.id,
    name: process.name,
    level: "process",
    childCount: process.subprocesses,
    participants: formatPeople(process.participants),
    hrs: "2.1",
    freq: "3.2",
    salary: "$176,400",
    pct: `${((process.cost / MAX_COST) * 12).toFixed(0)}%`,
    cost: formatCost(process.cost),
    children: subprocesses.map(([name, count], index) =>
      node({
        id: `${process.id}-s${index}`,
        name,
        level: "subprocess",
        childCount: count,
        participants: formatPeople(Math.max(180, Math.round(process.participants * (0.42 - index * 0.04)))),
        hrs: (1.8 - index * 0.1).toFixed(1),
        freq: (2.6 - index * 0.12).toFixed(1),
        salary: "$92,800",
        pct: `${(8.4 - index * 0.8).toFixed(1)}%`,
        cost: formatCost(Math.max(1.2, process.cost * (0.38 - index * 0.04))),
        children: makeTasks(`${process.id}-s${index}`),
      }),
    ),
  });
}

function sortProcesses(rows: ProcessRow[], sort: SortState) {
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const primary = (a[sort.key] - b[sort.key]) * sign;
    if (primary !== 0) return primary;
    return (a.participants - b.participants) * sign;
  });
}

function ViewByMenu({
  value,
  options,
  open,
  onToggle,
  onClose,
  onSelect,
}: {
  value: string;
  options: readonly string[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (option: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open, onClose]);

  return (
    <div className="view-by">
      <span>View by:</span>
      <div className="view-by__wrap" ref={wrapRef}>
        <button className="view-by__control" type="button" aria-label={`View by ${value}`} onClick={onToggle}>
          <span>{value}</span>
          <img className={`icon view-by__chevron${open ? " view-by__chevron--open" : ""}`} src={iconSelectChevron} width={24} height={24} alt="" />
        </button>
        {open ? (
          <div className="view-by__menu" role="listbox" aria-label="View by">
            <div className="view-by__list">
              {options.map((option) => (
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
  const n = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function sortTreeNodes(nodes: TreeNode[], sort: TreeSortState) {
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...nodes].sort((a, b) => {
    if (sort.key === "group") return a.name.localeCompare(b.name) * sign;
    if (sort.key === "participants") return (parseMetric(a.participants) - parseMetric(b.participants)) * sign;
    if (sort.key === "hrs") return (parseMetric(a.hrs) - parseMetric(b.hrs)) * sign;
    if (sort.key === "freq") return (parseMetric(a.freq) - parseMetric(b.freq)) * sign;
    if (sort.key === "salary") return (parseMetric(a.salary) - parseMetric(b.salary)) * sign;
    if (sort.key === "pct") return (parseMetric(a.pct) - parseMetric(b.pct)) * sign;
    return (parseMetric(a.cost) - parseMetric(b.cost)) * sign;
  });
}

function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  info,
}: {
  label: string;
  sortKey: K;
  sort: { key: K; dir: SortDir };
  onSort: (key: K, dir?: SortDir) => void;
  info?: boolean;
}) {
  const active = sort.key === sortKey;
  return (
    <div className="cs-table__sortable">
      <button className="cs-table__sort-label" type="button" onClick={() => onSort(sortKey)}>
        {label}
      </button>
      {info ? <img className="icon" src={iconInfo} width={20} height={20} alt="" /> : null}
      {active ? (
        <button className="cs-table__sort-icon" type="button" onClick={() => onSort(sortKey)}>
          <img className={`icon sort-fill${sort.dir === "asc" ? " sort-fill--asc" : ""}`} src={iconSortFill} width={20} height={20} alt="" />
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

function HowKnowLink({ onClick }: { onClick: () => void }) {
  return (
    <button className="pv-know" type="button" onClick={onClick}>
      How we know
      <img className="icon" src={iconChevronDownBlue} width={20} height={20} alt="" />
    </button>
  );
}

function HowPanel({
  kind,
  process,
  onClose,
}: {
  kind: HowKind;
  process: ProcessRow | null;
  onClose: () => void;
}) {
  const title = kind === "row" && process ? process.name : null;
  return (
    <aside className="how-panel" aria-label="How Annual Cost is calculated">
      <div className="how-panel__head">
        <img className="icon" src={iconSparkle} width={24} height={24} alt="" />
        <p>How Annual Cost is calculated</p>
        <button className="how-panel__close" type="button" aria-label="Close" onClick={onClose}>
          <img className="icon" src={iconClose} width={24} height={24} alt="" />
        </button>
      </div>
      {kind === "formula" ? (
        <>
          <p className="how-panel__body">
            Every cost in this table is built bottom-up from directly observed desktop activity. We take the hours we
            observed each person spend, annualise them from the 14 day window, and multiply by their fully-loaded salary.
          </p>
          <div className="how-panel__formula">
            <p>
              Participants &nbsp;x&nbsp; Avg hrs/wk &nbsp;x&nbsp; 52 Weeks &nbsp;x&nbsp; Avg Salary
            </p>
            <p>= Annual Cost</p>
          </div>
          <p className="how-panel__note">Observed over a 14-day window and extrapolated for the whole year.</p>
        </>
      ) : (
        <>
          <div className="how-panel__rowhead">
            <p>{title}</p>
            <p>
              {formatPeople(process?.participants ?? 0)} participants · <strong>{formatCost(process?.cost ?? 0).replace(".0", "")}</strong>
            </p>
          </div>
          <p className="how-panel__step">1. What we observed?</p>
          <p className="how-panel__body">
            {formatPeople(process?.participants ?? 0)} people worked this process during the 14 day observation window.
            Every screen-level step was traced through the applications below.
          </p>
          <p className="how-panel__step">2. The math</p>
          <div className="how-math">
            <div className="how-math__row">
              <span>Participants Observed</span>
              <span>{formatPeople(process?.participants ?? 0)}</span>
            </div>
            <div className="how-math__row">
              <div>
                <span>Avg hrs/wk</span>
                <small>Directly observed</small>
              </div>
              <span>2.1 hrs</span>
            </div>
            <div className="how-math__row">
              <div>
                <span>Annualised hrs</span>
                <small>{formatPeople(process?.participants ?? 0)} x 2.1 x 52wks</small>
              </div>
              <span>502k hrs</span>
            </div>
            <div className="how-math__row">
              <div>
                <span>Avg Salary</span>
                <small>per hr</small>
              </div>
              <span>$85.0</span>
            </div>
            <div className="how-math__row how-math__row--total">
              <div>
                <span>Annual cost</span>
                <small>502k hrs x $85</small>
              </div>
              <strong>{formatCost(process?.cost ?? 0)}</strong>
            </div>
          </div>
        </>
      )}
      <div className="how-alert">
        <img className="icon" src={iconInfoFilled} width={18} height={18} alt="" />
        <p>Every hour comes from directly observed desktop activity.</p>
      </div>
    </aside>
  );
}

function levelIcon(level: TreeLevel) {
  if (level === "process") return iconProcess;
  if (level === "subprocess") return iconSubprocess;
  if (level === "task") return iconTask;
  return iconActivity;
}

function ProcessListRow({
  row,
  onOpen,
  onHow,
}: {
  row: ProcessRow;
  onOpen: () => void;
  onHow: () => void;
}) {
  return (
    <div className="pv-row">
      <button className="pv-row__main" type="button" onClick={onOpen}>
        <span className="pv-row__name">
          <span>{row.name}</span>
          <small>{formatMeta(row)}</small>
        </span>
        <span>{formatPeople(row.participants)}</span>
        <span className="pv-bar">
          <span style={{ width: `${(row.cost / MAX_COST) * 100}%` }} />
        </span>
        <span className="pv-row__cost">
          {formatCost(row.cost)}
          <span
            className="pv-row__info"
            role="button"
            tabIndex={0}
            aria-label={`How ${row.name} annual cost is calculated`}
            onClick={(event) => {
              event.stopPropagation();
              onHow();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onHow();
              }
            }}
          >
            <img className="icon" src={iconInfo16} width={16} height={16} alt="" />
          </span>
        </span>
        <img className="icon" src={iconChevronRight} width={20} height={20} alt="" />
      </button>
    </div>
  );
}

export function ProcessView() {
  const [viewBy, setViewBy] = useState<PvView>("Enterprise");
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [groupVisible, setGroupVisible] = useState<Record<string, number>>({});
  const [sort, setSort] = useState<SortState>({ key: "cost", dir: "desc" });
  const [treeSort, setTreeSort] = useState<TreeSortState>({ key: "cost", dir: "desc" });
  const [selected, setSelected] = useState<ProcessRow | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [taskVisible, setTaskVisible] = useState(5);
  const [how, setHow] = useState<{ kind: HowKind; process: ProcessRow | null } | null>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const sorted = useMemo(() => sortProcesses(PROCESSES, sort), [sort]);
  const tree = useMemo(() => (selected ? hierarchyFor(selected) : null), [selected]);

  const groups = useMemo(() => {
    const map = new Map<string, ProcessRow[]>();
    for (const row of sorted) {
      const list = map.get(row.unit) ?? [];
      list.push(row);
      map.set(row.unit, list);
    }
    return [...map.entries()].map(([name, rows]) => ({
      name,
      rows,
      count: rows.length,
      cost: rows.reduce((sum, row) => sum + row.cost, 0),
    }));
  }, [sorted]);

  const deepest = deepestHierarchyLevel(expanded);

  function toggleExpand(id: string) {
    setExpanded((current) => toggleHierarchyExpand(current, id));
    setTaskVisible(5);
  }

  function openProcess(row: ProcessRow) {
    setSelected(row);
    setExpanded([row.id]);
    setTaskVisible(5);
    setHow(null);
  }

  function nextSort(key: SortKey, dir?: SortDir): SortState {
    if (dir) return { key, dir };
    if (sort.key === key) return { key, dir: sort.dir === "desc" ? "asc" : "desc" };
    return { key, dir: "desc" };
  }

  function nextTreeSort(key: TreeSortKey, dir?: SortDir): TreeSortState {
    if (dir) return { key, dir };
    if (treeSort.key === key) return { key, dir: treeSort.dir === "desc" ? "asc" : "desc" };
    return { key, dir: "desc" };
  }

  function renderTree(node: TreeNode, depth = 0): ReactNode {
    const isOpen = expanded.includes(node.id);
    const children = node.children ?? [];
    const canExpand = children.length > 0;
    const sortedChildren = sortTreeNodes(children, treeSort);
    const shownChildren =
      node.level === "subprocess" && isOpen ? sortedChildren.slice(0, taskVisible) : isOpen ? sortedChildren : [];
    return (
      <div key={node.id}>
        <button
          className={`pv-tree__row pv-tree__row--${node.level}`}
          type="button"
          onClick={() => (canExpand ? toggleExpand(node.id) : undefined)}
        >
          <span className="pv-tree__group" style={{ paddingLeft: `${depth * 36}px` }}>
            {canExpand ? (
              <img className={`icon pv-tree__lead cs-expand${isOpen ? " cs-expand--open" : ""}`} src={iconExpand} width={20} height={20} alt="" />
            ) : (
              <span className="pv-tree__lead pv-tree__spacer" />
            )}
            <span className="pv-tree__group-cell">
              <img className="icon" src={levelIcon(node.level)} width={20} height={20} alt="" />
              <span className="pv-tree__label">
                {node.name}
                {node.childCount ? <span className="pv-tree__count">({node.childCount.toLocaleString()})</span> : null}
              </span>
            </span>
          </span>
          <span className="pv-tree__cell">{node.participants}</span>
          <span className="pv-tree__cell">{node.hrs}</span>
          <span className="pv-tree__cell">{node.freq}</span>
          <span className="pv-tree__cell">{node.salary}</span>
          <span className="pv-tree__cell">{node.pct}</span>
          <span className="pv-tree__cell">
            <span className="pv-row__cost">
              {node.cost}
              {node.level === "process" || node.level === "subprocess" ? (
                <img className="icon" src={iconInfo16} width={16} height={16} alt="" />
              ) : null}
            </span>
          </span>
        </button>
        {shownChildren.map((child) => renderTree(child, depth + 1))}
        {node.level === "subprocess" && isOpen && children.length > 5 ? (
          <div className="cs-table__more" style={{ paddingLeft: `${56 + depth * 36}px` }}>
            {taskVisible > 5 ? (
              <button className="btn-more" type="button" onClick={() => setTaskVisible(5)}>
                <img className="icon" src={iconMinus} width={16} height={16} alt="" />
                Show less
              </button>
            ) : null}
            {taskVisible < children.length ? (
              <button className="btn-more" type="button" onClick={() => setTaskVisible((count) => Math.min(count + PAGE_SIZE, children.length))}>
                <img className="icon" src={iconAdd} width={16} height={16} alt="" />
                Show 10 more Tasks
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  const listHeader = (
    <div className="cs-chart__header">
      <div>
        <div className="cs-chart__title-row">
          <h2>Process Breakdown</h2>
          <img className="icon" src={iconInfo} width={20} height={20} alt="" />
        </div>
        <p>
          {viewBy === "Enterprise"
            ? "Showing all processes · Click any row for more details"
            : "Grouped by business unit · Click any row for more details"}
        </p>
      </div>
      <div className="cs-chart__controls">
        <ViewByMenu
          value={viewBy}
          options={PV_VIEW_OPTIONS}
          open={menuOpen}
          onToggle={() => setMenuOpen((open) => !open)}
          onClose={closeMenu}
          onSelect={(option) => {
            setViewBy(option as PvView);
            setVisible(PAGE_SIZE);
            setGroupVisible({});
            setMenuOpen(false);
          }}
        />
                <ExportButton />
      </div>
    </div>
  );

  return (
    <div className="pv">
      {selected && tree ? (
        <>
          <div className="pv-nav">
            <BackButton onClick={() => setSelected(null)}>Back to all processes</BackButton>
            <h2>
              {viewBy === "Enterprise" ? tree.name : `${selected.unit}: ${tree.name}`}
            </h2>
          </div>
          <div className="cs-kpis pv-kpis">
            <article className="cs-kpi">
              <p className="cs-kpi__label">Annual Cost</p>
              <p className="cs-kpi__value">{formatCost(selected.cost).replace(".0M", "M")}</p>
              <HowKnowLink onClick={() => setHow({ kind: "row", process: selected })} />
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Total Participants</p>
              <p className="cs-kpi__value">{formatPeople(selected.participants)}</p>
              <p className="cs-kpi__meta">{selected.id === "engagement" ? 55 : Math.round((selected.participants / 9414) * 100)}% of 9,414 participants</p>
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Subprocesses Observed</p>
              <p className="cs-kpi__value">{selected.subprocesses}</p>
              <HowKnowLink onClick={() => setHow({ kind: "formula", process: selected })} />
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Tasks Observed</p>
              <p className="cs-kpi__value">{selected.tasks}</p>
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Activities Observed</p>
              <p className="cs-kpi__value">{formatPeople(selected.activities)}</p>
            </article>
          </div>
          <section className="card cs-chart">
            <div className="cs-chart__header">
              <div className="cs-chart__title-row">
                <h2>Process Hierarchy</h2>
                <img className="icon" src={iconInfo} width={20} height={20} alt="" />
              </div>
              <ExportButton />
            </div>
            <div className="pv-crumbs">
              {HIERARCHY_LEVELS.map((level, index) => (
                <span key={level} className={`pv-crumbs__item${isHierarchyCrumbReached(level, deepest) ? "" : " pv-crumbs__item--muted"}`}>
                  {index > 0 ? <img className="icon" src={iconCrumbChevron} width={20} height={20} alt="" /> : null}
                  <img className="icon" src={levelIcon(level)} width={20} height={20} alt="" />
                  {level[0].toUpperCase() + level.slice(1)}
                </span>
              ))}
            </div>
            <div className="pv-tree">
              <div className="pv-tree__head">
                <span className="pv-tree__group pv-tree__group--head">
                  <span className="pv-tree__lead" aria-hidden="true" />
                  <span className="pv-tree__group-cell">
                    <SortHeader label="Group" sortKey="group" sort={treeSort} onSort={(key, dir) => setTreeSort(nextTreeSort(key, dir))} />
                  </span>
                </span>
                <span className="pv-tree__cell">
                  <SortHeader label="Participants" sortKey="participants" sort={treeSort} onSort={(key, dir) => setTreeSort(nextTreeSort(key, dir))} />
                </span>
                <span className="pv-tree__cell">
                  <SortHeader label="Avg hrs/wk" sortKey="hrs" sort={treeSort} onSort={(key, dir) => setTreeSort(nextTreeSort(key, dir))} info />
                </span>
                <span className="pv-tree__cell">
                  <SortHeader label="Avg freq/wk" sortKey="freq" sort={treeSort} onSort={(key, dir) => setTreeSort(nextTreeSort(key, dir))} />
                </span>
                <span className="pv-tree__cell">
                  <SortHeader label="Avg Annual Salary" sortKey="salary" sort={treeSort} onSort={(key, dir) => setTreeSort(nextTreeSort(key, dir))} />
                </span>
                <span className="pv-tree__cell">
                  <SortHeader label="% of cost" sortKey="pct" sort={treeSort} onSort={(key, dir) => setTreeSort(nextTreeSort(key, dir))} />
                </span>
                <span className="pv-tree__cell">
                  <SortHeader label="Annual Cost" sortKey="cost" sort={treeSort} onSort={(key, dir) => setTreeSort(nextTreeSort(key, dir))} info />
                </span>
              </div>
              {renderTree(tree)}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="cs-kpis">
            <article className="cs-kpi">
              <p className="cs-kpi__label">Annual Cost</p>
              <p className="cs-kpi__value">$1.24B</p>
              <HowKnowLink onClick={() => setHow({ kind: "formula", process: null })} />
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Total Participants</p>
              <p className="cs-kpi__value">9,414</p>
              <p className="cs-kpi__meta">100% of 9,414 participants</p>
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Processes Observed</p>
              <p className="cs-kpi__value">48</p>
              <HowKnowLink onClick={() => setHow({ kind: "formula", process: null })} />
            </article>
          </div>
          <section className="card cs-chart">
            {listHeader}
            <div className="pv-table">
              <div className="pv-table__head">
                <div>Process</div>
                <SortHeader label="Participants" sortKey="participants" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} />
                <div>Share of Cost</div>
                <SortHeader label="Annual Cost" sortKey="cost" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} info />
                <span className="pv-table__action" />
              </div>
              {viewBy === "Enterprise"
                ? sorted.slice(0, visible).map((row) => (
                    <ProcessListRow
                      key={row.id}
                      row={row}
                      onOpen={() => openProcess(row)}
                      onHow={() => setHow({ kind: "row", process: row })}
                    />
                  ))
                : groups.map((group) => {
                    const shown = groupVisible[group.name] ?? PAGE_SIZE;
                    return (
                      <div key={group.name}>
                        <div className="pv-group">
                          {group.name} · {group.count} processes · ${Math.round(group.cost)}M total
                        </div>
                        {group.rows.slice(0, shown).map((row) => (
                          <ProcessListRow
                            key={row.id}
                            row={row}
                            onOpen={() => openProcess(row)}
                            onHow={() => setHow({ kind: "row", process: row })}
                          />
                        ))}
                        {group.rows.length > PAGE_SIZE ? (
                          <div className="cs-table__more">
                            {shown > PAGE_SIZE ? (
                              <button className="btn-more" type="button" onClick={() => setGroupVisible((current) => ({ ...current, [group.name]: PAGE_SIZE }))}>
                                <img className="icon" src={iconMinus} width={16} height={16} alt="" />
                                Show less
                              </button>
                            ) : null}
                            {shown < group.rows.length ? (
                              <button
                                className="btn-more"
                                type="button"
                                onClick={() =>
                                  setGroupVisible((current) => ({
                                    ...current,
                                    [group.name]: Math.min((current[group.name] ?? PAGE_SIZE) + PAGE_SIZE, group.rows.length),
                                  }))
                                }
                              >
                                <img className="icon" src={iconAdd} width={16} height={16} alt="" />
                                Show 10 more
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              {viewBy === "Enterprise" && sorted.length > PAGE_SIZE ? (
                <div className="cs-table__more">
                  {visible > PAGE_SIZE ? (
                    <button className="btn-more" type="button" onClick={() => setVisible(PAGE_SIZE)}>
                      <img className="icon" src={iconMinus} width={16} height={16} alt="" />
                      Show less
                    </button>
                  ) : null}
                  {visible < sorted.length ? (
                    <button className="btn-more" type="button" onClick={() => setVisible((count) => Math.min(count + PAGE_SIZE, sorted.length))}>
                      <img className="icon" src={iconAdd} width={16} height={16} alt="" />
                      Show 10 more
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        </>
      )}
      {how ? (
        <>
          <button className="how-panel__backdrop" type="button" aria-label="Dismiss how we know" onClick={() => setHow(null)} />
          <HowPanel kind={how.kind} process={how.process} onClose={() => setHow(null)} />
        </>
      ) : null}
    </div>
  );
}
