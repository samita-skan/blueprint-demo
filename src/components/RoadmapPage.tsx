import { useMemo, useState } from "react";
import iconRoadmap from "../assets/icons/icon-roadmap.svg";
import iconInfo from "../assets/icons/icon-info.svg";
import iconExpand from "../assets/icons/icon-expand.svg";
import { ExportButton } from "./IconButton";
import iconChevronDownBlue from "../assets/icons/icon-chevron-down-blue.svg";
import iconClose from "../assets/icons/icon-close.svg";
import iconSparkle from "../assets/icons/icon-sparkle-24.svg";
import iconAdd from "../assets/icons/icon-add.svg";
import iconMinus from "../assets/icons/icon-minus.svg";
import iconSortDown from "../assets/icons/icon-sort-down.svg";
import iconSortFill from "../assets/icons/icon-sort-fill.svg";
import opportunityMap from "../assets/charts/rm-opportunity-map.png";
import dotCollapse from "../assets/icons/dot-collapse.svg";
import dotRuleBased from "../assets/icons/dot-rule-based.svg";
import dotAgents from "../assets/icons/dot-agents.svg";
import dotHybrid from "../assets/icons/dot-hybrid.svg";
import dotHuman from "../assets/icons/dot-human.svg";

const POSTURES = ["Aggressive", "Moderate", "Conservative"] as const;
const PAGE_SIZE = 14;

type Cat = "collapse" | "rule" | "agents" | "hybrid" | "human";
type Wave = 1 | 2 | 3;
type SortKey = "category" | "activities" | "impact" | "feasibility" | "wave";
type ActSortKey = "category" | "hours" | "recoverable" | "impact" | "feasibility";
type SortDir = "asc" | "desc";
type SortState = { key: SortKey; dir: SortDir };
type ActSortState = { key: ActSortKey; dir: SortDir };

type ActivityRow = {
  name: string;
  path: string;
  cat: Cat;
  hours: number;
  recoverable: number;
  impact: string;
  impactHigh: number;
  feasibility: number;
};

type Population = { role: string; pct: string };

type InterventionDetails = {
  summary: string;
  hours: string;
  recoverable: string;
  people: string;
  tech: string;
  automation: string;
  activities: ActivityRow[];
  populations: Population[];
};

type Intervention = {
  id: string;
  name: string;
  cat: Cat;
  activities: number;
  impact: string;
  impactHigh: number;
  feasibility: number;
  wave: Wave;
  details: InterventionDetails;
};

const CAT_META: Record<Cat, { label: string; badge: string; dot: string }> = {
  collapse: { label: "Process Collapse", badge: "ts-badge--collapse", dot: dotCollapse },
  rule: { label: "Rule-based Automation", badge: "ts-badge--rule", dot: dotRuleBased },
  agents: { label: "Agentic", badge: "ts-badge--agents", dot: dotAgents },
  hybrid: { label: "Hybrid (Human + AI)", badge: "ts-badge--hybrid", dot: dotHybrid },
  human: { label: "Human Only", badge: "ts-badge--human", dot: dotHuman },
};

const LEGEND: Cat[] = ["collapse", "rule", "agents", "hybrid", "human"];

const QOF = "Quote, Order & Fulfillment";
const RENEWAL = "Renewals & Account Management";
const INSIGHT = "Reporting, Insights & Forecasting";
const ENABLE = "Enablement & Process Documentation";

function act(name: string, path: string, cat: Cat, hours: number, recoverable: number, impact: string, impactHigh: number, feasibility: number): ActivityRow {
  return { name, path, cat, hours, recoverable, impact, impactHigh, feasibility };
}

