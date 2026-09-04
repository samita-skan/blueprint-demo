import iconCurrentState from "../assets/icons/icon-current-state.svg";
import iconFocus from "../assets/icons/icon-focus.svg";
import iconArrowForward from "../assets/icons/icon-arrow-forward.svg";
import { ExploreButton } from "./ExploreButton";
import type { PageId } from "./LeftNavbar";

type Segment = { color: string; flex: number };
type LegendEntry = { color: string; label: string };

function SegmentedBar({ segments }: { segments: Segment[] }) {
  return (
    <div className="segmented-bar">
      {segments.map((segment, index) => (
        <div
          key={`${segment.color}-${index}`}
          className="segmented-bar__seg"
          style={{ flexGrow: segment.flex, flexShrink: 0, flexBasis: 0, background: segment.color }}
        />
      ))}
    </div>
  );
}

function Legend({ items }: { items: LegendEntry[] }) {
  return (
    <div className="legend">
      {items.map((item) => (
        <div className="legend-item" key={item.label}>
          <span className="legend-item__swatch" style={{ background: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

const CURRENT_SEGMENTS: Segment[] = [
  { color: "var(--now-execution)", flex: 269 },
  { color: "var(--now-comprehension)", flex: 142 },
  { color: "var(--now-creation)", flex: 166 },
  { color: "var(--now-decision)", flex: 148 },
  { color: "var(--now-communication)", flex: 45 },
];

const TARGET_SEGMENTS: Segment[] = [
  { color: "var(--end-collapse)", flex: 55 },
  { color: "var(--end-rule)", flex: 146 },
  { color: "var(--end-agents)", flex: 244 },
  { color: "var(--end-hybrid)", flex: 155 },
  { color: "var(--end-human)", flex: 170 },
];

const CURRENT_LEGEND: LegendEntry[] = [
  { color: "var(--now-execution)", label: "Execution 24% " },
  { color: "var(--now-comprehension)", label: "Comprehension 29% " },
  { color: "var(--now-creation)", label: "Creation 11% " },
  { color: "var(--now-decision)", label: "Decision 29% " },
  { color: "var(--now-communication)", label: "Communication 7% " },
];

const TARGET_LEGEND: LegendEntry[] = [
  { color: "var(--end-collapse)", label: "Process Collapse 10% " },
  { color: "var(--end-rule)", label: "Rule-based Automation 19% " },
  { color: "var(--end-agents)", label: "Agents 39% " },
  { color: "var(--end-hybrid)", label: "Hybrid (Human + AI) 13% " },
  { color: "var(--end-human)", label: "Human Only 19% " },
];

export function StateCards({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <div className="state-row">
      <section className="card">
        <div className="card-header">
          <div className="card-header__left">
            <div className="card-header__icon">
              <img className="icon" src={iconCurrentState} width={20} height={20} alt="" />
            </div>
            <div className="card-header__titles">
              <h2>Current State</h2>
              <p>Where we are today</p>
            </div>
          </div>
          <ExploreButton onClick={() => onNavigate("current")} />
        </div>
        <div className="metrics-row">
          <div className="metric">
            <p className="metric__value">$1.24B</p>
            <p className="metric__label">Annual Cost</p>
          </div>
          <div className="metric">
            <p className="metric__value">48 hrs/wk</p>
            <p className="metric__label">Avg. Time</p>
          </div>
        </div>
        <div className="chart-block">
          <p className="chart-block__title">How time is spend today</p>
          <SegmentedBar segments={CURRENT_SEGMENTS} />
          <Legend items={CURRENT_LEGEND} />
        </div>
      </section>

      <img className="icon state-arrow" src={iconArrowForward} width={32} height={32} alt="" />

      <section className="card">
        <div className="card-header">
          <div className="card-header__left">
            <div className="card-header__icon">
              <img className="icon" src={iconFocus} width={20} height={20} alt="" />
            </div>
            <div className="card-header__titles">
              <h2>Target State</h2>
              <p>Where we could be</p>
            </div>
          </div>
          <ExploreButton onClick={() => onNavigate("target")} />
        </div>
        <div className="metrics-row">
          <div className="metric">
            <p className="metric__value">$9M-11M</p>
            <p className="metric__label">Annual Recoverable Opportunity</p>
          </div>
          <div className="metric">
            <p className="metric__value">4-5 hrs/wk</p>
            <p className="metric__label">Avg. Time Recoverable</p>
          </div>
        </div>
        <div className="chart-block">
          <p className="chart-block__title">How we envision the future based on AI Posture</p>
          <SegmentedBar segments={TARGET_SEGMENTS} />
          <Legend items={TARGET_LEGEND} />
        </div>
      </section>
    </div>
  );
}
