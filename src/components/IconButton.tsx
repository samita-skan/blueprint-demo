import iconExport from "../assets/icons/icon-export.svg";
import iconExportBlue from "../assets/icons/icon-export-blue.svg";
import iconGear from "../assets/icons/icon-gear.svg";
import iconGearBlue from "../assets/icons/icon-gear-blue.svg";

function IconButton({
  label,
  restSrc,
  hoverSrc,
  open,
  onClick,
}: {
  label: string;
  restSrc: string;
  hoverSrc: string;
  open?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`icon-btn${open ? " icon-btn--open" : ""}`}
      type="button"
      aria-label={label}
      aria-expanded={onClick ? Boolean(open) : undefined}
      onClick={onClick}
    >
      <span className="link-glyph link-glyph--20" aria-hidden="true">
        <img className="icon link-glyph__rest" src={restSrc} width={20} height={20} alt="" />
        <img className="icon link-glyph__hover" src={hoverSrc} width={20} height={20} alt="" />
      </span>
      <span className="icon-btn__tip">{label}</span>
    </button>
  );
}

export function ExportButton() {
  return <IconButton label="Export" restSrc={iconExport} hoverSrc={iconExportBlue} />;
}

export function SettingsButton({ open, onClick }: { open?: boolean; onClick?: () => void }) {
  return <IconButton label="Settings" restSrc={iconGear} hoverSrc={iconGearBlue} open={open} onClick={onClick} />;
}
