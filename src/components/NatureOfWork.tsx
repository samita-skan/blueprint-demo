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
import iconNowFilter from "../assets/icons/icon-now-filter.svg";
import {
  HIERARCHY_LEVELS,
  deepestHierarchyLevel,
  isHierarchyCrumbReached,
  toggleHierarchyExpand,
} from "../hierarchy";
import dotExecution from "../assets/icons/dot-execution.svg";
import dotComprehension from "../assets/icons/dot-comprehension.svg";
import dotCreation from "../assets/icons/dot-creation.svg";
import dotDecision from "../assets/icons/dot-decision.svg";
import dotCommunication from "../assets/icons/dot-communication.svg";

const PAGE_SIZE = 10;
const NESTED_PAGE_SIZE = 5;
const TOTAL_PARTICIPANTS = 9414;

type Mode = "Participant" | "Process" | "Application";
type SortKey = "participants" | "hrs" | "cost" | "freq";
type SortDir = "asc" | "desc";
type SortState = { key: SortKey; dir: SortDir };
type HowKind = "formula" | "meanings";
type TreeLevel = "process" | "subprocess" | "task" | "activity";
type NowType = "execution" | "comprehension" | "creation" | "decision" | "communication";

type NowSeg = { key: NowType; flex: number; hrs: number; pct: number };
type ListRow = {
  id: string;
  name: string;
  participants: number;
  hrs: number;
  cost: number;
  unit?: string;
  expandable?: boolean;
  children?: ListRow[];
};

type TreeNode = {
  id: string;
  name: string;
  level: TreeLevel;
  childCount: number;
  application: string;
  apps?: string[];
  participants: string;
  hrs: string;
  freq: string;
  cost: string;
  share?: string;
  nowType?: NowType;
  subtype?: string;
  rationale?: string;
  children?: TreeNode[];
};

const NOW_META: Record<NowType, { label: string; color: string; dot: string; meaning: string }> = {
  execution: {
    label: "Execution",
    color: "var(--now-execution)",
    dot: dotExecution,
    meaning: "Structured, repeatable work in systems of record — data entry, status updates, and transfers.",
  },
  comprehension: {
    label: "Comprehension",
    color: "var(--now-comprehension)",
    dot: dotComprehension,
    meaning: "Reading, reviewing, and absorbing information to understand what to do next.",
  },
  creation: {
    label: "Creation",
    color: "var(--now-creation)",
    dot: dotCreation,
    meaning: "Producing new artifacts — documents, designs, analysis, or structured output.",
  },
  decision: {
    label: "Decision",
    color: "var(--now-decision)",
    dot: dotDecision,
    meaning: "Evaluating options, approving, prioritizing, or exercising judgment.",
  },
  communication: {
    label: "Communication",
    color: "var(--now-communication)",
    dot: dotCommunication,
    meaning: "Meetings, messages, and coordination with other people.",
  },
};

const NOW_ORDER: NowType[] = ["execution", "comprehension", "creation", "decision", "communication"];
const BREAKDOWN: NowSeg[] = [
  { key: "execution", flex: 39, hrs: 5.5, pct: 39 },
  { key: "comprehension", flex: 19, hrs: 2.2, pct: 19 },
  { key: "creation", flex: 19, hrs: 2.2, pct: 19 },
  { key: "decision", flex: 19, hrs: 2.2, pct: 19 },
  { key: "communication", flex: 10, hrs: 1.8, pct: 10 },
];

const PARTICIPANT_VIEWS = [
  "Business Unit",
  "Function",
  "Job Title",
  "Segment",
  "Territory",
  "Region",
  "Country",
] as const;
const PROCESS_VIEWS = ["Enterprise", "Business Unit"] as const;
const APP_VIEWS = ["Application Category", "Application Title"] as const;

function segs(values: number[]): NowSeg[] {
  return NOW_ORDER.map((key, index) => ({
    key,
    flex: values[index],
    hrs: Number(((values[index] / 100) * 14).toFixed(1)),
    pct: values[index],
  }));
}

const DEFAULT_SEGS = segs([39, 19, 19, 19, 10]);

const PARTICIPANT_ROWS: Record<string, ListRow[]> = {
  "Business Unit": [
    { id: "personal", name: "Personal Lines", participants: 1300, hrs: 45, cost: 61, unit: "Personal Lines" },
    { id: "retail", name: "Retail Services", participants: 900, hrs: 40, cost: 42, unit: "Retail Services" },
    { id: "wholesale", name: "Wholesale Distribution", participants: 600, hrs: 39, cost: 38, unit: "Wholesale Distribution" },
    { id: "finance", name: "Finance & Actuarial", participants: 850, hrs: 39, cost: 38, unit: "Finance & Actuarial" },
    { id: "ecom", name: "E-commerce Solutions", participants: 450, hrs: 38, cost: 38, unit: "E-commerce Solutions" },
  ],
  Function: [
    { id: "uw", name: "Underwriting", participants: 1300, hrs: 45, cost: 61 },
    { id: "claims", name: "Claims", participants: 900, hrs: 40, cost: 42 },
    { id: "cs", name: "Customer Service", participants: 600, hrs: 39, cost: 38 },
    { id: "act", name: "Actuarial", participants: 850, hrs: 39, cost: 38 },
    { id: "it", name: "IT Operations", participants: 450, hrs: 38, cost: 38 },
  ],
  "Job Title": [
    { id: "adjuster", name: "Claims Adjuster", participants: 1300, hrs: 45, cost: 61 },
    { id: "underwriter", name: "Underwriter", participants: 900, hrs: 40, cost: 42 },
    { id: "csr", name: "Customer Service Rep", participants: 600, hrs: 39, cost: 38 },
    { id: "actuary", name: "Actuary", participants: 850, hrs: 39, cost: 38 },
    { id: "lead", name: "Team Lead", participants: 450, hrs: 38, cost: 38 },
  ],
};