const INTERVENTIONS: Intervention[] = [
  {
    id: "quoting",
    name: "AI-drafted quoting and order approval",
    cat: "hybrid",
    activities: 4,
    impact: "$212k-336k",
    impactHigh: 336,
    feasibility: 34,
    wave: 3,
    details: {
      summary: "AI compiles requirements, validates pricing and coverage, routes exceptions and assembles the fulfilment handoff; the rep signs off.",
      hours: "512",
      recoverable: "64%",
      people: "31",
      tech: "47",
      automation: "40",
      activities: [
        act("Gather Customer Requirements for Quoting", `${QOF} › Create & Submit Quotes`, "hybrid", 165, 91, "$73k-115k", 115, 34),
        act("Review and Validate Quote Accuracy", `${QOF} › Create & Submit Quotes`, "hybrid", 155, 93, "$71-112k", 112, 33),
        act("Obtain Required Order Approvals", `${QOF} › Order Entry & Validation`, "hybrid", 93, 82, "$37k-59k", 59, 32),
        act("Submit Order to Fulfillment or Operations Team", `${QOF} › Order Fulfillment Coordination`, "hybrid", 98, 66, "$31k-50k", 50, 35),
      ],
      populations: [
        { role: "Renewals Sales Rep", pct: "59%" },
        { role: "SRS Rep", pct: "10%" },
        { role: "Outsources Services Provider", pct: "8%" },
        { role: "Inside Product Specialist", pct: "7%" },
      ],
    },
  },
  {
    id: "sync",
    name: "Sync pipeline and account records from source systems",
    cat: "collapse",
    activities: 4,
    impact: "$201k-318k",
    impactHigh: 318,
    feasibility: 95,
    wave: 1,
    details: {
      summary: "Source-system records are ingested, de-duplicated and written back so pipeline and account data stay current without manual re-keying.",
      hours: "428",
      recoverable: "92%",
      people: "18",
      tech: "88",
      automation: "91",
      activities: [
        act("Ingest Account Records from Source Systems", `${QOF} › Account Data Maintenance`, "collapse", 142, 96, "$72k-114k", 114, 96),
        act("Reconcile Pipeline Stages Across Systems", `${QOF} › Pipeline Hygiene`, "collapse", 118, 94, "$58k-92k", 92, 94),
        act("Deduplicate Customer and Opportunity Keys", `${QOF} › Account Data Maintenance`, "collapse", 96, 90, "$42k-67k", 67, 93),
        act("Push Updates Back to Source Systems", `${QOF} › Account Data Maintenance`, "collapse", 72, 88, "$29k-45k", 45, 95),
      ],
      populations: [
        { role: "Sales Operations Analyst", pct: "48%" },
        { role: "Renewals Sales Rep", pct: "22%" },
        { role: "Inside Product Specialist", pct: "16%" },
        { role: "SRS Rep", pct: "9%" },
      ],
    },
  },
  {
    id: "order-entry",
    name: "Rules-based order entry and billing validation",
    cat: "rule",
    activities: 3,
    impact: "$191k-302k",
    impactHigh: 302,
    feasibility: 70,
    wave: 1,
    details: {
      summary: "Order-entry rules check billing fields, apply validation, and flag exceptions before the order is submitted.",
      hours: "486",
      recoverable: "81%",
      people: "24",
      tech: "72",
      automation: "68",
      activities: [
        act("Validate Billing Fields Against Order Rules", `${QOF} › Order Entry & Validation`, "rule", 188, 86, "$82k-130k", 130, 72),
        act("Apply Order-Entry and Pricing Rules", `${QOF} › Order Entry & Validation`, "rule", 164, 84, "$68k-108k", 108, 70),
        act("Flag Exception Cases for Review", `${QOF} › Order Entry & Validation`, "rule", 134, 72, "$41k-64k", 64, 68),
      ],
      populations: [
        { role: "Order Management Specialist", pct: "44%" },
        { role: "Renewals Sales Rep", pct: "28%" },
        { role: "Billing Analyst", pct: "18%" },
        { role: "SRS Rep", pct: "7%" },
      ],
    },
  },
  {
    id: "reporting",
    name: "Agent-run reporting, dashboards and forecasting",
    cat: "agents",
    activities: 3,
    impact: "$166k-263k",
    impactHigh: 263,
    feasibility: 61,
    wave: 1,
    details: {
      summary: "Agents assemble dashboards, generate the forecast pack, and distribute stakeholder summaries on a set cadence.",
      hours: "394",
      recoverable: "78%",
      people: "22",
      tech: "64",
      automation: "58",
      activities: [
        act("Assemble Weekly Performance Dashboard", `${INSIGHT} › Dashboard Production`, "agents", 156, 82, "$68k-108k", 108, 63),
        act("Generate Forecast Pack from Observed Pipeline", `${INSIGHT} › Forecasting`, "agents", 138, 80, "$58k-92k", 92, 61),
        act("Distribute Stakeholder Summary", `${INSIGHT} › Reporting Cadence`, "agents", 100, 70, "$40k-63k", 63, 58),
      ],
      populations: [
        { role: "Sales Operations Analyst", pct: "41%" },
        { role: "Renewals Sales Rep", pct: "24%" },
        { role: "Finance Business Partner", pct: "19%" },
        { role: "Inside Product Specialist", pct: "11%" },
      ],
    },
  },
  {
    id: "renewal-list",
    name: "Detect expiring contracts and rank the renewal list",
    cat: "rule",
    activities: 2,
    impact: "$155k-245k",
    impactHigh: 245,
    feasibility: 63,
    wave: 1,
    details: {
      summary: "Contract end dates are scanned and the renewal list is ranked so reps start with the highest-value expiries.",
      hours: "312",
      recoverable: "84%",
      people: "19",
      tech: "66",
      automation: "60",
      activities: [
        act("Detect Expiring Contracts from Source Systems", `${RENEWAL} › Contract Monitoring`, "rule", 176, 88, "$88k-139k", 139, 65),
        act("Rank the Renewal List by Value and Risk", `${RENEWAL} › Renewal Prioritization`, "rule", 136, 79, "$67k-106k", 106, 61),
      ],
      populations: [
        { role: "Renewals Sales Rep", pct: "62%" },
        { role: "SRS Rep", pct: "16%" },
        { role: "Sales Operations Analyst", pct: "12%" },
        { role: "Inside Product Specialist", pct: "8%" },
      ],
    },
  },
  {
    id: "renewal-signals",
    name: "AI-scored renewal signals and outreach",
    cat: "hybrid",
    activities: 5,
    impact: "$137k-216k",
    impactHigh: 216,
    feasibility: 42,
    wave: 2,
    details: {
      summary: "AI scores renewal likelihood, drafts outreach, and the rep reviews and logs the next step.",
      hours: "448",
      recoverable: "61%",
      people: "28",
      tech: "51",
      automation: "44",
      activities: [
        act("Score Renewal Likelihood from Account Signals", `${RENEWAL} › Renewal Prioritization`, "hybrid", 112, 74, "$38k-60k", 60, 44),
        act("Draft Outreach Sequence for At-Risk Accounts", `${RENEWAL} › Renewal Outreach`, "hybrid", 98, 68, "$32k-51k", 51, 42),
        act("Prioritize Accounts for Rep Review", `${RENEWAL} › Renewal Prioritization`, "hybrid", 86, 62, "$26k-41k", 41, 43),
        act("Review Suggested Next Step with Rep", `${RENEWAL} › Renewal Outreach`, "hybrid", 82, 54, "$22k-35k", 35, 40),
        act("Log Outreach Outcome in the Account Record", `${RENEWAL} › Account Intelligence`, "hybrid", 70, 48, "$19k-29k", 29, 41),
      ],
      populations: [
        { role: "Renewals Sales Rep", pct: "54%" },
        { role: "SRS Rep", pct: "18%" },
        { role: "Inside Product Specialist", pct: "14%" },
        { role: "Outsourced Services Provider", pct: "8%" },
      ],
    },
  },
  {
    id: "presales",
    name: "Co-pilot for technical pre-sales and risk",
    cat: "hybrid",
    activities: 10,
    impact: "$125k-198k",
    impactHigh: 198,
    feasibility: 10,
    wave: 3,
    details: {
      summary: "A co-pilot drafts technical notes and flags delivery risk; the specialist reviews architecture, security, and next steps.",
      hours: "620",
      recoverable: "38%",
      people: "36",
      tech: "22",
      automation: "18",
      activities: [
        act("Capture Technical Requirements for the Deal", `${QOF} › Technical Pre-Sales`, "hybrid", 84, 46, "$18k-29k", 29, 12),
        act("Draft Solution Outline from Requirements", `${QOF} › Technical Pre-Sales`, "hybrid", 76, 44, "$16k-25k", 25, 11),
        act("Flag Delivery Risk Across the Solution", `${QOF} › Risk Review`, "hybrid", 72, 40, "$14k-22k", 22, 10),
        act("Prepare Architecture Notes for Review", `${QOF} › Technical Pre-Sales`, "hybrid", 68, 38, "$13k-21k", 21, 10),
        act("Review Security Exceptions with Specialist", `${QOF} › Risk Review`, "hybrid", 64, 36, "$12k-19k", 19, 9),
        act("Estimate Integration Effort", `${QOF} › Technical Pre-Sales`, "hybrid", 60, 35, "$11k-18k", 18, 10),
        act("Assemble Risk Register for Deal Desk", `${QOF} › Risk Review`, "hybrid", 56, 34, "$10k-16k", 16, 9),
        act("Share Pack with Deal Desk", `${QOF} › Deal Desk Handoff`, "hybrid", 52, 32, "$9k-14k", 14, 11),
        act("Update Opportunity Notes", `${QOF} › Deal Desk Handoff`, "hybrid", 48, 30, "$8k-13k", 13, 10),
        act("Confirm Next Technical Step", `${QOF} › Technical Pre-Sales`, "hybrid", 40, 28, "$7k-11k", 11, 8),
      ],
      populations: [
        { role: "Solutions Engineer", pct: "46%" },
        { role: "Renewals Sales Rep", pct: "22%" },
        { role: "Inside Product Specialist", pct: "18%" },
        { role: "SRS Rep", pct: "9%" },
      ],
    },
  },
  {
    id: "market",
    name: "Agent-run market monitoring and value summaries",
    cat: "agents",
    activities: 2,
    impact: "$110k-173k",
    impactHigh: 173,
    feasibility: 50,
    wave: 2,
    details: {
      summary: "Agents watch market signals and draft value summaries the rep can drop into customer conversations.",
      hours: "268",
      recoverable: "72%",
      people: "16",
      tech: "58",
      automation: "52",
      activities: [
        act("Monitor Market Signals for Named Accounts", `${INSIGHT} › Market Monitoring`, "agents", 148, 76, "$62k-98k", 98, 52),
        act("Draft Value Summaries for Outreach", `${INSIGHT} › Value Messaging`, "agents", 120, 67, "$48k-75k", 75, 48),
      ],
      populations: [
        { role: "Renewals Sales Rep", pct: "38%" },
        { role: "Sales Operations Analyst", pct: "27%" },
        { role: "Inside Product Specialist", pct: "21%" },
        { role: "SRS Rep", pct: "9%" },
      ],
    },
  },
  {
    id: "quote-delivery",
    name: "Agent-run quote delivery and order tracking",
    cat: "agents",
    activities: 2,
    impact: "$108k-171k",
    impactHigh: 171,
    feasibility: 61,
    wave: 1,
    details: {
      summary: "Approved quotes are delivered and order status is tracked without the rep chasing systems.",
      hours: "254",
      recoverable: "76%",
      people: "14",
      tech: "63",
      automation: "58",
      activities: [
        act("Deliver Approved Quotes to the Customer", `${QOF} › Quote Delivery`, "agents", 138, 80, "$60k-95k", 95, 63),
        act("Track Order Status Through Fulfillment", `${QOF} › Order Fulfillment Coordination`, "agents", 116, 71, "$48k-76k", 76, 59),
      ],
      populations: [
        { role: "Renewals Sales Rep", pct: "42%" },
        { role: "Order Management Specialist", pct: "31%" },
        { role: "SRS Rep", pct: "15%" },
        { role: "Inside Product Specialist", pct: "8%" },
      ],
    },
  },
  {
    id: "docs",
    name: "AI-drafted customer documentation and materials",
    cat: "rule",
    activities: 3,
    impact: "$103k-162k",
    impactHigh: 162,
    feasibility: 28,
    wave: 3,
    details: {
      summary: "Customer materials are drafted from templates, checked against rules, and queued for review.",
      hours: "336",
      recoverable: "52%",
      people: "21",
      tech: "34",
      automation: "30",
      activities: [
        act("Draft Customer Materials from Approved Templates", `${ENABLE} › Customer Materials`, "rule", 128, 58, "$42k-66k", 66, 30),
        act("Apply Template and Branding Rules", `${ENABLE} › Customer Materials`, "rule", 108, 54, "$34k-54k", 54, 28),
        act("Queue Pack for Specialist Review", `${ENABLE} › Customer Materials`, "rule", 100, 44, "$27k-42k", 42, 26),
      ],
      populations: [
        { role: "Inside Product Specialist", pct: "36%" },
        { role: "Renewals Sales Rep", pct: "28%" },
        { role: "Enablement Specialist", pct: "22%" },
        { role: "SRS Rep", pct: "9%" },
      ],
    },
  },
  {
    id: "auto-capture",
    name: "Auto-capture sales activity and account intelligence",
    cat: "rule",
    activities: 2,
    impact: "$99k-156k",
    impactHigh: 156,
    feasibility: 89,
    wave: 1,
    details: {
      summary: "Sales activity is captured from the desktop and written into the account record automatically.",
      hours: "218",
      recoverable: "90%",
      people: "12",
      tech: "84",
      automation: "86",
      activities: [
        act("Capture Sales Activity from the Desktop", `${RENEWAL} › Account Intelligence`, "rule", 122, 93, "$56k-88k", 88, 91),
        act("Update Account Intelligence in CRM", `${RENEWAL} › Account Intelligence`, "rule", 96, 86, "$43k-68k", 68, 87),
      ],
      populations: [
        { role: "Renewals Sales Rep", pct: "51%" },
        { role: "SRS Rep", pct: "22%" },
        { role: "Sales Operations Analyst", pct: "16%" },
        { role: "Inside Product Specialist", pct: "8%" },
      ],
    },
  },
  {
    id: "triage",
    name: "AI triage, escalation and adherence checks",
    cat: "hybrid",
    activities: 3,
    impact: "$74k-117k",
    impactHigh: 117,
    feasibility: 42,
    wave: 2,
    details: {
      summary: "Inbound cases are triaged, an escalation path is suggested, and adherence is checked before a human confirms.",
      hours: "246",
      recoverable: "58%",
      people: "26",
      tech: "48",
      automation: "41",
      activities: [
        act("Triage Inbound Cases by Type and Urgency", `${QOF} › Case Management`, "hybrid", 98, 64, "$30k-48k", 48, 44),
        act("Suggest Escalation Path for Exceptions", `${QOF} › Case Management`, "hybrid", 82, 56, "$24k-38k", 38, 42),
        act("Check Adherence Against Playbook", `${QOF} › Case Management`, "hybrid", 66, 52, "$20k-31k", 31, 40),
      ],
      populations: [
        { role: "SRS Rep", pct: "34%" },
        { role: "Renewals Sales Rep", pct: "29%" },
        { role: "Inside Product Specialist", pct: "21%" },
        { role: "Outsourced Services Provider", pct: "11%" },
      ],
    },
  },
  {
    id: "auto-close",
    name: "Auto-close inquiry cases and provision tool access",
    cat: "rule",
    activities: 2,
    impact: "$64k-100k",
    impactHigh: 100,
    feasibility: 80,
    wave: 1,
    details: {
      summary: "Standard inquiry cases are closed by rule and tool access is provisioned without a ticket queue.",
      hours: "176",
      recoverable: "86%",
      people: "11",
      tech: "78",
      automation: "74",
      activities: [
        act("Auto-Close Standard Inquiry Cases", `${QOF} › Case Management`, "rule", 102, 90, "$38k-60k", 60, 82),
        act("Provision Tool Access from Approved Request", `${ENABLE} › Access Provisioning`, "rule", 74, 81, "$26k-40k", 40, 78),
      ],
      populations: [
        { role: "SRS Rep", pct: "39%" },
        { role: "Inside Product Specialist", pct: "26%" },
        { role: "Sales Operations Analyst", pct: "20%" },
        { role: "Renewals Sales Rep", pct: "12%" },
      ],
    },
  },
  {
    id: "generate-order",
    name: "Generate the order from the approved quote",
    cat: "collapse",
    activities: 1,
    impact: "$50-79k",
    impactHigh: 79,
    feasibility: 77,
    wave: 1,
    details: {
      summary: "Once a quote is approved, the order is generated directly from it — no re-entry into a second system.",
      hours: "94",
      recoverable: "94%",
      people: "8",
      tech: "81",
      automation: "80",
      activities: [
        act("Generate Order from the Approved Quote", `${QOF} › Order Entry & Validation`, "collapse", 94, 94, "$50k-79k", 79, 77),
      ],
      populations: [
        { role: "Order Management Specialist", pct: "46%" },
        { role: "Renewals Sales Rep", pct: "28%" },
        { role: "SRS Rep", pct: "14%" },
        { role: "Inside Product Specialist", pct: "8%" },
      ],
    },
  },
  {
    id: "enablement",
    name: "Co-pilot for enablement and process documentation",
    cat: "human",
    activities: 5,
    impact: "$39k-62k",
    impactHigh: 62,
    feasibility: 18,
    wave: 3,
    details: {
      summary: "A co-pilot drafts enablement notes and playbook steps; the owner reviews, publishes, and tracks questions.",
      hours: "210",
      recoverable: "28%",
      people: "14",
      tech: "24",
      automation: "16",
      activities: [
        act("Draft Enablement Notes from Observed Work", `${ENABLE} › Playbook Authoring`, "human", 52, 32, "$10k-16k", 16, 20),
        act("Capture Process Steps for the Playbook", `${ENABLE} › Playbook Authoring`, "human", 48, 30, "$9k-14k", 14, 18),
        act("Review Draft with Process Owner", `${ENABLE} › Playbook Authoring`, "human", 42, 26, "$8k-12k", 12, 17),
        act("Publish Playbook to the Team", `${ENABLE} › Playbook Authoring`, "human", 36, 24, "$7k-11k", 11, 18),
        act("Track Adoption Questions", `${ENABLE} › Playbook Authoring`, "human", 32, 22, "$5k-9k", 9, 16),
      ],
      populations: [
        { role: "Enablement Specialist", pct: "41%" },
        { role: "Inside Product Specialist", pct: "24%" },
        { role: "Renewals Sales Rep", pct: "18%" },
        { role: "SRS Rep", pct: "10%" },
      ],
    },
  },
];

