import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import iconFocus from "../assets/icons/icon-focus.svg";
import iconInfo from "../assets/icons/icon-info.svg";
import iconInfo16 from "../assets/icons/icon-info-16.svg";
import { ExportButton } from "./IconButton";
import iconSelectChevron from "../assets/icons/icon-select-chevron.svg";
import iconSortDown from "../assets/icons/icon-sort-down.svg";
import iconSortFill from "../assets/icons/icon-sort-fill.svg";
import iconChevronDownBlue from "../assets/icons/icon-chevron-down-blue.svg";
import iconClose from "../assets/icons/icon-close.svg";
import iconSparkle from "../assets/icons/icon-sparkle-24.svg";
import iconInfoFilled from "../assets/icons/icon-info-filled.svg";
import iconExpand from "../assets/icons/icon-expand.svg";
import iconAdd from "../assets/icons/icon-add.svg";
import iconMinus from "../assets/icons/icon-minus.svg";
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
import iconToggleOff from "../assets/icons/icon-toggle-off.svg";
import iconToggleOn from "../assets/icons/icon-toggle-on.svg";
import sankeyTransformation from "../assets/charts/ts-sankey-transformation.png";
import sankeyCapacity from "../assets/charts/ts-sankey-capacity.png";
import dotExecution from "../assets/icons/dot-execution.svg";
import dotComprehension from "../assets/icons/dot-comprehension.svg";
import dotCreation from "../assets/icons/dot-creation.svg";
import dotDecision from "../assets/icons/dot-decision.svg";
import dotCommunication from "../assets/icons/dot-communication.svg";
import dotCollapse from "../assets/icons/dot-collapse.svg";
import dotRuleBased from "../assets/icons/dot-rule-based.svg";
import dotAgents from "../assets/icons/dot-agents.svg";
import dotHybrid from "../assets/icons/dot-hybrid.svg";
import dotHuman from "../assets/icons/dot-human.svg";

const POSTURES = ["Aggressive", "Moderate", "Conservative"] as const;
const PAGE_SIZE = 10;
const NESTED_PAGE_SIZE = 5;
const TOTAL_PARTICIPANTS = 9414;

type Mode = "Participant" | "Process" | "Application";
type Drill = "now" | "intervention";
type RightKey = "collapse" | "rule" | "agents" | "hybrid" | "human";
type TreeLevel = "process" | "subprocess" | "task" | "activity";
type NowType = "execution" | "comprehension" | "creation" | "decision" | "communication";
type SortKey = "participants" | "hrs" | "freq" | "cost";
type SortDir = "asc" | "desc";
type SortState = { key: SortKey; dir: SortDir };
type HowKind = "capacity" | "formula" | "meanings" | "target";
type NowSeg = { key: NowType; flex: number; hrs: number; pct: number };
type PostureName = (typeof POSTURES)[number];
type IntFilterCol = "now" | PostureName;
type PostureCard = {
  key: RightKey;
  recovery: number;
  saved: string;
  note: string;
};

const PARTICIPANT_VIEWS = ["Business Unit", "Function", "Job Title"] as const;
const PROCESS_VIEWS = ["Enterprise", "Business Unit"] as const;
const APP_VIEWS = ["Application Category", "Application Title"] as const;

const SHOWING: Record<string, string[]> = {
  "Business Unit": ["Personal Lines", "Retail Services", "Wholesale Distribution", "Finance & Actuarial", "E-commerce Solutions"],
  Function: ["Underwriting", "Claims", "Customer Service"],
  "Job Title": ["Claims Adjuster", "Underwriter", "Customer Service Rep"],
  Enterprise: ["All processes"],
  "Application Category": ["Meeting and Collaboration", "Core LOB / Insurance Systems", "Email & Messaging"],
  "Application Title": ["Outlook", "MS Teams · meetings", "Guidewire ClaimCenter"],
};

const RIGHT: { key: RightKey; label: string; color: string; dot: string; meaning: string }[] = [
  {
    key: "collapse",
    label: "Process Collapse",
    color: "var(--end-collapse)",
    dot: dotCollapse,
    meaning: "Remove the activity entirely by changing the process so the work no longer needs to happen.",
  },
  {
    key: "rule",
    label: "Rule-based Automation",
    color: "var(--end-rule)",
    dot: dotRuleBased,
    meaning: "Deterministic system-to-system automation that follows a predefined mapping or rule.",
  },
  {
    key: "agents",
    label: "Agents",
    color: "var(--end-agents)",
    dot: dotAgents,
    meaning: "Autonomous AI completes the work end-to-end, with humans only handling flagged exceptions.",
  },
  {
    key: "hybrid",
    label: "Hybrid (Human + AI)",
    color: "var(--end-hybrid)",
    dot: dotHybrid,
    meaning: "AI drafts or suggests; a person reviews, edits, and confirms before anything is committed.",
  },
  {
    key: "human",
    label: "Human Only",
    color: "var(--end-human)",
    dot: dotHuman,
    meaning: "Judgment-heavy work that stays with people at this posture.",
  },
];