const PROCESS_ROWS: ListRow[] = [
  { id: "engagement", name: "Engagement Delivery", participants: 1300, hrs: 45, cost: 61, unit: "Personal Lines" },
  { id: "pmo", name: "Project Management & PMO", participants: 900, hrs: 40, cost: 42, unit: "Personal Lines" },
  { id: "invoice", name: "Invoice-to-Pay", participants: 1050, hrs: 39, cost: 38, unit: "Personal Lines" },
  { id: "resource", name: "Resource Deployment & Staffing", participants: 850, hrs: 39, cost: 38, unit: "Personal Lines" },
  { id: "otc", name: "Order-to-Cash & Collections", participants: 450, hrs: 38, cost: 38, unit: "Personal Lines" },
  { id: "intake", name: "Intake & Triage", participants: 620, hrs: 37, cost: 29, unit: "Personal Lines" },
  { id: "endorsement", name: "Policy Endorsements", participants: 580, hrs: 36, cost: 24, unit: "Personal Lines" },
  { id: "renewal", name: "Renewals & Retention", participants: 540, hrs: 35, cost: 22, unit: "Personal Lines" },
  { id: "fnol", name: "FNOL & First Notice", participants: 510, hrs: 34, cost: 19, unit: "Personal Lines" },
  { id: "billing", name: "Billing Exceptions", participants: 470, hrs: 33, cost: 17, unit: "Personal Lines" },
  { id: "producer", name: "Producer Support", participants: 430, hrs: 32, cost: 14, unit: "Personal Lines" },
  { id: "lnd", name: "Learning & Development Ops", participants: 720, hrs: 37, cost: 31, unit: "Retail Services" },
  { id: "r2r", name: "Record-to-Report & Reconciliation", participants: 610, hrs: 36, cost: 28, unit: "Retail Services" },
  { id: "hrsc", name: "HR Service Center", participants: 540, hrs: 36, cost: 24, unit: "Retail Services" },
  { id: "knowledge", name: "Knowledge & Delivery Excellence", participants: 480, hrs: 35, cost: 22, unit: "Retail Services" },
  { id: "tne", name: "Travel & Expense", participants: 350, hrs: 34, cost: 18, unit: "Retail Services" },
  { id: "claims", name: "Claims Adjudication", participants: 720, hrs: 41, cost: 27, unit: "Wholesale Distribution" },
  { id: "policy", name: "Policy Administration", participants: 610, hrs: 40, cost: 23, unit: "Wholesale Distribution" },
  { id: "vendor", name: "Vendor Management", participants: 540, hrs: 38, cost: 19, unit: "Finance & Actuarial" },
  { id: "support", name: "Customer Support Ops", participants: 980, hrs: 37, cost: 21, unit: "Finance & Actuarial" },
  { id: "underwriting", name: "Underwriting Operations", participants: 430, hrs: 39, cost: 17, unit: "E-commerce Solutions" },
];

const APP_CHILDREN: ListRow[] = [
  { id: "outlook", name: "Outlook", participants: 1300, hrs: 45, cost: 61 },
  { id: "teams-meet", name: "MS Teams · meetings", participants: 900, hrs: 40, cost: 42 },
  { id: "guidewire", name: "Guidewire ClaimCenter", participants: 600, hrs: 39, cost: 38 },
  { id: "duck", name: "Duck Creek Policy", participants: 850, hrs: 38, cost: 38 },
  { id: "sumo", name: "Sumo", participants: 850, hrs: 37, cost: 38 },
  { id: "salesforce", name: "Salesforce", participants: 900, hrs: 36, cost: 28 },
  { id: "policycenter", name: "Guidewire PolicyCenter", participants: 900, hrs: 35, cost: 24 },
  { id: "chrome", name: "Chrome · research", participants: 900, hrs: 34, cost: 22 },
  { id: "teams", name: "MS Teams", participants: 900, hrs: 38, cost: 21 },
  { id: "word", name: "Word", participants: 900, hrs: 33, cost: 18 },
  { id: "excel", name: "Excel", participants: 1120, hrs: 36, cost: 26 },
  { id: "sharepoint", name: "SharePoint", participants: 920, hrs: 32, cost: 16 },
];

const APP_CATEGORIES: ListRow[] = [
  { id: "meeting", name: "Meeting and Collaboration (14)", participants: 1300, hrs: 45, cost: 61, expandable: true, children: APP_CHILDREN },
  { id: "lob", name: "Core LOB / Insurance Systems (28)", participants: 1000, hrs: 40, cost: 42, expandable: true, children: APP_CHILDREN },
  { id: "email", name: "Email & Messaging (28)", participants: 950, hrs: 39, cost: 38, expandable: true, children: APP_CHILDREN },
  { id: "docs", name: "Productivity & Documents (28)", participants: 946, hrs: 38, cost: 38, expandable: true, children: APP_CHILDREN },
  { id: "crm", name: "CRM & Sales Systems (28)", participants: 879, hrs: 37, cost: 31, expandable: true, children: APP_CHILDREN },
  { id: "research", name: "Research & External (28)", participants: 800, hrs: 36, cost: 28, expandable: true, children: APP_CHILDREN },
  { id: "knowledge", name: "Knowledge Management (28)", participants: 800, hrs: 35, cost: 24, expandable: true, children: APP_CHILDREN },
  { id: "browser", name: "Browser & Utilities (28)", participants: 800, hrs: 34, cost: 22, expandable: true, children: APP_CHILDREN },
  { id: "ops", name: "Operations Support (28)", participants: 800, hrs: 33, cost: 18, expandable: true, children: APP_CHILDREN },
  { id: "custom", name: "Custom (28)", participants: 800, hrs: 32, cost: 16, expandable: true, children: APP_CHILDREN },
  { id: "finance", name: "Finance & Accounting (12)", participants: 720, hrs: 31, cost: 14, expandable: true, children: APP_CHILDREN },
];

