import { useState } from "react";
import iconSummary from "../assets/icons/icon-summary.svg";

const POSTURES = ["Aggressive", "Moderate", "Conservative"] as const;

export function PageHeader() {
  const [posture, setPosture] = useState<(typeof POSTURES)[number]>("Moderate");

  return (
    <div className="stack-32">
      <div className="page-title">
        <img className="icon" src={iconSummary} width={24} height={24} alt="" />
        <h1>Executive Summary</h1>
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
    </div>
  );
}