const RIGHT_META = Object.fromEntries(RIGHT.map((item) => [item.key, item])) as Record<RightKey, (typeof RIGHT)[number]>;

const POSTURE_BARS: Record<PostureName, { key: RightKey; flex: number }[]> = {
  Aggressive: [
    { key: "collapse", flex: 8 },
    { key: "rule", flex: 18 },
    { key: "agents", flex: 34 },
    { key: "hybrid", flex: 22 },
    { key: "human", flex: 16 },
  ],
  Moderate: [
    { key: "collapse", flex: 10 },
    { key: "rule", flex: 19 },
    { key: "agents", flex: 39 },
    { key: "hybrid", flex: 13 },
    { key: "human", flex: 19 },
  ],
  Conservative: [
    { key: "collapse", flex: 8 },
    { key: "rule", flex: 12 },
    { key: "agents", flex: 16 },
    { key: "hybrid", flex: 20 },
    { key: "human", flex: 44 },
  ],
};

const POSTURE_LEGEND: { key: RightKey; pct: number }[] = [
  { key: "collapse", pct: 10 },
  { key: "rule", pct: 19 },
  { key: "agents", pct: 39 },
  { key: "hybrid", pct: 13 },
  { key: "human", pct: 19 },
];

const NOW_ORDER: NowType[] = ["execution", "comprehension", "creation", "decision", "communication"];
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

const BREAKDOWN: NowSeg[] = [
  { key: "execution", flex: 39, hrs: 5.5, pct: 39 },
  { key: "comprehension", flex: 19, hrs: 2.2, pct: 19 },
  { key: "creation", flex: 19, hrs: 2.2, pct: 19 },
  { key: "decision", flex: 19, hrs: 2.2, pct: 19 },
  { key: "communication", flex: 10, hrs: 1.8, pct: 10 },
];

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
  risk?: string;
  intervention?: RightKey;
  postures?: Record<PostureName, PostureCard>;
  children?: TreeNode[];
};

