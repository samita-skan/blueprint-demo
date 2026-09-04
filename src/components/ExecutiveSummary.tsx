import { PageHeader } from "./PageHeader";
import { HeroBanner } from "./HeroBanner";
import { StateCards } from "./StateCards";
import { RoadmapCard } from "./RoadmapCard";
import type { PageId } from "./LeftNavbar";

export function ExecutiveSummary({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <>
      <PageHeader />
      <div className="stack-32">
        <HeroBanner />
        <StateCards onNavigate={onNavigate} />
        <RoadmapCard onNavigate={onNavigate} />
      </div>
    </>
  );
}
