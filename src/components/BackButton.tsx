import type { ReactNode } from "react";
import iconChevronLeft from "../assets/icons/icon-chevron-left.svg";
import iconChevronLeftBlue from "../assets/icons/icon-chevron-left-blue.svg";

export function BackButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button className="pv-back" type="button" onClick={onClick}>
      <span className="link-glyph link-glyph--20" aria-hidden="true">
        <img className="icon link-glyph__rest" src={iconChevronLeft} width={20} height={20} alt="" />
        <img className="icon link-glyph__hover" src={iconChevronLeftBlue} width={20} height={20} alt="" />
      </span>
      {children}
    </button>
  );
}
