import iconArrowRight from "../assets/icons/icon-arrow-right.svg";
import iconArrowRightBlue from "../assets/icons/icon-arrow-right-blue.svg";

export function ExploreButton({ onClick }: { onClick?: () => void }) {
  return (
    <button className="btn-explore" type="button" onClick={onClick}>
      Explore
      <span className="link-glyph link-glyph--16" aria-hidden="true">
        <img className="icon link-glyph__rest" src={iconArrowRight} width={16} height={16} alt="" />
        <img className="icon link-glyph__hover" src={iconArrowRightBlue} width={16} height={16} alt="" />
      </span>
    </button>
  );
}