const WAVES: {
  wave: Wave;
  title: string;
  opportunity: string;
  count: number;
  feasibility: string;
  items: { id: string; name: string; cat: Cat; activities: number; impact: string }[];
}[] = [
  {
    wave: 1,
    title: "Wave 1 - Ready Now",
    opportunity: "$1.03M-1.63M",
    count: 8,
    feasibility: "60+",
    items: [
      { id: "sync", name: "Sync pipeline and account records from source systems", cat: "collapse", activities: 4, impact: "$201k-318k" },
      { id: "order-entry", name: "Rules-based order entry and billing validation", cat: "rule", activities: 3, impact: "$191k-302k" },
      { id: "reporting", name: "Agent-run reporting, dashboards and forecasting", cat: "agents", activities: 3, impact: "$166k-263k" },
      { id: "renewal-list", name: "Detect expiring contracts and rank the renewal list", cat: "rule", activities: 2, impact: "$155k-245k" },
      { id: "quote-delivery", name: "Agent-run quote delivery and order tracking", cat: "agents", activities: 2, impact: "$108k-171k" },
      { id: "auto-capture", name: "Auto-capture sales activity and account intelligence", cat: "collapse", activities: 2, impact: "$99k-156k" },
      { id: "auto-close", name: "Auto-close inquiry cases and provision tool access", cat: "rule", activities: 2, impact: "$64k-100k" },
      { id: "generate-order", name: "Generate the order from the approved quote", cat: "collapse", activities: 1, impact: "$50k-79k" },
    ],
  },
  {
    wave: 2,
    title: "Wave 2",
    opportunity: "$321k-507k",
    count: 3,
    feasibility: "35-59",
    items: [
      { id: "renewal-signals", name: "AI-scored renewal signals and outreach", cat: "hybrid", activities: 5, impact: "$137k-216k" },
      { id: "market", name: "Agent-run market monitoring and value summaries", cat: "agents", activities: 2, impact: "$110k-173k" },
      { id: "triage", name: "AI triage, escalation and adherence checks", cat: "hybrid", activities: 3, impact: "$74k-117k" },
    ],
  },
  {
    wave: 3,
    title: "Wave 3",
    opportunity: "$479k-757k",
    count: 4,
    feasibility: "< 35",
    items: [
      { id: "quoting", name: "AI-drafted quoting and order approval", cat: "hybrid", activities: 4, impact: "$212k-336k" },
      { id: "presales", name: "Co-pilot for technical pre-sales and risk", cat: "human", activities: 10, impact: "$125k-198k" },
      { id: "docs", name: "AI-drafted customer documentation and materials", cat: "hybrid", activities: 3, impact: "$103k-162k" },
      { id: "enablement", name: "Co-pilot for enablement and process documentation", cat: "human", activities: 5, impact: "$39k-62k" },
    ],
  },
];

