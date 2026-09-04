import { useEffect, useRef, useState } from "react";
import iconClose from "../assets/icons/icon-close.svg";
import { ExportButton, SettingsButton } from "./IconButton";

export type ThresholdBand = { high: number; low: number };

type Variant = "workstation" | "apps";

const DEFAULTS: Record<Variant, ThresholdBand> = {
  workstation: { high: 8, low: 6 },
  apps: { high: 4, low: 1 },
};

const COPY: Record<
  Variant,
  {
    title: string;
    description: string;
    rows: { label: string; color: string; kind: "high" | "mid" | "low" }[];
  }
> = {
  workstation: {
    title: "Workstation Thresholds",
    description: "Set the hours-per-day boundaries between over-used, healthy, and under-used.",
    rows: [
      { label: "Over-used", color: "var(--ws-over)", kind: "high" },
      { label: "Healthy", color: "var(--ws-healthy)", kind: "mid" },
      { label: "Under-used", color: "var(--ws-under)", kind: "low" },
    ],
  },
  apps: {
    title: "Usage band thresholds",
    description: "Set the hours-per-day boundaries between high, moderate, and low app usage.",
    rows: [
      { label: "High", color: "var(--app-high)", kind: "high" },
      { label: "Moderate", color: "var(--app-mod)", kind: "mid" },
      { label: "Low", color: "var(--app-low)", kind: "low" },
    ],
  },
};

function formatHours(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

export function ChartTools({
  variant,
  value,
  onApply,
}: {
  variant: Variant;
  value: ThresholdBand;
  onApply: (next: ThresholdBand) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="chart-tools">
      <div className="threshold-wrap" ref={wrapRef}>
        <SettingsButton open={open} onClick={() => setOpen((current) => !current)} />
        {open ? (
          <ThresholdPanel
            variant={variant}
            value={value}
            onClose={() => setOpen(false)}
            onApply={(next) => {
              onApply(next);
              setOpen(false);
            }}
          />
        ) : null}
      </div>
      <ExportButton />
    </div>
  );
}

function ThresholdPanel({
  variant,
  value,
  onClose,
  onApply,
}: {
  variant: Variant;
  value: ThresholdBand;
  onClose: () => void;
  onApply: (next: ThresholdBand) => void;
}) {
  const copy = COPY[variant];
  const defaults = DEFAULTS[variant];
  const [high, setHigh] = useState(String(value.high));
  const [low, setLow] = useState(String(value.low));

  const highN = Number(high);
  const lowN = Number(low);
  const midLabel =
    Number.isFinite(highN) && Number.isFinite(lowN) ? `${formatHours(lowN)}-${formatHours(highN)}` : "–";

  function commit() {
    const nextHigh = Number(high);
    const nextLow = Number(low);
    if (!Number.isFinite(nextHigh) || !Number.isFinite(nextLow)) return;
    onApply({ high: nextHigh, low: nextLow });
  }

  return (
    <div className="threshold-pop" role="dialog" aria-label={copy.title}>
      <div className="threshold-pop__head">
        <div>
          <p className="threshold-pop__title">{copy.title}</p>
          <p className="threshold-pop__desc">{copy.description}</p>
        </div>
        <button className="threshold-pop__close" type="button" aria-label="Close" onClick={onClose}>
          <img className="icon" src={iconClose} width={20} height={20} alt="" />
        </button>
      </div>
      <div className="threshold-pop__rows">
        {copy.rows.map((row) => (
          <div className="threshold-pop__row" key={row.label}>
            <span className="threshold-pop__legend">
              <span className="cs-legend__dot" style={{ background: row.color }} />
              {row.label}
            </span>
            <span className="threshold-pop__cond">{row.kind === "high" ? "more than" : row.kind === "low" ? "less than" : "between"}</span>
            {row.kind === "mid" ? (
              <span className="threshold-pop__mid">{midLabel}</span>
            ) : (
              <input
                className="threshold-pop__input"
                type="text"
                inputMode="decimal"
                aria-label={`${row.label} hours`}
                value={row.kind === "high" ? high : low}
                onChange={(event) => {
                  const next = event.target.value.replace(/[^0-9.]/g, "");
                  if (row.kind === "high") setHigh(next);
                  else setLow(next);
                }}
              />
            )}
            <span className="threshold-pop__unit">hrs</span>
          </div>
        ))}
      </div>
      <div className="threshold-pop__rule" />
      <div className="threshold-pop__foot">
        <button
          className="threshold-pop__reset"
          type="button"
          onClick={() => {
            setHigh(String(defaults.high));
            setLow(String(defaults.low));
          }}
        >
          Reset
        </button>
        <button className="threshold-pop__apply" type="button" onClick={commit}>
          Apply
        </button>
      </div>
    </div>
  );
}