const ROW_SEGS: Record<string, NowSeg[]> = {
  personal: segs([36, 18, 21, 15, 10]),
  engagement: segs([36, 18, 21, 15, 10]),
  outlook: segs([34, 20, 18, 16, 12]),
  "teams-meet": segs([28, 16, 21, 18, 17]),
};

const DRILL_BREAKDOWN: NowSeg[] = [
  { key: "execution", flex: 28, hrs: 5.5, pct: 28 },
  { key: "comprehension", flex: 11, hrs: 2.2, pct: 11 },
  { key: "creation", flex: 11, hrs: 2.2, pct: 11 },
  { key: "decision", flex: 11, hrs: 2.2, pct: 11 },
  { key: "communication", flex: 39, hrs: 7.8, pct: 39 },
];

function drillSegs(id: string): NowSeg[] {
  if (id === "personal" || id === "engagement" || id === "meeting" || id === "outlook") return DRILL_BREAKDOWN;
  return ROW_SEGS[id] ?? BREAKDOWN;
}

function sharePct(row: ListRow) {
  if (row.id === "personal") return 26;
  return Math.round((row.participants / TOTAL_PARTICIPANTS) * 100);
}

function rowSegs(id: string): NowSeg[] {
  return ROW_SEGS[id] ?? DEFAULT_SEGS;
}

function formatPeople(value: number) {
  return value.toLocaleString();
}

function formatCost(value: number) {
  return `$${value.toFixed(1)}M`;
}

function node(partial: TreeNode): TreeNode {
  return partial;
}

const ACTIVITIES: {
  name: string;
  app: string;
  apps?: string[];
  type: NowType;
  subtype: string;
  rationale: string;
  participants: number;
  hrs: string;
  freq: string;
  cost: string;
  share?: string;
}[] = [
  {
    name: "Open source record",
    app: "Loan Origination System (LOS)",
    apps: ["MeridianLink", "Calyx Point", "LoanSphere"],
    type: "execution",
    subtype: "Data Capture & Transfer",
    rationale:
      "Moving or entering information from one source into a structured target by following a predefined mapping. The worker reads from a source and writes to a destination — no judgment about what to capture or how to transform it.",
    participants: 620,
    hrs: "12.0",
    freq: "12.0",
    cost: "$1.5M",
    share: "40%",
  },
  {
    name: "Validate required fields",
    app: "MeridianLink",
    type: "comprehension",
    subtype: "Record Review",
    rationale: "Reading the case to confirm required fields and missing evidence before acting.",
    participants: 540,
    hrs: "4.2",
    freq: "6.0",
    cost: "$0.9M",
  },
  {
    name: "Scope Documentation",
    app: "Word",
    type: "creation",
    subtype: "Artifact Production",
    rationale: "Drafting a structured record of agreed scope, owners, and next steps.",
    participants: 410,
    hrs: "3.1",
    freq: "3.2",
    cost: "$0.7M",
  },
  {
    name: "Approve exception",
    app: "Guidewire ClaimCenter",
    type: "decision",
    subtype: "Exception Judgment",
    rationale: "Choosing whether an exception proceeds based on policy, evidence, and risk.",
    participants: 280,
    hrs: "2.4",
    freq: "2.1",
    cost: "$0.5M",
  },
  {
    name: "Kickoff Facilitation",
    app: "MS Teams · meetings",
    type: "communication",
    subtype: "Meeting Coordination",
    rationale: "Scheduling and running working sessions so stakeholders share the same starting point.",
    participants: 180,
    hrs: "1.2",
    freq: "2.4",
    cost: "$1.1M",
  },
  {
    name: "Stakeholder Alignment",
    app: "Outlook",
    type: "communication",
    subtype: "Status Messaging",
    rationale: "Confirming decisions and open questions with the people who own downstream work.",
    participants: 172,
    hrs: "1.1",
    freq: "2.3",
    cost: "$0.4M",
  },
  {
    name: "Update status and notes",
    app: "Salesforce",
    type: "execution",
    subtype: "Data Capture & Transfer",
    rationale: "Writing the observed outcome back into the system of record.",
    participants: 164,
    hrs: "1.0",
    freq: "2.2",
    cost: "$0.4M",
  },
  {
    name: "Notify downstream owner",
    app: "Outlook",
    type: "communication",
    subtype: "Handoff Messaging",
    rationale: "Telling the next owner that work is ready and what they need to do.",
    participants: 156,
    hrs: "0.9",
    freq: "2.1",
    cost: "$0.3M",
  },
  {
    name: "Compile evidence pack",
    app: "SharePoint",
    type: "creation",
    subtype: "Artifact Production",
    rationale: "Assembling supporting files so the next reviewer has a complete record.",
    participants: 148,
    hrs: "0.9",
    freq: "1.9",
    cost: "$0.3M",
  },
  {
    name: "Read prior case notes",
    app: "Guidewire PolicyCenter",
    type: "comprehension",
    subtype: "Record Review",
    rationale: "Absorbing earlier decisions before taking the next action.",
    participants: 140,
    hrs: "0.8",
    freq: "1.8",
    cost: "$0.3M",
  },
  {
    name: "Route work to queue",
    app: "Salesforce",
    type: "execution",
    subtype: "Data Capture & Transfer",
    rationale: "Placing the case in the correct queue so work continues without re-entry.",
    participants: 132,
    hrs: "0.8",
    freq: "1.7",
    cost: "$0.2M",
  },
  {
    name: "Confirm coverage path",
    app: "Duck Creek Policy",
    type: "decision",
    subtype: "Exception Judgment",
    rationale: "Choosing the coverage path based on policy language and the facts on file.",
    participants: 124,
    hrs: "0.7",
    freq: "1.6",
    cost: "$0.2M",
  },
];