const ACTIVITIES: {
  name: string;
  app: string;
  apps?: string[];
  type: NowType;
  subtype: string;
  rationale: string;
  risk: string;
  participants: number;
  hrs: string;
  freq: string;
  cost: string;
  share?: string;
  intervention: RightKey;
  postures: Record<PostureName, PostureCard>;
}[] = [
  {
    name: "Open source record",
    app: "Loan Origination System (LOS)",
    apps: ["MeridianLink", "Calyx Point", "LoanSphere"],
    type: "execution",
    subtype: "Data Capture & Transfer",
    rationale:
      "Moving or entering information from one source into a structured target by following a predefined mapping. The worker reads from a source and writes to a destination — no judgment about what to capture or how to transform it.",
    risk: "Harm to People",
    participants: 620,
    hrs: "12.0",
    freq: "12.0",
    cost: "$1.5M",
    share: "40%",
    intervention: "rule",
    postures: {
      Aggressive: {
        key: "agents",
        recovery: 100,
        saved: "15 hrs/wk saved",
        note: "Data flows system-to-system via API. The loan application populates borrower fields automatically; no manual entry. Humans only see flagged exceptions.",
      },
      Moderate: {
        key: "rule",
        recovery: 68,
        saved: "9 hrs/wk saved",
        note: "AI pre-fills borrower fields from the application; a human reviews and approves each loan file before it's saved.",
      },
      Conservative: {
        key: "hybrid",
        recovery: 35,
        saved: "4 hrs/wk saved",
        note: "Human enters borrower data. AI suggests field values where confidence is high; human accepts, edits, or overrides each one.",
      },
    },
  },
  {
    name: "Validate required fields",
    app: "MeridianLink",
    type: "comprehension",
    subtype: "Record Review",
    rationale: "Reading the case to confirm required fields and missing evidence before acting.",
    risk: "Regulatory Exposure",
    participants: 540,
    hrs: "4.2",
    freq: "6.0",
    cost: "$0.9M",
    intervention: "agents",
    postures: {
      Aggressive: {
        key: "agents",
        recovery: 92,
        saved: "4 hrs/wk saved",
        note: "An agent checks required fields against the policy pack and only surfaces files with missing evidence.",
      },
      Moderate: {
        key: "rule",
        recovery: 60,
        saved: "2.5 hrs/wk saved",
        note: "Rules flag incomplete fields; a reviewer confirms exceptions before the file moves on.",
      },
      Conservative: {
        key: "hybrid",
        recovery: 28,
        saved: "1.2 hrs/wk saved",
        note: "AI highlights likely gaps; the worker still walks the checklist and signs off.",
      },
    },
  },
  {
    name: "Scope Documentation",
    app: "Word",
    type: "creation",
    subtype: "Artifact Production",
    rationale: "Drafting a structured record of agreed scope, owners, and next steps.",
    risk: "Data Leakage",
    participants: 410,
    hrs: "3.1",
    freq: "3.2",
    cost: "$0.7M",
    intervention: "hybrid",
    postures: {
      Aggressive: {
        key: "agents",
        recovery: 80,
        saved: "2.5 hrs/wk saved",
        note: "An agent drafts the scope pack from the kickoff transcript and files it for exception-only review.",
      },
      Moderate: {
        key: "hybrid",
        recovery: 45,
        saved: "1.4 hrs/wk saved",
        note: "AI drafts the structure; a person edits owners, dates, and commitments before sharing.",
      },
      Conservative: {
        key: "human",
        recovery: 12,
        saved: "0.4 hrs/wk saved",
        note: "People write the document. AI only suggests headings and a checklist of missing sections.",
      },
    },
  },
  {
    name: "Approve exception",
    app: "Guidewire ClaimCenter",
    type: "decision",
    subtype: "Exception Judgment",
    rationale: "Choosing whether an exception proceeds based on policy, evidence, and risk.",
    risk: "Financial Loss",
    participants: 280,
    hrs: "2.4",
    freq: "2.1",
    cost: "$0.5M",
    intervention: "human",
    postures: {
      Aggressive: {
        key: "hybrid",
        recovery: 40,
        saved: "1.0 hrs/wk saved",
        note: "AI recommends approve or decline with a policy citation; a person still makes the call.",
      },
      Moderate: {
        key: "human",
        recovery: 8,
        saved: "0.2 hrs/wk saved",
        note: "Exception judgment stays with people. AI only assembles the evidence pack beside the decision.",
      },
      Conservative: {
        key: "human",
        recovery: 0,
        saved: "0 hrs/wk saved",
        note: "A qualified reviewer reads the file and records the decision without automated recommendation.",
      },
    },
  },
  {
    name: "Kickoff Facilitation",
    app: "MS Teams · meetings",
    type: "communication",
    subtype: "Meeting Coordination",
    rationale: "Scheduling and running working sessions so stakeholders share the same starting point.",
    risk: "Harm to People",
    participants: 180,
    hrs: "1.2",
    freq: "2.4",
    cost: "$1.1M",
    intervention: "collapse",
    postures: {
      Aggressive: {
        key: "collapse",
        recovery: 100,
        saved: "1.2 hrs/wk saved",
        note: "Kickoff is replaced by an async brief. Stakeholders review and comment in the system of record.",
      },
      Moderate: {
        key: "hybrid",
        recovery: 40,
        saved: "0.5 hrs/wk saved",
        note: "AI prepares the agenda and recap; a person still hosts a short working session.",
      },
      Conservative: {
        key: "human",
        recovery: 10,
        saved: "0.1 hrs/wk saved",
        note: "The meeting stays on the calendar. AI only drafts the invite and a follow-up note.",
      },
    },
  },
  {
    name: "Update status and notes",
    app: "Salesforce",
    type: "execution",
    subtype: "Data Capture & Transfer",
    rationale: "Writing the observed outcome back into the system of record.",
    risk: "Data Leakage",
    participants: 164,
    hrs: "1.0",
    freq: "2.2",
    cost: "$0.4M",
    intervention: "rule",
    postures: {
      Aggressive: {
        key: "rule",
        recovery: 100,
        saved: "1.0 hrs/wk saved",
        note: "Status writes back automatically when the upstream step completes. No manual notes unless an exception fires.",
      },
      Moderate: {
        key: "rule",
        recovery: 70,
        saved: "0.7 hrs/wk saved",
        note: "The system posts the outcome; a person adds a short note on exceptions only.",
      },
      Conservative: {
        key: "hybrid",
        recovery: 30,
        saved: "0.3 hrs/wk saved",
        note: "AI drafts the status sentence; the worker edits and saves it in the record.",
      },
    },
  },
];