const BUBBLES: { id: string; x: number; y: number; size: number }[] = [
  { id: "sync", x: 0, y: 0, size: 98 },
  { id: "order-entry", x: 62, y: 132, size: 76 },
  { id: "reporting", x: 142, y: 74, size: 66 },
  { id: "renewal-list", x: 220, y: 15, size: 60 },
  { id: "renewal-signals", x: 514, y: 59, size: 70 },
  { id: "quoting", x: 1052, y: 148, size: 108 },
  { id: "docs", x: 1285, y: 118, size: 66 },
  { id: "enablement", x: 1365, y: 222, size: 42 },
  { id: "presales", x: 1176, y: 12, size: 78 },
  { id: "market", x: 674, y: 126, size: 60 },
  { id: "triage", x: 867, y: 143, size: 52 },
  { id: "quote-delivery", x: 262, y: 218, size: 48 },
  { id: "auto-capture", x: 329, y: 190, size: 44 },
  { id: "generate-order", x: 384, y: 245, size: 30 },
  { id: "auto-close", x: 425, y: 231, size: 20 },
];

const CHART_W = 1684;
const CHART_H = 460;
const PLOT_X = 157;
const PLOT_Y = 50;

function sortValue(item: Intervention, key: SortKey): number | string {
  if (key === "category") return CAT_META[item.cat].label;
  if (key === "activities") return item.activities;
  if (key === "impact") return item.impactHigh;
  if (key === "feasibility") return item.feasibility;
  return item.wave;
}