function makeActivities(prefix: string): TreeNode[] {
  return ACTIVITIES.map((item, index) =>
    node({
      id: `${prefix}-a${index}`,
      name: item.name,
      level: "activity",
      childCount: 0,
      application: item.app,
      apps: item.apps,
      participants: String(item.participants),
      hrs: item.hrs,
      freq: item.freq,
      cost: item.cost,
      share: item.share,
      nowType: item.type,
      subtype: item.subtype,
      rationale: item.rationale,
    }),
  );
}

function makeTasks(prefix: string): TreeNode[] {
  const names = [
    ["Client Onboarding Setup", 1300],
    ["Client Needs Assessment", 1500],
    ["Solution Design Workshop", 1800],
    ["Stakeholder Alignment", 1240],
    ["Documentation and Handoff", 900],
    ["Quality Checkpoint", 820],
    ["Handoff Review", 760],
    ["Exception Handling", 640],
    ["Status Update Cycle", 580],
    ["Close and Archive", 510],
    ["Follow-up Outreach", 460],
    ["Final Confirmation", 390],
  ] as const;
  return names.map(([name, count], index) =>
    node({
      id: `${prefix}-t${index}`,
      name,
      level: "task",
      childCount: count,
      application: "",
      participants: String(520 - index * 28),
      hrs: (2.1 - index * 0.1).toFixed(1),
      freq: (2.8 - index * 0.1).toFixed(1),
      cost: `$${(2.4 - index * 0.15).toFixed(1)}M`,
      children: makeActivities(`${prefix}-t${index}`),
    }),
  );
}

function hierarchyFor(row: ListRow): TreeNode {
  const subprocesses = [
    ["Client Onboarding", 270],
    ["Delivery Execution", 470],
    ["Quality Assurance", 350],
    ["Customer Support", 420],
    ["Project Closeout", 470],
    ["Issue Resolution", 310],
    ["Knowledge Capture", 280],
    ["Vendor Coordination", 260],
    ["Reporting Pack", 240],
    ["Compliance Review", 220],
    ["Handover Prep", 200],
    ["Closeout Audit", 180],
  ] as const;
  return node({
    id: row.id,
    name: row.name,
    level: "process",
    childCount: 140,
    application: "",
    participants: formatPeople(row.participants),
    hrs: String(row.hrs),
    freq: "3.2",
    cost: formatCost(row.id === "engagement" ? 9 : Math.max(4, row.cost * 0.15)),
    share: "60%",
    children: subprocesses.map(([name, count], index) =>
      node({
        id: `${row.id}-s${index}`,
        name,
        level: "subprocess",
        childCount: count,
        application: "",
        participants: formatPeople(Math.max(180, Math.round(row.participants * (0.7 - index * 0.08)))),
        hrs: (2.2 - index * 0.1).toFixed(1),
        freq: (3.0 - index * 0.12).toFixed(1),
        cost: formatCost(Math.max(4, row.cost * (0.38 - index * 0.05))),
        share: `${Math.max(8, 41 - index * 5)}%`,
        children: makeTasks(`${row.id}-s${index}`),
      }),
    ),
  });
}

function sortRows(rows: ListRow[], sort: SortState) {
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.key === "freq") return (a.hrs - b.hrs) * sign;
    const primary = (a[sort.key] - b[sort.key]) * sign;
    if (primary !== 0) return primary;
    return (a.hrs - b.hrs) * sign;
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

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  info,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey, dir?: SortDir) => void;
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