function ViewByMenu({
  label,
  value,
  options,
  open,
  onToggle,
  onClose,
  onSelect,
}: {
  label: string;
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
      <span>{label}</span>
      <div className="view-by__wrap" ref={wrapRef}>
        <button className="view-by__control" type="button" aria-label={`${label} ${value}`} onClick={onToggle}>
          <span>{value}</span>
          <img className={`icon view-by__chevron${open ? " view-by__chevron--open" : ""}`} src={iconSelectChevron} width={24} height={24} alt="" />
        </button>
        {open ? (
          <div className="view-by__menu" role="listbox" aria-label={label}>
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

function HowKnowLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="pv-know" type="button" onClick={onClick}>
      {label}
      <img className="icon" src={iconChevronDownBlue} width={20} height={20} alt="" />
    </button>
  );
}

function HowPanel({ kind, onClose }: { kind: HowKind; onClose: () => void }) {
  const title =
    kind === "meanings" ? "What Nature of Work means" : kind === "target" ? "What Target State means" : "How Annual Cost is calculated";
  return (
    <aside className="how-panel" aria-label={title}>
      <div className="how-panel__head">
        <img className="icon" src={iconSparkle} width={24} height={24} alt="" />
        <p>{title}</p>
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
      ) : kind === "target" ? (
        <>
          <p className="how-panel__body">
            Each activity is assigned an intervention at the selected AI posture. The bars show how a typical week would
            split across those interventions in the target state.
          </p>
          <div className="now-meanings">
            {RIGHT.map((item) => (
              <div className="now-meanings__row" key={item.key}>
                <img className="icon" src={item.dot} width={14} height={14} alt="" />
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.meaning}</p>
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
    </aside>
  );
}

function NowBar({ name, segments }: { name: string; segments: NowSeg[] }) {
  return (
    <div className="usage-bar now-bar" role="img" aria-label={`${name} nature of work distribution`}>
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

function BreakdownCard({ onMeanings, label }: { onMeanings: () => void; label: string }) {
  return (
    <section className="card cs-chart now-breakdown">
      <div className="cs-chart__title-row">
        <h2>Nature of Work Breakdown</h2>
        <img className="icon" src={iconInfo} width={20} height={20} alt="" />
      </div>
      <p className="now-breakdown__kicker">How time is spend today</p>
      <NowBar name={label} segments={BREAKDOWN} />
      <div className="now-breakdown__foot">
        <div className="cs-legend">
          {BREAKDOWN.map((segment) => (
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

function TargetBreakdown({ posture, onMeanings }: { posture: PostureName; onMeanings: () => void }) {
  return (
    <section className="card cs-chart ts-breakdown">
      <div className="cs-chart__title-row">
        <h2>Target State Breakdown</h2>
        <img className="icon" src={iconInfo} width={20} height={20} alt="" />
      </div>
      <div className="ts-breakdown__stack">
        <p className="ts-breakdown__kicker">How we envision the future based on AI Posture</p>
        {POSTURES.map((name) => (
          <div className={`ts-posture-row${name === posture ? "" : " ts-posture-row--muted"}`} key={name}>
            <p className="ts-posture-row__label">{name}</p>
            <div className="usage-bar now-bar" role="img" aria-label={`${name} target state distribution`}>
              {POSTURE_BARS[name].map((segment, index) => (
                <div
                  key={segment.key}
                  className={`usage-bar__seg${index === 0 ? " usage-bar__seg--first" : ""}${
                    index === POSTURE_BARS[name].length - 1 ? " usage-bar__seg--last" : ""
                  }`}
                  style={{ flexGrow: segment.flex, background: RIGHT_META[segment.key].color }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="now-breakdown__foot">
        <div className="cs-legend now-mini-legend">
          {POSTURE_LEGEND.map((item) => (
            <span className="cs-legend__item" key={item.key}>
              <img className="icon" src={RIGHT_META[item.key].dot} width={14} height={14} alt="" />
              {RIGHT_META[item.key].label} {item.pct}%
            </span>
          ))}
        </div>
        <HowKnowLink label="What Target State means" onClick={onMeanings} />
      </div>
    </section>
  );
}

function ColumnFilter({
  open,
  label,
  options,
  value,
  onToggle,
  onSelect,
  className,
}: {
  open: boolean;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onToggle: () => void;
  onSelect: (value: string) => void;
  className?: string;
}) {
  return (
    <span className={`now-grid__cell now-grid__filter${className ? ` ${className}` : ""}`}>
      {label}
      <button className="now-filter" type="button" aria-label={`Filter ${label}`} onClick={onToggle}>
        <img className="icon" src={iconNowFilter} width={16} height={16} alt="" />
      </button>
      {open ? (
        <div className="view-by__menu now-filter__menu" role="listbox">
          <div className="view-by__list">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`view-by__item${value === option.value ? " view-by__item--active" : ""}`}
                onClick={() => onSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </span>
  );
}

function PostureCell({ card, className }: { card?: PostureCard; className?: string }) {
  if (!card) return <span className={`ts-posture${className ? ` ${className}` : ""}`} />;
  return (
    <span className={`ts-posture${className ? ` ${className}` : ""}`}>
      <span className={`now-badge ts-badge ts-badge--${card.key}`}>{RIGHT_META[card.key].label}</span>
      <span className="ts-posture__stats">
        <span className="ts-posture__meta">
          <span>{card.recovery}% Recovery</span>
          <span>{card.saved}</span>
        </span>
        <span className="ts-meter" aria-hidden="true">
          <span className="ts-meter__fill" style={{ width: `${card.recovery}%` }} />
        </span>
      </span>
      <span className="ts-tara">
        <span className="ts-tara__label">
          TARA-9 type
          <img className="icon" src={iconInfo16} width={16} height={16} alt="" />
        </span>
        <span className="ts-tara-badge">API Integration</span>
      </span>
      <p className="ts-posture__note">{card.note}</p>
    </span>
  );
}

function makeTree(): TreeNode {
  const taskDefs = [
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
  const subprocessDefs = [
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

  const subprocesses: TreeNode[] = subprocessDefs.map(([name, count], sIndex) => {
    const subprocessId = `p0-s${sIndex}`;
    const tasks: TreeNode[] = taskDefs.map(([taskName, taskCount], tIndex) => {
      const taskId = `${subprocessId}-t${tIndex}`;
      return {
        id: taskId,
        name: taskName,
        level: "task",
        childCount: taskCount,
        application: "",
        participants: String(520 - tIndex * 28),
        hrs: (2.1 - tIndex * 0.1).toFixed(1),
        freq: (2.8 - tIndex * 0.1).toFixed(1),
        cost: `$${(2.4 - tIndex * 0.15).toFixed(1)}M`,
        children: ACTIVITIES.map((activity, aIndex) => ({
          id: `${taskId}-a${aIndex}`,
          name: activity.name,
          level: "activity" as const,
          childCount: 0,
          application: activity.app,
          apps: activity.apps,
          participants: String(activity.participants),
          hrs: activity.hrs,
          freq: activity.freq,
          cost: activity.cost,
          share: activity.share,
          nowType: activity.type,
          subtype: activity.subtype,
          rationale: activity.rationale,
          risk: activity.risk,
          intervention: activity.intervention,
          postures: activity.postures,
        })),
      };
    });
    return {
      id: subprocessId,
      name,
      level: "subprocess",
      childCount: count,
      application: "",
      participants: String(380 - sIndex * 18),
      hrs: (1.6 - sIndex * 0.08).toFixed(1),
      freq: (2.8 - sIndex * 0.1).toFixed(1),
      cost: `$${(3.2 - sIndex * 0.2).toFixed(1)}M`,
      children: tasks,
    };
  });

  return {
    id: "p0",
    name: "Engagement Delivery",
    level: "process",
    childCount: 140,
    application: "",
    participants: "1,300",
    hrs: "45",
    freq: "3.2",
    cost: "$9.0M",
    share: "60%",
    children: subprocesses,
  };
}

function levelIcon(level: TreeLevel) {
  if (level === "process") return iconProcess;
  if (level === "subprocess") return iconSubprocess;
  if (level === "task") return iconTask;
  return iconActivity;
}

function parseMetric(value: string) {
  const n = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function TargetStatePage() {
  const [posture, setPosture] = useState<(typeof POSTURES)[number]>("Moderate");
  const [mode, setMode] = useState<Mode>("Participant");
  const [viewBy, setViewBy] = useState("Business Unit");
  const [showing, setShowing] = useState("Personal Lines");
  const [menu, setMenu] = useState<"view" | "show" | null>(null);
  const [capacity, setCapacity] = useState(false);
  const [how, setHow] = useState<HowKind | null>(null);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [treeExpanded, setTreeExpanded] = useState(["p0"]);
  const [subprocessVisible, setSubprocessVisible] = useState(NESTED_PAGE_SIZE);
  const [taskVisible, setTaskVisible] = useState(5);
  const [activityVisible, setActivityVisible] = useState(5);
  const [gridSort, setGridSort] = useState<SortState>({ key: "cost", dir: "desc" });
  const [nowFilter, setNowFilter] = useState<NowType | "all">("all");
  const [aggFilter, setAggFilter] = useState<RightKey | "all">("all");
  const [modFilter, setModFilter] = useState<RightKey | "all">("all");
  const [conFilter, setConFilter] = useState<RightKey | "all">("all");
  const [filterOpen, setFilterOpen] = useState<IntFilterCol | false>(false);
  const closeMenus = useCallback(() => setMenu(null), []);

  const viewOptions = mode === "Participant" ? PARTICIPANT_VIEWS : mode === "Process" ? PROCESS_VIEWS : APP_VIEWS;
  const showOptions = SHOWING[viewBy] ?? SHOWING["Business Unit"];
  const tree = useMemo(() => makeTree(), []);
  const deepest = deepestHierarchyLevel(treeExpanded);

  function changeMode(next: Mode) {
    setMode(next);
    const nextView = next === "Participant" ? "Business Unit" : next === "Process" ? "Enterprise" : "Application Category";
    setViewBy(nextView);
    setShowing((SHOWING[nextView] ?? SHOWING["Business Unit"])[0]);
    setMenu(null);
  }

  function openDrill(next: Drill) {
    setDrill(next);
    setHow(null);
    setTreeExpanded(["p0"]);
    setSubprocessVisible(NESTED_PAGE_SIZE);
    setTaskVisible(5);
    setActivityVisible(5);
    setGridSort({ key: "cost", dir: "desc" });
    setNowFilter("all");
    setAggFilter("all");
    setModFilter("all");
    setConFilter("all");
    setFilterOpen(false);
    if (next === "intervention") setGridSort({ key: "hrs", dir: "desc" });
  }

  function toggleTree(id: string) {
    setTreeExpanded((current) => toggleHierarchyExpand(current, id));
    setTaskVisible(5);
    setActivityVisible(5);
  }

  function nextGridSort(key: SortKey, dir?: SortDir): SortState {
    if (dir) return { key, dir };
    if (gridSort.key === key) return { key, dir: gridSort.dir === "desc" ? "asc" : "desc" };
    return { key, dir: "desc" };
  }

  function metricValue(node: TreeNode, key: SortKey) {
    const raw = key === "participants" ? node.participants : key === "hrs" ? node.hrs : key === "freq" ? node.freq : node.cost;
    return parseMetric(raw);
  }

  function sortedNodes(nodes: TreeNode[]) {
    const sign = gridSort.dir === "asc" ? 1 : -1;
    return [...nodes].sort((a, b) => (metricValue(a, gridSort.key) - metricValue(b, gridSort.key)) * sign);
  }

  function renderNowTree(node: TreeNode, depth = 0): ReactNode {
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
        {shownChildren.map((child) => renderNowTree(child, depth + 1))}
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

  function activityMatches(node: TreeNode) {
    if (nowFilter !== "all" && node.nowType !== nowFilter) return false;
    if (aggFilter !== "all" && node.postures?.Aggressive.key !== aggFilter) return false;
    if (modFilter !== "all" && node.postures?.Moderate.key !== modFilter) return false;
    if (conFilter !== "all" && node.postures?.Conservative.key !== conFilter) return false;
    return true;
  }

  function renderInterventionTree(node: TreeNode, depth = 0): ReactNode {
    const isOpen = treeExpanded.includes(node.id);
    const children = node.children ?? [];
    const canExpand = children.length > 0;
    const shown =
      node.level === "process" && isOpen
        ? sortedNodes(children).slice(0, subprocessVisible)
        : node.level === "subprocess" && isOpen
          ? sortedNodes(children).slice(0, taskVisible)
          : node.level === "task" && isOpen
            ? sortedNodes(children.filter(activityMatches)).slice(0, activityVisible)
            : isOpen
              ? sortedNodes(children)
              : [];
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
              {node.level === "activity" && node.risk ? (
                <span className="ts-risk">
                  <span className="ts-risk__label">
                    Risk Factor
                    <img className="icon" src={iconInfo16} width={16} height={16} alt="" />
                  </span>
                  <span className="ts-risk-pill">{node.risk}</span>
                </span>
              ) : null}
            </span>
          </span>
          <span className="now-grid__cell">{node.hrs}</span>
          <span className="now-grid__cell now-grid__now">
            {node.nowType ? (
              <span className="now-type">
                <span className="ts-now-badge">
                  <span className={`now-badge now-badge--${node.nowType}`}>{NOW_META[node.nowType].label}</span>
                  <img className="icon" src={iconInfo16} width={16} height={16} alt="" />
                </span>
                {node.subtype ? (
                  <span className="now-type__meta">
                    {node.subtype}
                    <img className="icon" src={iconInfo16} width={16} height={16} alt="" />
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
          <PostureCell className="ts-col--aggressive" card={node.postures?.Aggressive} />
          <PostureCell className="ts-col--moderate" card={node.postures?.Moderate} />
          <PostureCell className="ts-col--conservative" card={node.postures?.Conservative} />
        </button>
        {shown.map((child) => renderInterventionTree(child, depth + 1))}
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

  const kpis: { label: string; value: string; meta?: string; know?: "formula" | "capacity" }[] =
    drill === "now"
      ? [
          { label: "Total Participants", value: "1,300", meta: `26% of ${TOTAL_PARTICIPANTS.toLocaleString()} participants` },
          { label: "Avg Time Spent", value: "45 hrs/wk" },
          { label: "Annual Cost", value: "$61M", know: "formula" as const },
          { label: "Activities Observed", value: "214" },
        ]
      : drill === "intervention"
        ? [
            { label: "Total Capacity Recovery Opportunity", value: "$1.2M-2M", know: "capacity" as const },
            { label: "Recovery Opportunity of Wave 1", value: "$0.3M-1.1M" },
            { label: "Current Annual Cost", value: "$61M" },
            { label: "Activities Observed", value: "214" },
          ]
        : [
            { label: "Total Capacity Recovery Opportunity", value: "$125M-150M", know: "capacity" as const },
            { label: "Recovery Opportunity of Wave 1", value: "$9M-11M" },
            { label: "Current Annual Cost", value: "$1.24B" },
            { label: "Activities Observed", value: "4600" },
          ];

  const howValue = drill === "intervention" ? "$1.2M-2M" : "$125M-150M";

  return (
    <div className="stack-32 ts">
      <div className="page-title">
        <img className="icon" src={iconFocus} width={24} height={24} alt="" />
        <h1>Target State</h1>
      </div>
      <div className="posture-row">
        <p className="posture-row__label">AI Posture</p>
        <div className="segmented" role="tablist" aria-label="AI Posture">
          {POSTURES.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={posture === option}
              className={`segmented__opt${posture === option ? " segmented__opt--active" : ""}`}
              onClick={() => setPosture(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {drill ? (
        <div className="pv-nav">
          <BackButton onClick={() => setDrill(null)}>Back to all {viewBy}s</BackButton>
          <h2>
            {drill === "now" ? "Nature of Work (Current State)" : "Interventions (Target State)"}: {showing}
          </h2>
        </div>
      ) : null}

      <div className="cs-kpis now-kpis">
        {kpis.map((kpi) => (
          <article className="cs-kpi" key={kpi.label}>
            <p className="cs-kpi__label">{kpi.label}</p>
            <p className="cs-kpi__value">{kpi.value}</p>
            {kpi.know ? (
              <HowKnowLink label="How we know" onClick={() => setHow((current) => (current === kpi.know ? null : kpi.know ?? null))} />
            ) : kpi.meta ? (
              <p className="cs-kpi__meta">{kpi.meta}</p>
            ) : (
              <span className="cs-kpi__meta">&nbsp;</span>
            )}
          </article>
        ))}
      </div>

      {how === "capacity" ? (
        <div className="ts-how">
          <img className="icon" src={iconSparkle} width={16} height={16} alt="" />
          <div>
            <p className="ts-how__title">How we got {howValue}</p>
            <p>
              Recoverable minutes at the selected posture ({posture}) × fully-loaded labour rate, annualised. Recovery
              rate is the share of each activity&apos;s observed time that can move off humans at this posture —
              rule-based work recovers ~100%, AI-with-human-in-loop recovers 30–85%, and human-only work recovers 0%.
            </p>
            <p className="ts-how__note">Based on 12.6M observed hours · {posture} posture · Gross recoverable capacity before AI build and change costs</p>
          </div>
          <button className="how-panel__close" type="button" aria-label="Close" onClick={() => setHow(null)}>
            <img className="icon" src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>
      ) : null}

      {how === "formula" || how === "meanings" || how === "target" ? (
        <>
          <button className="how-panel__backdrop" type="button" aria-label="Close panel" onClick={() => setHow(null)} />
          <HowPanel kind={how} onClose={() => setHow(null)} />
        </>
      ) : null}

      {drill === "now" ? (
        <>
          <BreakdownCard onMeanings={() => setHow("meanings")} label={showing} />
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
                  <button className="now-filter" type="button" aria-label="Filter nature of work" onClick={() => setFilterOpen((open) => (open === "now" ? false : "now"))}>
                    <img className="icon" src={iconNowFilter} width={16} height={16} alt="" />
                  </button>
                  {filterOpen === "now" ? (
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
              {renderNowTree(tree)}
            </div>
          </section>
        </>
      ) : drill === "intervention" ? (
        <>
          <TargetBreakdown posture={posture} onMeanings={() => setHow("target")} />
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
            <div className="ts-int" data-posture={posture}>
              <div className="ts-int__inner">
              <div className="ts-int__grouphead">
                <span className="ts-int__grouphead-current">
                  <span className="now-grid__lead" aria-hidden="true" />
                  <span>Current State</span>
                </span>
                <span className="ts-int__grouphead-target">Target State</span>
              </div>
              <div className="ts-int__head">
                <span className="now-grid__group now-grid__group--head">
                  <span className="now-grid__lead" aria-hidden="true" />
                  <span className="now-grid__group-cell">Group</span>
                </span>
                <span className="now-grid__cell">
                  <SortHeader label="Avg hrs/wk" sortKey="hrs" sort={gridSort} onSort={(key, dir) => setGridSort(nextGridSort(key, dir))} info />
                </span>
                <ColumnFilter
                  open={filterOpen === "now"}
                  label="Nature of Work"
                  value={nowFilter}
                  options={[{ value: "all", label: "All types" }, ...NOW_ORDER.map((key) => ({ value: key, label: NOW_META[key].label }))]}
                  onToggle={() => setFilterOpen((open) => (open === "now" ? false : "now"))}
                  onSelect={(value) => {
                    setNowFilter(value as NowType | "all");
                    setFilterOpen(false);
                  }}
                />
                <ColumnFilter
                  className="now-grid__cell--posture ts-col--aggressive"
                  open={filterOpen === "Aggressive"}
                  label="AI Posture - Aggressive"
                  value={aggFilter}
                  options={[{ value: "all", label: "All types" }, ...RIGHT.map((item) => ({ value: item.key, label: item.label }))]}
                  onToggle={() => setFilterOpen((open) => (open === "Aggressive" ? false : "Aggressive"))}
                  onSelect={(value) => {
                    setAggFilter(value as RightKey | "all");
                    setFilterOpen(false);
                  }}
                />
                <ColumnFilter
                  className="now-grid__cell--posture ts-col--moderate"
                  open={filterOpen === "Moderate"}
                  label="AI Posture - Moderate"
                  value={modFilter}
                  options={[{ value: "all", label: "All types" }, ...RIGHT.map((item) => ({ value: item.key, label: item.label }))]}
                  onToggle={() => setFilterOpen((open) => (open === "Moderate" ? false : "Moderate"))}
                  onSelect={(value) => {
                    setModFilter(value as RightKey | "all");
                    setFilterOpen(false);
                  }}
                />
                <ColumnFilter
                  className="now-grid__cell--posture ts-col--conservative"
                  open={filterOpen === "Conservative"}
                  label="AI Posture - Conservative"
                  value={conFilter}
                  options={[{ value: "all", label: "All types" }, ...RIGHT.map((item) => ({ value: item.key, label: item.label }))]}
                  onToggle={() => setFilterOpen((open) => (open === "Conservative" ? false : "Conservative"))}
                  onSelect={(value) => {
                    setConFilter(value as RightKey | "all");
                    setFilterOpen(false);
                  }}
                />
              </div>
              {renderInterventionTree(tree)}
              <div className="ts-int__col-hl" aria-hidden="true" />
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="card cs-chart">
          <div className="ts-chart-head">
            <div className="cs-chart__header">
              <div>
                <div className="cs-chart__title-row">
                  <h2>The Transformation Picture</h2>
                  <img className="icon" src={iconInfo} width={20} height={20} alt="" />
                </div>
                <p>
                  Showing for {viewBy} - {showing} · Click any band for more details
                </p>
              </div>
              <div className="cs-chart__controls">
                <div className="rd-switch now-switch" role="tablist" aria-label="Target State dimension">
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
                  label="View by:"
                  value={viewBy}
                  options={viewOptions}
                  open={menu === "view"}
                  onToggle={() => setMenu((current) => (current === "view" ? null : "view"))}
                  onClose={closeMenus}
                  onSelect={(option) => {
                    setViewBy(option);
                    setShowing((SHOWING[option] ?? SHOWING["Business Unit"])[0]);
                    setMenu(null);
                  }}
                />
                <ViewByMenu
                  label="Showing:"
                  value={showing}
                  options={showOptions}
                  open={menu === "show"}
                  onToggle={() => setMenu((current) => (current === "show" ? null : "show"))}
                  onClose={closeMenus}
                  onSelect={(option) => {
                    setShowing(option);
                    setMenu(null);
                  }}
                />
              </div>
            </div>
            <button className="ts-toggle" type="button" onClick={() => setCapacity((value) => !value)}>
              <span className={!capacity ? "ts-toggle__on" : undefined}>Transformation View</span>
              <img className="icon" src={capacity ? iconToggleOn : iconToggleOff} width={24} height={24} alt="" />
              <span className={capacity ? "ts-toggle__on" : undefined}>Capacity View</span>
            </button>
          </div>
          <div className="ts-sankey-hit">
            <img
              src={capacity ? sankeyCapacity : sankeyTransformation}
              width={1684}
              height={768}
              alt={
                capacity
                  ? "Current Nature of Work flowing through recovered capacity into target Nature of Work"
                  : "Nature of Work flowing into intervention categories"
              }
            />
            <button className="ts-sankey-hit__left" type="button" onClick={() => openDrill("now")} aria-label="Open Nature of Work current-state details">
              Nature of Work (Current State)
            </button>
            <button className="ts-sankey-hit__right" type="button" onClick={() => openDrill("intervention")} aria-label="Open intervention details">
              Intervention Category (Target State)
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