function actSortValue(row: ActivityRow, key: ActSortKey): number | string {
  if (key === "category") return CAT_META[row.cat].label;
  if (key === "hours") return row.hours;
  if (key === "recoverable") return row.recoverable;
  if (key === "impact") return row.impactHigh;
  return row.feasibility;
}

function impactPhrase(impact: string) {
  return impact.replace("-", " – $").replace("$$", "$");
}

function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: K;
  sort: { key: K; dir: SortDir };
  onSort: (key: K, dir?: SortDir) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <div className="cs-table__sortable">
      <button className="cs-table__sort-label" type="button" onClick={() => onSort(sortKey)}>
        {label}
      </button>
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

function CatPill({ cat }: { cat: Cat }) {
  return <span className={`now-badge ${CAT_META[cat].badge}`}>{CAT_META[cat].label}</span>;
}

function WavePill({ wave }: { wave: Wave }) {
  return <span className={`now-badge rm-wave rm-wave--${wave}`}>Wave {wave}</span>;
}

function Feasibility({ value }: { value: number }) {
  return (
    <div className="rm-feas">
      <span>{value}</span>
      <span className="ts-meter rm-meter" aria-hidden="true">
        <span className="ts-meter__fill" style={{ width: `${value}%` }} />
      </span>
    </div>
  );
}