function NowBar({ name, segments, tall }: { name: string; segments: NowSeg[]; tall?: boolean }) {
  return (
    <div className={`usage-bar${tall ? " now-bar" : ""}`} role="img" aria-label={`${name} nature of work distribution`}>
      {segments.map((segment, index) => (
        <div
          key={segment.key}
          className={`usage-bar__seg${index === 0 ? " usage-bar__seg--first" : ""}${
            index === segments.length - 1 ? " usage-bar__seg--last" : ""
          }`}
          style={{ flexGrow: segment.flex, background: NOW_META[segment.key].color }}
        >
          <span className="usage-tip">
            <strong>{name}</strong>
            <span className="usage-tip__row">
              <span className="usage-tip__dot" style={{ background: NOW_META[segment.key].color }} />
              {NOW_META[segment.key].label} : {segment.hrs} hrs/wk ({segment.pct}%)
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function HowKnowLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="pv-know" type="button" onClick={onClick}>
      {label}
      <img className="icon" src={iconChevronDownBlue} width={20} height={20} alt="" />
    </button>
  );
}

function HowPanel({ kind, onClose, onViewMath }: { kind: HowKind; onClose: () => void; onViewMath?: () => void }) {
  return (
    <aside className="how-panel" aria-label={kind === "meanings" ? "What Nature of Work means" : "How Annual Cost is calculated"}>
      <div className="how-panel__head">
        <img className="icon" src={iconSparkle} width={24} height={24} alt="" />
        <p>{kind === "meanings" ? "What Nature of Work means" : "How Annual Cost is calculated"}</p>
        <button className="how-panel__close" type="button" aria-label="Close" onClick={onClose}>
          <img className="icon" src={iconClose} width={24} height={24} alt="" />
        </button>
      </div>
      {kind === "meanings" ? (
        <>
          <p className="how-panel__body">
            Every observed desktop activity is classified into one of five types of work. Bars in this view show how a
            typical week is split across those types.
          </p>
          <div className="now-meanings">
            {NOW_ORDER.map((key) => (
              <div className="now-meanings__row" key={key}>
                <img className="icon" src={NOW_META[key].dot} width={14} height={14} alt="" />
                <div>
                  <strong>{NOW_META[key].label}</strong>
                  <p>{NOW_META[key].meaning}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="how-panel__body">
            Every cost in this table is built bottom-up from directly observed desktop activity. We take the hours we
            observed each person spend, annualise them from the 14 day window, and multiply by their fully-loaded salary.
          </p>
          <div className="how-panel__formula">
            <p>Participants &nbsp;x&nbsp; Avg hrs/wk &nbsp;x&nbsp; 52 Weeks &nbsp;x&nbsp; Avg Salary</p>
            <p>= Annual Cost</p>
          </div>
          <p className="how-panel__note">Observed over a 14-day window and extrapolated for the whole year.</p>
        </>
      )}
      <div className="how-alert">
        <img className="icon" src={iconInfoFilled} width={18} height={18} alt="" />
        <p>Every hour comes from directly observed desktop activity.</p>
      </div>
      {kind === "formula" && onViewMath ? (
        <p className="now-how-foot">
          To see exactly how each value was calculated, use this link
          <button type="button" onClick={onViewMath}>
            View the math →
          </button>
        </p>
      ) : null}
    </aside>
  );
}

function BreakdownCard({
  onMeanings,
  segments = BREAKDOWN,
  label = "Enterprise",
}: {
  onMeanings: () => void;
  segments?: NowSeg[];
  label?: string;
}) {
  return (
    <section className="card cs-chart now-breakdown">
      <div className="cs-chart__title-row">
        <h2>Nature of Work Breakdown</h2>
        <img className="icon" src={iconInfo} width={20} height={20} alt="" />
      </div>
      <p className="now-breakdown__kicker">How time is spend today</p>
      <NowBar name={label} segments={segments} tall />
      <div className="now-breakdown__foot">
        <div className="cs-legend">
          {segments.map((segment) => (
            <span className="cs-legend__item" key={segment.key}>
              <img className="icon" src={NOW_META[segment.key].dot} width={14} height={14} alt="" />
              {NOW_META[segment.key].label} {segment.hrs} hrs/wk ({segment.pct}%)
            </span>
          ))}
        </div>
        <HowKnowLink label="What Nature of Work means" onClick={onMeanings} />
      </div>
    </section>
  );
}

function MiniLegend() {
  return (
    <div className="cs-legend now-mini-legend">
      {NOW_ORDER.map((key) => (
        <span className="cs-legend__item" key={key}>
          <img className="icon" src={NOW_META[key].dot} width={14} height={14} alt="" />
          {NOW_META[key].label}
        </span>
      ))}
    </div>
  );
}

function levelIcon(level: TreeLevel) {
  if (level === "process") return iconProcess;
  if (level === "subprocess") return iconSubprocess;
  if (level === "task") return iconTask;
  return iconActivity;
}

export function NatureOfWork() {
  const [mode, setMode] = useState<Mode>("Participant");
  const [viewBy, setViewBy] = useState("Business Unit");
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [childVisible, setChildVisible] = useState(NESTED_PAGE_SIZE);
  const [groupVisible, setGroupVisible] = useState<Record<string, number>>({});
  const [expandedKey, setExpandedKey] = useState("meeting");
  const [sort, setSort] = useState<SortState>({ key: "hrs", dir: "desc" });
  const [selected, setSelected] = useState<ListRow | null>(null);
  const [treeExpanded, setTreeExpanded] = useState<string[]>([]);
  const [processVisible, setProcessVisible] = useState(PAGE_SIZE);
  const [subprocessVisible, setSubprocessVisible] = useState(NESTED_PAGE_SIZE);
  const [taskVisible, setTaskVisible] = useState(NESTED_PAGE_SIZE);
  const [activityVisible, setActivityVisible] = useState(NESTED_PAGE_SIZE);
  const [nowFilter, setNowFilter] = useState<NowType | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [gridSort, setGridSort] = useState<SortState>({ key: "cost", dir: "desc" });
  const [how, setHow] = useState<HowKind | null>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const viewOptions = mode === "Participant" ? PARTICIPANT_VIEWS : mode === "Process" ? PROCESS_VIEWS : APP_VIEWS;
  const drillRoots = useMemo(() => {
    if (!selected) return [];
    if (mode === "Participant") {
      const unitRows = PROCESS_ROWS.filter((row) => row.unit === selected.name);
      return (unitRows.length ? unitRows : [selected]).map(hierarchyFor);
    }
    return [hierarchyFor(selected)];
  }, [selected, mode]);

  const listRows = useMemo(() => {
    if (mode === "Process") return sortRows(PROCESS_ROWS, sort);
    if (mode === "Application") {
      return viewBy === "Application Title" ? sortRows(APP_CHILDREN, sort) : sortRows(APP_CATEGORIES, sort);
    }
    return sortRows(PARTICIPANT_ROWS[viewBy] ?? PARTICIPANT_ROWS["Business Unit"], sort);
  }, [mode, viewBy, sort]);

  const groups = useMemo(() => {
    const map = new Map<string, ListRow[]>();
    for (const row of listRows) {
      const name = row.unit ?? "Other";
      const list = map.get(name) ?? [];
      list.push(row);
      map.set(name, list);
    }
    return [...map.entries()].map(([name, rows]) => ({
      name,
      rows,
      count: rows.length,
      cost: rows.reduce((sum, row) => sum + row.cost, 0),
    }));
  }, [listRows]);

  const grouped = mode === "Process" && viewBy === "Business Unit";
  const nameHeader = mode === "Participant" ? viewBy : mode === "Process" ? "Process" : viewBy === "Application Category" ? "Application Categories" : "Application";

  const deepest = deepestHierarchyLevel(treeExpanded);

  function nextGridSort(key: SortKey, dir?: SortDir): SortState {
    if (dir) return { key, dir };
    if (gridSort.key === key) return { key, dir: gridSort.dir === "desc" ? "asc" : "desc" };
    return { key, dir: "desc" };
  }

  function metricValue(node: TreeNode, key: SortKey) {
    const raw = key === "participants" ? node.participants : key === "hrs" ? node.hrs : key === "freq" ? node.freq : node.cost;
    return parseFloat(String(raw).replace(/[^0-9.]/g, "")) || 0;
  }

  function sortedNodes(nodes: TreeNode[]) {
    const sign = gridSort.dir === "asc" ? 1 : -1;
    return [...nodes].sort((a, b) => (metricValue(a, gridSort.key) - metricValue(b, gridSort.key)) * sign);
  }

  function nextSort(key: SortKey, dir?: SortDir): SortState {
    if (dir) return { key, dir };
    if (sort.key === key) return { key, dir: sort.dir === "desc" ? "asc" : "desc" };
    return { key, dir: "desc" };
  }

  function changeMode(next: Mode) {
    setMode(next);
    setViewBy(next === "Participant" ? "Business Unit" : next === "Process" ? "Enterprise" : "Application Category");
    setVisible(PAGE_SIZE);
    setChildVisible(NESTED_PAGE_SIZE);
    setGroupVisible({});
    setExpandedKey("meeting");
    setSelected(null);
    setHow(null);
  }

  function openRow(row: ListRow) {
    const first = mode === "Participant" ? (PROCESS_ROWS.find((item) => item.unit === row.name) ?? row) : row;
    setSelected(row);
    setTreeExpanded([first.id]);
    setProcessVisible(PAGE_SIZE);
    setSubprocessVisible(NESTED_PAGE_SIZE);
    setTaskVisible(5);
    setActivityVisible(5);
    setHow(null);
  }

  function toggleTree(id: string) {
    setTreeExpanded((current) => toggleHierarchyExpand(current, id));
    setTaskVisible(5);
    setActivityVisible(5);
  }

  function renderTree(node: TreeNode, depth = 0): ReactNode {
    const isOpen = treeExpanded.includes(node.id);
    const children = node.children ?? [];
    const canExpand = children.length > 0;
    const shownChildren =
      node.level === "process" && isOpen
        ? sortedNodes(children).slice(0, subprocessVisible)
        : node.level === "subprocess" && isOpen
          ? sortedNodes(children).slice(0, taskVisible)
          : node.level === "task" && isOpen
            ? sortedNodes(children.filter((child) => nowFilter === "all" || child.nowType === nowFilter)).slice(0, activityVisible)
            : isOpen
              ? sortedNodes(children)
              : [];
    const costLabel = node.share ? `${node.cost} (${node.share})` : node.cost;
    return (
      <div key={node.id}>
        <button
          className={`now-grid__row now-grid__row--${node.level}`}
          type="button"
          onClick={() => (canExpand ? toggleTree(node.id) : undefined)}
        >
          <span className="now-grid__group" style={{ paddingLeft: `${depth * 36}px` }}>
            {canExpand ? (
              <img className={`icon now-grid__lead cs-expand${isOpen ? " cs-expand--open" : ""}`} src={iconExpand} width={20} height={20} alt="" />
            ) : (
              <span className="now-grid__lead pv-tree__spacer" />
            )}
            <span className="now-grid__group-cell">
              <img className="icon" src={levelIcon(node.level)} width={20} height={20} alt="" />
              <span className="now-grid__label">
                {node.name}
                {node.childCount ? <span className="now-grid__count">({node.childCount.toLocaleString()})</span> : null}
              </span>
            </span>
          </span>
          <span className="now-grid__cell now-grid__apps">
            {node.application ? <span className="now-app-pill">{node.application}</span> : null}
            {node.apps?.length ? (
              <span className="now-grid__app-extras">
                {node.apps.map((app) => (
                  <span className="now-grid__app-extra" key={app}>
                    · {app}
                  </span>
                ))}
              </span>
            ) : null}
          </span>
          <span className="now-grid__cell">{node.participants}</span>
          <span className="now-grid__cell">{node.hrs}</span>
          <span className="now-grid__cell">{node.freq}</span>
          <span className="now-grid__cell">{costLabel}</span>
          <span className="now-grid__cell now-grid__now">
            {node.nowType ? (
              <span className="now-type">
                <span className={`now-badge now-badge--${node.nowType}`}>{NOW_META[node.nowType].label}</span>
                {node.subtype ? (
                  <span className="now-type__meta">
                    {node.subtype}
                    <img className="icon" src={iconInfo16} width={16} height={16} alt="" />
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
          <span className="now-grid__cell now-grid__rationale">{node.rationale ?? ""}</span>
        </button>
        {shownChildren.map((child) => renderTree(child, depth + 1))}
        {node.level === "process" && isOpen && children.length > NESTED_PAGE_SIZE ? (
          <div className="cs-table__more" style={{ paddingLeft: `${56 + depth * 36}px` }}>
            {subprocessVisible < children.length ? (
              <button className="btn-more" type="button" onClick={() => setSubprocessVisible((count) => Math.min(count + PAGE_SIZE, children.length))}>
                <img className="icon" src={iconAdd} width={16} height={16} alt="" />
                Show 10 more Subprocesses
              </button>
            ) : null}
          </div>
        ) : null}
        {node.level === "subprocess" && isOpen && children.length > NESTED_PAGE_SIZE ? (
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
        {node.level === "task" && isOpen && children.length > NESTED_PAGE_SIZE ? (
          <div className="cs-table__more" style={{ paddingLeft: `${56 + depth * 36}px` }}>
            {activityVisible < children.length ? (
              <button className="btn-more" type="button" onClick={() => setActivityVisible((count) => Math.min(count + PAGE_SIZE, children.length))}>
                <img className="icon" src={iconAdd} width={16} height={16} alt="" />
                Show 10 more Activities
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  function listRow(row: ListRow, child?: boolean) {
    return (
      <div
        key={row.id}
        className={`now-row${child ? " now-row--child" : ""}`}
        role={row.expandable ? undefined : "button"}
        tabIndex={0}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest(".now-row__toggle, .pv-row__info")) return;
          openRow(row);
        }}
        onKeyDown={(event) => {
          if ((event.target as HTMLElement).closest(".now-row__toggle, .pv-row__info")) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openRow(row);
          }
        }}
      >
        <span className="now-row__name">
          {row.expandable ? (
            <button
              className="now-row__toggle"
              type="button"
              aria-label={expandedKey === row.id ? "Collapse" : "Expand"}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setExpandedKey((current) => (current === row.id ? "" : row.id));
                setChildVisible(NESTED_PAGE_SIZE);
              }}
            >
              <img
                className={`icon cs-expand${expandedKey === row.id ? " cs-expand--open" : ""}`}
                src={iconExpand}
                width={20}
                height={20}
                alt=""
              />
            </button>
          ) : null}
          <span className="now-row__label">{row.name}</span>
        </span>
        <span>{formatPeople(row.participants)}</span>
        <NowBar name={row.name} segments={rowSegs(row.id)} />
        <span>{row.hrs}</span>
        <span className="pv-row__cost">
          {formatCost(row.cost)}
          <span
            className="pv-row__info"
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              setHow("formula");
            }}
          >
            <img className="icon" src={iconInfo16} width={16} height={16} alt="" />
          </span>
        </span>
        <img className="icon" src={iconChevronRight} width={20} height={20} alt="" />
      </div>
    );
  }

  const subtitle =
    mode === "Process"
      ? grouped
        ? "Grouped by business unit · Click any row for more details"
        : "Showing all processes · Click any row for more details"
      : mode === "Application"
        ? viewBy === "Application Category"
          ? "Grouped by application category · Click any row for more details"
          : "Showing all applications · Click any row for more details"
        : `Grouped by ${viewBy.toLowerCase()} · Click any row for more details`;

  return (
    <div className="pv now">
      {selected && drillRoots.length ? (
        <>
          <div className="pv-nav">
            <BackButton onClick={() => setSelected(null)}>
              {mode === "Participant" ? `Back to all ${viewBy}s` : mode === "Process" ? "Back to all processes" : "Back to all applications"}
            </BackButton>
            <h2>{selected.name}</h2>
          </div>
          <div className="cs-kpis now-kpis">
            <article className="cs-kpi">
              <p className="cs-kpi__label">Total Participants</p>
              <p className="cs-kpi__value">{formatPeople(selected.participants)}</p>
              <p className="cs-kpi__meta">{sharePct(selected)}% of {formatPeople(TOTAL_PARTICIPANTS)} participants</p>
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Avg Time Spent</p>
              <p className="cs-kpi__value">{selected.hrs} hrs/wk</p>
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Annual Cost</p>
              <p className="cs-kpi__value">${selected.cost.toFixed(0)}M</p>
              <HowKnowLink label="How we know" onClick={() => setHow("formula")} />
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Activities Observed</p>
              <p className="cs-kpi__value">214</p>
            </article>
          </div>
          <BreakdownCard onMeanings={() => setHow("meanings")} segments={drillSegs(selected.id)} label={selected.name} />
          <section className="card cs-chart">
            <div className="cs-chart__header">
              <div className="cs-chart__title-row">
                <h2>Details</h2>
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
            <div className="now-grid">
              <div className="now-grid__head">
                <span className="now-grid__group now-grid__group--head">
                  <span className="now-grid__lead" aria-hidden="true" />
                  <span className="now-grid__group-cell">Group</span>
                </span>
                <span className="now-grid__cell">Application</span>
                <span className="now-grid__cell">
                  <SortHeader label="Participants" sortKey="participants" sort={gridSort} onSort={(key, dir) => setGridSort(nextGridSort(key, dir))} />
                </span>
                <span className="now-grid__cell">
                  <SortHeader label="Avg hrs/wk" sortKey="hrs" sort={gridSort} onSort={(key, dir) => setGridSort(nextGridSort(key, dir))} info />
                </span>
                <span className="now-grid__cell">
                  <SortHeader label="Avg freq/wk" sortKey="freq" sort={gridSort} onSort={(key, dir) => setGridSort(nextGridSort(key, dir))} />
                </span>
                <span className="now-grid__cell">
                  <SortHeader label="Annual Cost" sortKey="cost" sort={gridSort} onSort={(key, dir) => setGridSort(nextGridSort(key, dir))} info />
                </span>
                <span className="now-grid__cell now-grid__filter">
                  Nature of Work
                  <button className="now-filter" type="button" aria-label="Filter nature of work" onClick={() => setFilterOpen((open) => !open)}>
                    <img className="icon" src={iconNowFilter} width={16} height={16} alt="" />
                  </button>
                  {filterOpen ? (
                    <div className="view-by__menu now-filter__menu" role="listbox">
                      <div className="view-by__list">
                        {(["all", ...NOW_ORDER] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={`view-by__item${nowFilter === option ? " view-by__item--active" : ""}`}
                            onClick={() => {
                              setNowFilter(option);
                              setFilterOpen(false);
                            }}
                          >
                            {option === "all" ? "All types" : NOW_META[option].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </span>
                <span className="now-grid__cell">Rationale</span>
              </div>
              {sortedNodes(drillRoots).slice(0, processVisible).map((root) => renderTree(root))}
              {drillRoots.length > PAGE_SIZE ? (
                <div className="cs-table__more">
                  {processVisible < drillRoots.length ? (
                    <button className="btn-more" type="button" onClick={() => setProcessVisible((count) => Math.min(count + PAGE_SIZE, drillRoots.length))}>
                      <img className="icon" src={iconAdd} width={16} height={16} alt="" />
                      Show 10 more Processes
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="cs-kpis now-kpis">
            <article className="cs-kpi">
              <p className="cs-kpi__label">Annual Cost</p>
              <p className="cs-kpi__value">$1.24B</p>
              <HowKnowLink label="How we know" onClick={() => setHow("formula")} />
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Total Participants</p>
              <p className="cs-kpi__value">9,414</p>
              <p className="cs-kpi__meta">100% of 9,414 participants</p>
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Processes observed</p>
              <p className="cs-kpi__value">48</p>
              <HowKnowLink label="How we know" onClick={() => setHow("formula")} />
            </article>
            <article className="cs-kpi">
              <p className="cs-kpi__label">Apps observed</p>
              <p className="cs-kpi__value">214</p>
            </article>
          </div>
          <BreakdownCard onMeanings={() => setHow("meanings")} />
          <section className="card cs-chart">
            <div className="cs-chart__header">
              <div>
                <div className="cs-chart__title-row">
                  <h2>Nature of Work</h2>
                  <img className="icon" src={iconInfo} width={20} height={20} alt="" />
                </div>
                <p>{subtitle}</p>
              </div>
              <div className="cs-chart__controls">
                <div className="rd-switch now-switch" role="tablist" aria-label="Nature of Work dimension">
                  {(["Participant", "Process", "Application"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="tab"
                      aria-selected={mode === item}
                      className={`rd-switch__item${mode === item ? " rd-switch__item--active" : ""}`}
                      onClick={() => changeMode(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="cs-chart__divider" aria-hidden="true" />
                <ViewByMenu
                  value={viewBy}
                  options={viewOptions}
                  open={menuOpen}
                  onToggle={() => setMenuOpen((open) => !open)}
                  onClose={closeMenu}
                  onSelect={(option) => {
                    setViewBy(option);
                    setVisible(PAGE_SIZE);
                    setChildVisible(NESTED_PAGE_SIZE);
                    setGroupVisible({});
                    setMenuOpen(false);
                  }}
                />
                <ExportButton />
              </div>
            </div>
            <div className="now-table">
              <div className="now-row now-row--head">
                <div>{nameHeader}</div>
                <SortHeader label="Participants" sortKey="participants" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} />
                <div>Distribution</div>
                <SortHeader label="Avg hrs/wk" sortKey="hrs" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} />
                <SortHeader label="Annual Cost" sortKey="cost" sort={sort} onSort={(key, dir) => setSort(nextSort(key, dir))} info />
                <span />
              </div>
              {grouped
                ? groups.map((group) => {
                    const shown = groupVisible[group.name] ?? PAGE_SIZE;
                    return (
                      <div key={group.name}>
                        <div className="pv-group">
                          {group.name} · {group.count} processes · ${Math.round(group.cost)}M total
                        </div>
                        {group.rows.slice(0, shown).map((row) => listRow(row))}
                        {group.rows.length > PAGE_SIZE ? (
                          <div className="cs-table__more">
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
                  })
                : listRows.slice(0, visible).map((row) => (
                    <div key={row.id}>
                      {listRow(row)}
                      {row.expandable && expandedKey === row.id
                        ? row.children?.slice(0, childVisible).map((child) => listRow(child, true))
                        : null}
                      {row.expandable && expandedKey === row.id && (row.children?.length ?? 0) > NESTED_PAGE_SIZE ? (
                        <div className="cs-table__more cs-table__more--indent">
                          {childVisible > NESTED_PAGE_SIZE ? (
                            <button className="btn-more" type="button" onClick={() => setChildVisible(NESTED_PAGE_SIZE)}>
                              <img className="icon" src={iconMinus} width={16} height={16} alt="" />
                              Show less
                            </button>
                          ) : null}
                          {childVisible < (row.children?.length ?? 0) ? (
                            <button className="btn-more" type="button" onClick={() => setChildVisible((count) => Math.min(count + PAGE_SIZE, row.children?.length ?? 0))}>
                              <img className="icon" src={iconAdd} width={16} height={16} alt="" />
                              Show 10 more
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
              {!grouped && listRows.length > PAGE_SIZE ? (
                <div className="cs-table__more">
                  {visible > PAGE_SIZE ? (
                    <button className="btn-more" type="button" onClick={() => setVisible(PAGE_SIZE)}>
                      <img className="icon" src={iconMinus} width={16} height={16} alt="" />
                      Show less
                    </button>
                  ) : null}
                  {visible < listRows.length ? (
                    <button className="btn-more" type="button" onClick={() => setVisible((count) => Math.min(count + PAGE_SIZE, listRows.length))}>
                      <img className="icon" src={iconAdd} width={16} height={16} alt="" />
                      Show 10 more
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <MiniLegend />
          </section>
        </>
      )}
      {how ? (
        <>
          <button className="how-panel__backdrop" type="button" aria-label="Dismiss panel" onClick={() => setHow(null)} />
          <HowPanel kind={how} onClose={() => setHow(null)} onViewMath={() => setHow("formula")} />
        </>
      ) : null}
    </div>
  );
}
