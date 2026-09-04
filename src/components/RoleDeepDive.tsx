import { useCallback, useMemo, useState, type ReactNode } from "react";
import iconInfo from "../assets/icons/icon-info.svg";
import iconInfo16 from "../assets/icons/icon-info-16.svg";
import { ExportButton } from "./IconButton";
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
const TOTAL_PARTICIPANTS = 9414;

type Mode = "role" | "process";
type SortKey = "participants" | "hrs" | "cost";
type TreeSortKey = "group" | "participants" | "hrs" | "freq" | "salary" | "pct" | "cost";
type SortDir = "asc" | "desc";
type SortState = { key: SortKey; dir: SortDir };
type TreeSortState = { key: TreeSortKey; dir: SortDir };
type HowKind = "formula" | "row";
type TreeLevel = "process" | "subprocess" | "task" | "activity";

type Allocation = {
  processId: string;
  participants: number;
  hrs: number;
  cost: number;
};

type Role = {
  id: string;
  name: string;
  jobTitles: number;
  participants: number;
  cost: number;
  allocations: Allocation[];
};

type ProcessDef = {
  id: string;
  name: string;
  subprocesses: number;
  tasks: number;
  activities: number;
  participants: number;
  cost: number;
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

type Drill = {
  role: Role;
  process: ProcessDef;
  allocation: Allocation;
  from: Mode;
};

type Share = { id: string; name: string; count: number };

const PROCESS_DEFS: ProcessDef[] = [
  { id: "pmo", name: "Project Management & PMO", subprocesses: 140, tasks: 470, activities: 1300, participants: 4600, cost: 22 },
  { id: "invoice", name: "Invoice-to-Pay", subprocesses: 38, tasks: 404, activities: 6000, participants: 1050, cost: 16 },
  { id: "resource", name: "Resource Deployment & Staffing", subprocesses: 3, tasks: 40, activities: 600, participants: 1300, cost: 13 },
  { id: "otc", name: "Order-to-Cash & Collections", subprocesses: 3, tasks: 40, activities: 600, participants: 950, cost: 12 },
  { id: "engagement", name: "Engagement Delivery", subprocesses: 140, tasks: 470, activities: 1300, participants: 4600, cost: 22 },
  { id: "lnd", name: "Learning & Development Ops", subprocesses: 3, tasks: 40, activities: 600, participants: 1050, cost: 14 },
  { id: "r2r", name: "Record-to-Report & Reconciliation", subprocesses: 3, tasks: 40, activities: 600, participants: 650, cost: 9 },
  { id: "hrsc", name: "HR Service Center", subprocesses: 3, tasks: 40, activities: 600, participants: 850, cost: 12 },
  { id: "knowledge", name: "Knowledge & Delivery Excellence", subprocesses: 3, tasks: 40, activities: 600, participants: 1200, cost: 8 },
  { id: "tne", name: "Travel & Expense", subprocesses: 3, tasks: 40, activities: 600, participants: 350, cost: 5 },
  { id: "claims", name: "Claims Adjudication", subprocesses: 12, tasks: 90, activities: 1100, participants: 720, cost: 7.5 },
  { id: "policy", name: "Policy Administration", subprocesses: 8, tasks: 64, activities: 880, participants: 610, cost: 6.8 },
  { id: "vendor", name: "Vendor Management", subprocesses: 6, tasks: 48, activities: 720, participants: 540, cost: 6.2 },
  { id: "support", name: "Customer Support Ops", subprocesses: 9, tasks: 70, activities: 940, participants: 980, cost: 5.8 },
  { id: "underwriting", name: "Underwriting Operations", subprocesses: 11, tasks: 82, activities: 1010, participants: 430, cost: 5.4 },
  { id: "compliance", name: "Compliance & Audit", subprocesses: 5, tasks: 36, activities: 510, participants: 290, cost: 4.9 },
  { id: "itsm", name: "IT Service Management", subprocesses: 7, tasks: 58, activities: 760, participants: 410, cost: 4.4 },
  { id: "close", name: "Finance Close", subprocesses: 4, tasks: 28, activities: 390, participants: 260, cost: 3.8 },
  { id: "talent", name: "Talent Acquisition", subprocesses: 6, tasks: 44, activities: 640, participants: 380, cost: 3.2 },
  { id: "facilities", name: "Facilities Management", subprocesses: 3, tasks: 22, activities: 280, participants: 210, cost: 2.6 },
];

const MORE_PROCESSES: ProcessDef[] = [
  "Client Onboarding",
  "Quality Assurance Ops",
  "Change Control",
  "Risk Management",
  "Status Reporting",
  "Access Provisioning",
  "Contract Administration",
  "Billing Operations",
  "Collections Recovery",
  "Treasury Operations",
  "Payroll Processing",
  "Benefits Administration",
  "Workforce Planning",
  "Knowledge Capture",
  "Incident Management",
  "Problem Management",
  "Release Management",
  "Vendor Onboarding",
  "Procurement Intake",
  "Legal Review",
  "Regulatory Filing",
  "Customer Onboarding",
  "Renewals Management",
  "Loss Control",
  "Subrogation",
  "Reinsurance Ops",
  "Actuarial Support",
  "Data Governance",
].map((name, index) => ({
  id: `extra-${index}`,
  name,
  subprocesses: 4 + (index % 8),
  tasks: 28 + index * 3,
  activities: 240 + index * 20,
  participants: 180 + index * 15,
  cost: Number((2.4 - index * 0.04).toFixed(1)),
}));

const ALL_PROCESSES = [...PROCESS_DEFS, ...MORE_PROCESSES].slice(0, 48);

const ROLE_SEEDS: { name: string; jobTitles: number; participants: number; cost: number }[] = [
  { name: "Data Architect", jobTitles: 14, participants: 790, cost: 1.2 },
  { name: "Delivery Manager", jobTitles: 14, participants: 790, cost: 1.2 },
  { name: "Product Manager", jobTitles: 14, participants: 790, cost: 1.2 },
  { name: "Sales Engineering", jobTitles: 14, participants: 790, cost: 1.2 },
  { name: "Software Engineer", jobTitles: 14, participants: 790, cost: 1.2 },
  { name: "UX Manager", jobTitles: 14, participants: 790, cost: 1.2 },
  { name: "Underwriter", jobTitles: 14, participants: 790, cost: 1.2 },
  { name: "Ops Manager", jobTitles: 11, participants: 640, cost: 1.1 },
  { name: "Project Manager", jobTitles: 12, participants: 710, cost: 1.1 },
  { name: "Shift Supervisor", jobTitles: 8, participants: 520, cost: 0.9 },
  { name: "Engagement Manager", jobTitles: 9, participants: 610, cost: 1.0 },
  { name: "Claims Adjuster", jobTitles: 7, participants: 880, cost: 0.8 },
  { name: "Business Analyst", jobTitles: 10, participants: 430, cost: 0.9 },
  { name: "Solution Architect", jobTitles: 6, participants: 310, cost: 1.3 },
  { name: "QA Lead", jobTitles: 5, participants: 270, cost: 0.7 },
  { name: "Scrum Master", jobTitles: 4, participants: 220, cost: 0.6 },
  { name: "Finance Analyst", jobTitles: 8, participants: 390, cost: 0.8 },
  { name: "HR Partner", jobTitles: 6, participants: 280, cost: 0.6 },
  { name: "IT Support", jobTitles: 9, participants: 540, cost: 0.7 },
  { name: "Network Engineer", jobTitles: 5, participants: 190, cost: 0.8 },
  { name: "Data Analyst", jobTitles: 7, participants: 360, cost: 0.9 },
  { name: "Marketing Manager", jobTitles: 6, participants: 240, cost: 0.7 },
  { name: "Customer Success", jobTitles: 8, participants: 470, cost: 0.8 },
  { name: "Account Executive", jobTitles: 11, participants: 330, cost: 1.0 },
  { name: "Recruiter", jobTitles: 5, participants: 210, cost: 0.5 },
  { name: "Legal Counsel", jobTitles: 3, participants: 90, cost: 0.9 },
  { name: "Compliance Officer", jobTitles: 4, participants: 150, cost: 0.6 },
  { name: "Facilities Manager", jobTitles: 3, participants: 120, cost: 0.4 },
  { name: "Procurement Lead", jobTitles: 5, participants: 180, cost: 0.5 },
  { name: "Operations Analyst", jobTitles: 6, participants: 250, cost: 0.6 },
  { name: "Risk Analyst", jobTitles: 4, participants: 160, cost: 0.7 },
  { name: "Claims Manager", jobTitles: 7, participants: 410, cost: 0.9 },
  { name: "Underwriting Manager", jobTitles: 6, participants: 280, cost: 1.1 },
  { name: "Portfolio Manager", jobTitles: 5, participants: 170, cost: 1.4 },
  { name: "Program Manager", jobTitles: 8, participants: 360, cost: 1.2 },
  { name: "Technical Writer", jobTitles: 3, participants: 80, cost: 0.4 },
  { name: "DevOps Engineer", jobTitles: 6, participants: 200, cost: 1.0 },
  { name: "Security Analyst", jobTitles: 4, participants: 140, cost: 0.8 },
  { name: "Support Specialist", jobTitles: 9, participants: 620, cost: 0.5 },
  { name: "Billing Specialist", jobTitles: 5, participants: 230, cost: 0.5 },
  { name: "Training Coordinator", jobTitles: 4, participants: 110, cost: 0.4 },
  { name: "Site Supervisor", jobTitles: 6, participants: 300, cost: 0.6 },
];

const ARCHITECT_ALLOCS: Allocation[] = [
  { processId: "pmo", participants: 1900, hrs: 18.9, cost: 22 },
  { processId: "invoice", participants: 1050, hrs: 11.5, cost: 22 },
  { processId: "resource", participants: 1300, hrs: 6.0, cost: 22 },
  { processId: "otc", participants: 950, hrs: 3.9, cost: 22 },
];

function buildRoles(): Role[] {
  return ROLE_SEEDS.map((seed, index) => {
    if (index === 0) {
      return { id: slug(seed.name), ...seed, allocations: ARCHITECT_ALLOCS };
    }
    const count = 3 + (index % 3);
    const allocations: Allocation[] = Array.from({ length: count }, (_, offset) => {
      const process = ALL_PROCESSES[(index + offset * 3) % ALL_PROCESSES.length];
      return {
        processId: process.id,
        participants: Math.max(80, seed.participants - offset * 40),
        hrs: Number((12.4 - offset * 2.1 - (index % 5) * 0.3).toFixed(1)),
        cost: Number(Math.max(1.2, seed.cost * 8 - offset * 1.6).toFixed(1)),
      };
    });
    if (index < 13 && !allocations.some((item) => item.processId === "pmo")) {
      allocations.unshift({
        processId: "pmo",
        participants: Math.max(180, 1900 - index * 70),
        hrs: Number((18.9 - index * 0.6).toFixed(1)),
        cost: 22,
      });
    }
    return { id: slug(seed.name), ...seed, allocations };
  });
}

const ROLES = buildRoles();
const PROCESS_BY_ID = new Map(ALL_PROCESSES.map((process) => [process.id, process]));

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function formatCost(value: number) {
  return `$${value.toFixed(1)}M`;
}

function formatPeople(value: number) {
  return value.toLocaleString();
}

function formatHrs(value: number) {
  return value.toFixed(1);
}

function processById(id: string) {
  return PROCESS_BY_ID.get(id) ?? ALL_PROCESSES[0];
}

function sharesForRole(role: Role): Share[] {
  if (role.id === "data-architect") {
    return [
      { id: "delivery-manager", name: "Delivery Manager", count: 2 },
      { id: "ops-manager", name: "Ops Manager", count: 2 },
      { id: "project-manager", name: "Project Manager", count: 2 },
    ];
  }
  const processIds = new Set(role.allocations.map((item) => item.processId));
  return ROLES.filter((item) => item.id !== role.id)
    .map((item) => ({
      id: item.id,
      name: item.name,
      count: item.allocations.filter((alloc) => processIds.has(alloc.processId)).length,
    }))
    .filter((item) => item.count >= 2)
    .slice(0, 3);
}

function sharesForProcess(processId: string): Share[] {
  const others = ALL_PROCESSES.filter((item) => item.id !== processId).slice(0, 2);
  return others.map((item, index) => ({ id: item.id, name: item.name, count: 2 - index }));
}

function rolesForProcess(processId: string) {
  return ROLES.map((role) => {
    const allocation = role.allocations.find((item) => item.processId === processId);
    return allocation ? { role, allocation } : null;
  }).filter((item): item is { role: Role; allocation: Allocation } => item !== null);
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

function hierarchyFor(process: ProcessDef): TreeNode {
  const subprocesses = [
    ["Client Onboarding", 470],
    ["Delivery Execution", 470],
    ["Quality Assurance", 350],
    ["Customer Support", 420],
    ["Project Closeout", 470],
    ["Product Development", 500],
    ["Market Research", 300],
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
    pct: "41%",
    cost: process.cost % 1 === 0 ? `$${process.cost.toFixed(0)}M` : formatCost(process.cost),
    children: subprocesses.map(([name, count], index) =>
      node({
        id: `${process.id}-s${index}`,
        name,
        level: "subprocess",
        childCount: count,
        participants: formatPeople(Math.max(180, Math.round(process.participants * (0.42 - index * 0.04)))),
        hrs: (2.2 - index * 0.1).toFixed(1),
        freq: (3.2 - index * 0.12).toFixed(1),
        salary: index === 0 ? "$205,920" : `$${Math.round(177840 - index * 12000).toLocaleString()}`,
        pct: `${(41 - index * 5)}%`,
        cost: formatCost(Math.max(1.2, process.cost * (0.41 - index * 0.04))),
        children: makeTasks(`${process.id}-s${index}`),
      }),
    ),
  });
}

function sortAllocations<T extends { participants: number; hrs: number; cost: number }>(rows: T[], sort: SortState) {
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const primary = (a[sort.key] - b[sort.key]) * sign;
    if (primary !== 0) return primary;
    return (a.hrs - b.hrs) * sign;
  });
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
  title,
  participants,
  cost,
  onClose,
}: {
  kind: HowKind;
  title: string | null;
  participants: number;
  cost: number;
  onClose: () => void;
}) {
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
              {formatPeople(participants)} participants · <strong>{formatCost(cost).replace(".0", "")}</strong>
            </p>
          </div>
          <p className="how-panel__step">1. What we observed?</p>
          <p className="how-panel__body">
            {formatPeople(participants)} people worked this process during the 14 day observation window. Every
            screen-level step was traced through the applications below.
          </p>
          <p className="how-panel__step">2. The math</p>
          <div className="how-math">
            <div className="how-math__row">
              <span>Participants Observed</span>
              <span>{formatPeople(participants)}</span>
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
                <small>{formatPeople(participants)} x 2.1 x 52wks</small>
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
              <strong>{formatCost(cost)}</strong>
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

function ModeSwitch({ value, onChange }: { value: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="rd-switch" role="tablist" aria-label="View Role x Process by">
      {(["role", "process"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={value === mode}
          className={value === mode ? "rd-switch__item rd-switch__item--active" : "rd-switch__item"}
          onClick={() => onChange(mode)}
        >
          {mode === "role" ? "Role" : "Process"}
        </button>
      ))}
    </div>
  );
}

function ShowMore({
  visible,
  total,
  label,
  onMore,
  onLess,
}: {
  visible: number;
  total: number;
  label?: string;
  onMore: () => void;
  onLess: () => void;
}) {
  if (total <= PAGE_SIZE) return null;
  const remaining = total - visible;
  return (
    <div className="cs-table__more">
      {visible > PAGE_SIZE ? (
        <button className="btn-more" type="button" onClick={onLess}>
          <img className="icon" src={iconMinus} width={16} height={16} alt="" />
          Show less
        </button>
      ) : null}
      {visible < total ? (
        <button className="btn-more" type="button" onClick={onMore}>
          <img className="icon" src={iconAdd} width={16} height={16} alt="" />
          {label ?? `Show ${Math.min(PAGE_SIZE, remaining)} more`}
        </button>
      ) : null}
    </div>
  );
}

export function RoleDeepDive() {
  const [mode, setMode] = useState<Mode>("role");
  const [selectedRoleId, setSelectedRoleId] = useState(ROLES[0].id);
  const [selectedProcessId, setSelectedProcessId] = useState(ALL_PROCESSES[0].id);
  const [listVisible, setListVisible] = useState(PAGE_SIZE);
  const [detailVisible, setDetailVisible] = useState(PAGE_SIZE);
  const [listSort, setListSort] = useState<SortDir | null>(null);
  const [sort, setSort] = useState<SortState>({ key: "hrs", dir: "desc" });
  const [treeSort, setTreeSort] = useState<TreeSortState>({ key: "cost", dir: "desc" });
  const [drill, setDrill] = useState<Drill | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [taskVisible, setTaskVisible] = useState(5);
  const [how, setHow] = useState<{ kind: HowKind; title: string | null; participants: number; cost: number } | null>(null);

  const selectedRole = ROLES.find((role) => role.id === selectedRoleId) ?? ROLES[0];
  const selectedProcess = processById(selectedProcessId);
  const tree = useMemo(() => (drill ? hierarchyFor(drill.process) : null), [drill]);

  const sortedRoles = useMemo(() => {
    if (!listSort) return ROLES;
    return [...ROLES].sort((a, b) => (listSort === "desc" ? b.cost - a.cost : a.cost - b.cost));
  }, [listSort]);

  const processSummaries = useMemo(() => {
    const rows = ALL_PROCESSES.map((process) => {
      const members = rolesForProcess(process.id);
      return {
        process,
        roles: members.length,
        participants: process.participants,
        cost: process.cost > 8 ? 1.2 : process.cost,
      };
    });
    if (!listSort) return rows;
    return [...rows].sort((a, b) => (listSort === "desc" ? b.cost - a.cost : a.cost - b.cost));
  }, [listSort]);

  const roleAllocations = useMemo(() => {
    const rows = selectedRole.allocations.map((allocation) => ({
      ...allocation,
      process: processById(allocation.processId),
    }));
    return sortAllocations(rows, sort);
  }, [selectedRole, sort]);

  const processRoles = useMemo(() => {
    const rows = rolesForProcess(selectedProcess.id).map(({ role, allocation }) => ({
      role,
      ...allocation,
    }));
    return sortAllocations(rows, sort);
  }, [selectedProcess, sort]);

  const maxHrs = Math.max(
    0.1,
    ...(mode === "role" ? roleAllocations.map((row) => row.hrs) : processRoles.map((row) => row.hrs)),
  );

  const deepest = deepestHierarchyLevel(expanded);

  const closeHow = useCallback(() => setHow(null), []);

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

  function changeMode(next: Mode) {
    setMode(next);
    setListVisible(PAGE_SIZE);
    setDetailVisible(PAGE_SIZE);
    setDrill(null);
    setHow(null);
  }

  function openDrill(role: Role, process: ProcessDef, allocation: Allocation, from: Mode) {
    setDrill({ role, process, allocation, from });
    setExpanded([process.id]);
    setTaskVisible(5);
    setHow(null);
  }

  function toggleExpand(id: string) {
    setExpanded((current) => toggleHierarchyExpand(current, id));
    setTaskVisible(5);
  }

  function renderTree(node: TreeNode, depth = 0): ReactNode {
    const isOpen = expanded.includes(node.id);
    const children = node.children ?? [];
    const canExpand = children.length > 0;
    const sortedChildren = sortTreeNodes(children, treeSort);
    const shownChildren = node.level === "subprocess" && isOpen ? sortedChildren.slice(0, taskVisible) : isOpen ? sortedChildren : [];
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

  const roleShares = sharesForRole(selectedRole);
  const processShares = sharesForProcess(selectedProcess.id);

  return (
    <div className="pv rd">
      {drill && tree ? (
        <>
          <div className="pv-nav">
            <BackButton onClick={() => setDrill(null)}>
              {drill.from === "role" ? "Back to all roles" : "Back to all processes"}
            </BackButton>
            <h2>
              {drill.from === "role"
                ? `${drill.role.name}: ${drill.process.name}`
                : `${drill.process.name}: ${drill.role.name}`}
            </h2>
          </div>
          <div className="cs-kpis pv-kpis">
            <article className="cs-kpi">
              <p className="cs-kpi__label">Annual Cost</p>
              <p className="cs-kpi__value">${drill.process.cost.toFixed(0)}M</p>
              <HowKnowLink onClick={() => setHow({ kind: "row", title: drill.process.name, participants: drill.process.participants, cost: drill.process.cost })} />
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Total Participants</p>
              <p className="cs-kpi__value">{formatPeople(drill.process.participants)}</p>
              <p className="cs-kpi__meta">{drill.process.participants === 4600 ? 55 : Math.round((drill.process.participants / TOTAL_PARTICIPANTS) * 100)}% of {formatPeople(TOTAL_PARTICIPANTS)} participants</p>
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Subprocesses Observed</p>
              <p className="cs-kpi__value">{drill.process.subprocesses}</p>
              <HowKnowLink onClick={() => setHow({ kind: "formula", title: null, participants: drill.process.participants, cost: drill.process.cost })} />
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Tasks Observed</p>
              <p className="cs-kpi__value">{drill.process.tasks}</p>
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Activities Observed</p>
              <p className="cs-kpi__value">{formatPeople(drill.process.activities)}</p>
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
              <p className="cs-kpi__label">Total Roles Mapped</p>
              <p className="cs-kpi__value">42</p>
              <HowKnowLink onClick={() => setHow({ kind: "formula", title: null, participants: 0, cost: 0 })} />
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Total Job Titles Received</p>
              <p className="cs-kpi__value">104</p>
              <HowKnowLink onClick={() => setHow({ kind: "formula", title: null, participants: 0, cost: 0 })} />
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Processes Observed</p>
              <p className="cs-kpi__value">48</p>
              <HowKnowLink onClick={() => setHow({ kind: "formula", title: null, participants: 0, cost: 0 })} />
            </article>
          </div>

          <section className="card cs-chart rd-card">
            <div className="cs-chart__header">
              <div>
                <div className="cs-chart__title-row">
                  <h2>Role x Process Details</h2>
                  <img className="icon" src={iconInfo} width={20} height={20} alt="" />
                </div>
                <p>Where each role&apos;s week actually goes, by process. Hours are the average per person, per week.</p>
              </div>
              <div className="cs-chart__controls">
                <ModeSwitch value={mode} onChange={changeMode} />
                <ExportButton />
              </div>
            </div>

            <div className="rd-split">
              <div className="rd-list">
                <button
                  className="rd-list__head"
                  type="button"
                  onClick={() => setListSort((value) => (value === "desc" ? "asc" : "desc"))}
                >
                  <span>{mode === "role" ? "Role" : "Process"}</span>
                  <span className="rd-list__count">({mode === "role" ? ROLES.length : ALL_PROCESSES.length})</span>
                  <img
                    className={`icon${listSort === "asc" ? " sort-fill--asc" : ""}`}
                    src={iconSortDown}
                    width={10}
                    height={5}
                    alt=""
                  />
                </button>
                <div className="rd-list__body">
                  {mode === "role"
                    ? sortedRoles.slice(0, listVisible).map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          className={`rd-list__item${role.id === selectedRole.id ? " rd-list__item--active" : ""}`}
                          onClick={() => {
                            setSelectedRoleId(role.id);
                            setDetailVisible(PAGE_SIZE);
                          }}
                        >
                          <span className="rd-list__copy">
                            <span>{role.name}</span>
                            <small>
                              {role.jobTitles} job titles · {formatPeople(role.participants)} participants · {role.allocations.length} processes
                            </small>
                          </span>
                          <span className="rd-list__cost">{formatCost(role.cost)}</span>
                        </button>
                      ))
                    : processSummaries.slice(0, listVisible).map((item) => (
                        <button
                          key={item.process.id}
                          type="button"
                          className={`rd-list__item${item.process.id === selectedProcess.id ? " rd-list__item--active" : ""}`}
                          onClick={() => {
                            setSelectedProcessId(item.process.id);
                            setDetailVisible(PAGE_SIZE);
                          }}
                        >
                          <span className="rd-list__copy">
                            <span>{item.process.name}</span>
                            <small>
                              {item.roles} roles · {formatPeople(item.participants)} participants
                            </small>
                          </span>
                          <span className="rd-list__cost">{formatCost(item.cost)}</span>
                        </button>
                      ))}
                  <ShowMore
                    visible={listVisible}
                    total={mode === "role" ? ROLES.length : ALL_PROCESSES.length}
                    onMore={() =>
                      setListVisible((count) =>
                        Math.min(count + PAGE_SIZE, mode === "role" ? ROLES.length : ALL_PROCESSES.length),
                      )
                    }
                    onLess={() => setListVisible(PAGE_SIZE)}
                  />
                </div>
              </div>

              <div className="rd-detail">
                {mode === "role" ? (
                  <>
                    <div className="rd-detail__head">
                      <h3>{selectedRole.name}</h3>
                      <p>
                        {selectedRole.jobTitles} job titles · {formatPeople(selectedRole.participants)} participants · {selectedRole.allocations.length} processes · {formatCost(selectedRole.cost)} annual cost
                      </p>
                    </div>
                    <div className="rd-table">
                      <div className="rd-table__head">
                        <div>Process</div>
                        <SortHeader label="Participants" sortKey="participants" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} />
                        <div />
                        <SortHeader label="Avg hrs/wk" sortKey="hrs" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} />
                        <SortHeader label="Annual Cost" sortKey="cost" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} info />
                        <span />
                      </div>
                      {roleAllocations.map((row) => (
                        <button
                          key={row.processId}
                          className="rd-table__row"
                          type="button"
                          onClick={() => openDrill(selectedRole, row.process, row, "role")}
                        >
                          <span className="rd-table__name">{row.process.name}</span>
                          <span>{formatPeople(row.participants)}</span>
                          <span className="pv-bar">
                            <span style={{ width: `${(row.hrs / maxHrs) * 100}%` }} />
                          </span>
                          <span>{formatHrs(row.hrs)}</span>
                          <span className="pv-row__cost">
                            {formatCost(row.cost)}
                            <span
                              className="pv-row__info"
                              role="button"
                              tabIndex={0}
                              aria-label={`How ${row.process.name} annual cost is calculated`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setHow({ kind: "row", title: row.process.name, participants: row.participants, cost: row.cost });
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setHow({ kind: "row", title: row.process.name, participants: row.participants, cost: row.cost });
                                }
                              }}
                            >
                              <img className="icon" src={iconInfo16} width={16} height={16} alt="" />
                            </span>
                          </span>
                          <img className="icon" src={iconChevronRight} width={20} height={20} alt="" />
                        </button>
                      ))}
                    </div>
                    {roleShares.length ? (
                      <div className="rd-shares">
                        <p>Shares ≥2 processes with {roleShares.length} other roles</p>
                        <div className="rd-pills">
                          {roleShares.map((share) => (
                            <button
                              key={share.id}
                              className="rd-pill"
                              type="button"
                              onClick={() => setSelectedRoleId(share.id)}
                            >
                              <span>{share.name}</span>
                              <strong>{share.count}</strong>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="rd-detail__head">
                      <h3>{selectedProcess.name}</h3>
                      <p>
                        {processRoles.length} roles · {formatPeople(selectedProcess.participants)} participants · {formatCost(selectedProcess.cost > 8 ? 1.2 : selectedProcess.cost)} annual cost
                      </p>
                    </div>
                    <div className="rd-table">
                      <div className="rd-table__head">
                        <div>Role</div>
                        <SortHeader label="Participants" sortKey="participants" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} />
                        <div />
                        <SortHeader label="Avg hrs/wk" sortKey="hrs" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} />
                        <SortHeader label="Annual Cost" sortKey="cost" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} info />
                        <span />
                      </div>
                      {processRoles.slice(0, detailVisible).map((row) => (
                        <button
                          key={row.role.id}
                          className="rd-table__row rd-table__row--role"
                          type="button"
                          onClick={() => openDrill(row.role, selectedProcess, row, "process")}
                        >
                          <span className="rd-table__name rd-table__name--stack">
                            <span>{row.role.name}</span>
                            <small>{row.role.jobTitles} job titles</small>
                          </span>
                          <span>{formatPeople(row.participants)}</span>
                          <span className="pv-bar">
                            <span style={{ width: `${(row.hrs / maxHrs) * 100}%` }} />
                          </span>
                          <span>{formatHrs(row.hrs)}</span>
                          <span className="pv-row__cost">
                            {formatCost(row.cost)}
                            <span
                              className="pv-row__info"
                              role="button"
                              tabIndex={0}
                              aria-label={`How ${row.role.name} annual cost is calculated`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setHow({ kind: "row", title: row.role.name, participants: row.participants, cost: row.cost });
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setHow({ kind: "row", title: row.role.name, participants: row.participants, cost: row.cost });
                                }
                              }}
                            >
                              <img className="icon" src={iconInfo16} width={16} height={16} alt="" />
                            </span>
                          </span>
                          <img className="icon" src={iconChevronRight} width={20} height={20} alt="" />
                        </button>
                      ))}
                      <ShowMore
                        visible={detailVisible}
                        total={processRoles.length}
                        onMore={() => setDetailVisible((count) => Math.min(count + PAGE_SIZE, processRoles.length))}
                        onLess={() => setDetailVisible(PAGE_SIZE)}
                      />
                    </div>
                    {processShares.length ? (
                      <div className="rd-shares">
                        <p>Shares ≥2 roles with {processShares.length} other process</p>
                        <div className="rd-pills">
                          {processShares.map((share) => (
                            <button
                              key={share.id}
                              className="rd-pill"
                              type="button"
                              onClick={() => setSelectedProcessId(share.id)}
                            >
                              <span>{share.name}</span>
                              <strong>{share.count}</strong>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </section>
        </>
      )}
      {how ? (
        <>
          <button className="how-panel__backdrop" type="button" aria-label="Dismiss how we know" onClick={closeHow} />
          <HowPanel kind={how.kind} title={how.title} participants={how.participants} cost={how.cost} onClose={closeHow} />
        </>
      ) : null}
    </div>
  );
}