function Factor({ value, label, result = false }: { value: string; label: string; result?: boolean }) {
  return (
    <div className={`rm-how__factor${result ? " rm-how__factor--result" : ""}`}>
      <p className="rm-how__factor-value">{value}</p>
      <p className="rm-how__factor-label">{label}</p>
    </div>
  );
}

function InterventionExpand({ item }: { item: Intervention }) {
  const [sort, setSort] = useState<ActSortState>({ key: "impact", dir: "desc" });
  const { details } = item;
  const count = details.activities.length;
  const activities = useMemo(() => {
    const copy = [...details.activities];
    copy.sort((a, b) => {
      const av = actSortValue(a, sort.key);
      const bv = actSortValue(b, sort.key);
      const cmp = typeof av === "string" ? av.localeCompare(String(bv)) : Number(av) - Number(bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [details.activities, sort]);

  function changeSort(key: ActSortKey, dir?: SortDir) {
    setSort((current) => {
      if (dir) return { key, dir };
      if (current.key === key) return { key, dir: current.dir === "desc" ? "asc" : "desc" };
      return { key, dir: key === "category" ? "asc" : "desc" };
    });
  }

  return (
    <div className="rm-how">
      <p className="rm-how__summary">{details.summary}</p>
      <div className="rm-how__cards">
        <article className="rm-how__card">
          <div className="rm-how__card-head">
            <p className="rm-how__card-title">How we got the Impact</p>
            <p>Observed hours × Recoverable % × Loaded rate</p>
          </div>
          <div className="rm-how__factors">
            <Factor value={details.hours} label="Annualised hrs" />
            <span className="rm-how__op">x</span>
            <Factor value={details.recoverable} label="Recoverable cost" />
            <span className="rm-how__op">=</span>
            <Factor value={item.impact} label="Impact" result />
          </div>
        </article>
        <article className="rm-how__card">
          <div className="rm-how__card-head">
            <p className="rm-how__card-title">How we got the Feasibility</p>
            <p>
              People<sup className="rm-how__exp">0.2</sup>
              {" × Tech"}
              <sup className="rm-how__exp">0.3</sup>
              {" × Automation potential"}
              <sup className="rm-how__exp">0.5</sup>
            </p>
          </div>
          <div className="rm-how__factors">
            <Factor value={details.people} label="Participants" />
            <Factor value={details.tech} label="Tech" />
            <Factor value={details.automation} label="Automation" />
            <span className="rm-how__op">=</span>
            <Factor value={String(item.feasibility)} label="Feasibility" result />
          </div>
        </article>
      </div>
      <div className="rm-how__acts">
        <p className="rm-how__section-title">
          The {count} {count === 1 ? "activity" : "activities"} this intervention covers — they add up to {impactPhrase(item.impact)}
        </p>
        <div className="rm-how__acts-table">
          <div className="rm-how__acts-head">
            <div className="rm-how__acts-cell">Activity</div>
            <div className="rm-how__acts-cell">
              <SortHeader label="Intervention Category" sortKey="category" sort={sort} onSort={changeSort} />
            </div>
            <div className="rm-how__acts-cell">
              <SortHeader label="Hours" sortKey="hours" sort={sort} onSort={changeSort} />
            </div>
            <div className="rm-how__acts-cell">
              <SortHeader label="Recoverable" sortKey="recoverable" sort={sort} onSort={changeSort} />
            </div>
            <div className="rm-how__acts-cell">
              <SortHeader label="Impact $/yr" sortKey="impact" sort={sort} onSort={changeSort} />
            </div>
            <div className="rm-how__acts-cell">
              <SortHeader label="Feasibility" sortKey="feasibility" sort={sort} onSort={changeSort} />
            </div>
          </div>
          {activities.map((row) => (
            <div className="rm-how__acts-row" key={row.name}>
              <div className="rm-how__acts-cell">
                <div className="rm-act">
                  <p className="rm-act__name">{row.name}</p>
                  <p className="rm-act__path">{row.path}</p>
                </div>
              </div>
              <div className="rm-how__acts-cell">
                <CatPill cat={row.cat} />
              </div>
              <div className="rm-how__acts-cell">{row.hours}</div>
              <div className="rm-how__acts-cell">{row.recoverable}%</div>
              <div className="rm-how__acts-cell">{row.impact}</div>
              <div className="rm-how__acts-cell">
                <Feasibility value={row.feasibility} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rm-how__pops">
        <p className="rm-how__section-title">Populations affected</p>
        <div className="rm-how__pills">
          {details.populations.map((pop) => (
            <div className="rm-how__pill" key={pop.role}>
              <span>{pop.role}</span>
              <span>{pop.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RoadmapPage() {
  const [posture, setPosture] = useState<(typeof POSTURES)[number]>("Moderate");
  const [how, setHow] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: "impact", dir: "desc" });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const copy = [...INTERVENTIONS];
    copy.sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      const cmp = typeof av === "string" ? av.localeCompare(String(bv)) : Number(av) - Number(bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [sort]);

  const shown = sorted.slice(0, visible);
  const remaining = Math.max(0, sorted.length - visible);

  function changeSort(key: SortKey, dir?: SortDir) {
    setSort((current) => {
      if (dir) return { key, dir };
      if (current.key === key) return { key, dir: current.dir === "desc" ? "asc" : "desc" };
      return { key, dir: key === "category" ? "asc" : "desc" };
    });
  }

  function openDetails(id: string) {
    setExpanded((current) => (current === id ? null : id));
    if (visible < INTERVENTIONS.length && !shown.some((item) => item.id === id)) {
      setVisible(INTERVENTIONS.length);
    }
    window.requestAnimationFrame(() => {
      document.getElementById(`rm-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div className="stack-32 rm">
      <div className="page-title">
        <img className="icon" src={iconRoadmap} width={24} height={24} alt="" />
        <h1>Roadmap</h1>
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

      <div className="cs-kpis now-kpis">
        <article className="cs-kpi">
          <p className="cs-kpi__label">Total Capacity Recovery Opportunity</p>
          <p className="cs-kpi__value">$125M-150M</p>
          <button className="pv-know" type="button" onClick={() => setHow((open) => !open)}>
            How we know
            <img className="icon" src={iconChevronDownBlue} width={20} height={20} alt="" />
          </button>
        </article>
        <article className="cs-kpi">
          <p className="cs-kpi__label">Recovery Opportunity of Wave 1</p>
          <p className="cs-kpi__value">$9M-11M</p>
          <span className="cs-kpi__meta">&nbsp;</span>
        </article>
        <article className="cs-kpi">
          <p className="cs-kpi__label">Avg. Time Recoverable</p>
          <p className="cs-kpi__value">4-5 hrs/wk</p>
          <span className="cs-kpi__meta">&nbsp;</span>
        </article>
      </div>

      {how ? (
        <div className="ts-how">
          <img className="icon" src={iconSparkle} width={16} height={16} alt="" />
          <div>
            <p className="ts-how__title">How we got $125M-150M</p>
            <p>
              Recoverable minutes at the selected posture ({posture}) × fully-loaded labour rate, annualised. Recovery
              rate is the share of each activity&apos;s observed time that can move off humans at this posture —
              rule-based work recovers ~100%, AI-with-human-in-loop recovers 30–85%, and human-only work recovers 0%.
            </p>
            <p className="ts-how__note">Based on 12.6M observed hours · {posture} posture · Gross recoverable capacity before AI build and change costs</p>
          </div>
          <button className="how-panel__close" type="button" aria-label="Close" onClick={() => setHow(false)}>
            <img className="icon" src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>
      ) : null}

      <section className="card cs-chart rm-map">
        <div className="cs-chart__header">
          <div>
            <div className="cs-chart__title-row">
              <h2>Opportunity Map</h2>
              <img className="icon" src={iconInfo} width={20} height={20} alt="" />
            </div>
            <p>Grouped by interventions · Click any bubble for details</p>
          </div>
          <div className="cs-chart__controls">
            <ExportButton />
          </div>
        </div>
        <div className="rm-map__chart">
          <img src={opportunityMap} width={1684} height={460} alt="Opportunity map of interventions by feasibility and recoverable impact" />
          {BUBBLES.map((bubble) => {
            const item = INTERVENTIONS.find((row) => row.id === bubble.id);
            if (!item) return null;
            return (
              <button
                key={bubble.id}
                type="button"
                className="rm-map__hit"
                style={{
                  left: `${((PLOT_X + bubble.x) / CHART_W) * 100}%`,
                  top: `${((PLOT_Y + bubble.y) / CHART_H) * 100}%`,
                  width: `${(bubble.size / CHART_W) * 100}%`,
                  height: `${(bubble.size / CHART_H) * 100}%`,
                }}
                aria-label={`${item.name}. ${CAT_META[item.cat].label}. Recoverable opportunity ${item.impact}`}
                onClick={() => openDetails(item.id)}
              />
            );
          })}
        </div>
        <div className="cs-legend">
          {LEGEND.map((key) => (
            <div className="cs-legend__item" key={key}>
              <img className="icon" src={CAT_META[key].dot} width={14} height={14} alt="" />
              {CAT_META[key].label}
            </div>
          ))}
        </div>
      </section>

      <div className="rm-waves">
        <div className="rm-waves__inner">
          {WAVES.map((card) => (
            <section className="card rm-wave-card" key={card.wave}>
              <h2>{card.title}</h2>
              <div className="rm-wave-card__stats">
                <div>
                  <p className="rm-wave-card__value">{card.opportunity}</p>
                  <p className="rm-wave-card__label">Recoverable Opportunity</p>
                </div>
                <div>
                  <p className="rm-wave-card__value">{card.count}</p>
                  <p className="rm-wave-card__label">Interventions</p>
                </div>
                <div>
                  <p className="rm-wave-card__value">{card.feasibility}</p>
                  <p className="rm-wave-card__label">Feasibility</p>
                </div>
              </div>
              <div className="rm-wave-card__list">
                {card.items.map((item, index) => (
                  <button
                    className={`rm-wave-item${index === card.items.length - 1 ? " rm-wave-item--last" : ""}`}
                    type="button"
                    key={item.id}
                    onClick={() => openDetails(item.id)}
                  >
                    <div className="rm-wave-item__body">
                      <p className="rm-wave-item__name">{item.name}</p>
                      <div className="rm-wave-item__meta">
                        <CatPill cat={item.cat} />
                        <span className="rm-wave-item__count">
                          {item.activities} {item.activities === 1 ? "activity" : "activities"}
                        </span>
                      </div>
                    </div>
                    <p className="rm-wave-item__impact">{item.impact}</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="card cs-chart rm-details">
        <div className="cs-chart__header">
          <div>
            <div className="cs-chart__title-row">
              <h2>Intervention Details</h2>
              <img className="icon" src={iconInfo} width={20} height={20} alt="" />
            </div>
            <p>Showing all interventions · Click any row for more details</p>
          </div>
          <div className="cs-chart__controls">
            <ExportButton />
          </div>
        </div>
        <div className="now-grid rm-int">
          <div className="now-grid__head">
            <div className="now-grid__group now-grid__group--head">
              <img className="icon now-grid__lead" src={iconExpand} width={20} height={20} alt="" />
              <div className="now-grid__group-cell">Intervention</div>
            </div>
            <div className="now-grid__cell">
              <SortHeader label="Intervention Category" sortKey="category" sort={sort} onSort={changeSort} />
            </div>
            <div className="now-grid__cell">
              <SortHeader label="Activities" sortKey="activities" sort={sort} onSort={changeSort} />
            </div>
            <div className="now-grid__cell">
              <SortHeader label="Impact $/yr" sortKey="impact" sort={sort} onSort={changeSort} />
            </div>
            <div className="now-grid__cell">
              <SortHeader label="Feasibility" sortKey="feasibility" sort={sort} onSort={changeSort} />
            </div>
            <div className="now-grid__cell">
              <SortHeader label="Wave" sortKey="wave" sort={sort} onSort={changeSort} />
            </div>
          </div>
          {shown.map((item) => {
            const isOpen = expanded === item.id;
            return (
              <div className="rm-int__block" key={item.id}>
                <button
                  className="now-grid__row rm-int__row"
                  type="button"
                  id={`rm-row-${item.id}`}
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                >
                  <div className="now-grid__group">
                    <img className={`icon now-grid__lead cs-expand${isOpen ? " cs-expand--open" : ""}`} src={iconExpand} width={20} height={20} alt="" />
                    <div className="now-grid__group-cell">
                      <span className="now-grid__label">{item.name}</span>
                    </div>
                  </div>
                  <div className="now-grid__cell">
                    <CatPill cat={item.cat} />
                  </div>
                  <div className="now-grid__cell">{item.activities}</div>
                  <div className="now-grid__cell">{item.impact}</div>
                  <div className="now-grid__cell">
                    <Feasibility value={item.feasibility} />
                  </div>
                  <div className="now-grid__cell">
                    <WavePill wave={item.wave} />
                  </div>
                </button>
                {isOpen ? <InterventionExpand item={item} /> : null}
              </div>
            );
          })}
          {sorted.length > PAGE_SIZE ? (
            <div className="now-grid__row rm-int__more">
              <div className="now-grid__group">
                <span className="now-grid__lead" />
                <div className="now-grid__group-cell">
                  {visible > PAGE_SIZE ? (
                    <button className="btn-more" type="button" onClick={() => setVisible(PAGE_SIZE)}>
                      <img className="icon" src={iconMinus} width={16} height={16} alt="" />
                      Show less
                    </button>
                  ) : (
                    <button className="btn-more" type="button" onClick={() => setVisible(sorted.length)}>
                      <img className="icon" src={iconAdd} width={16} height={16} alt="" />
                      Show {remaining} more
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
