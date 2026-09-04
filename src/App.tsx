import { useEffect, useState } from "react";
import { TopNavbar } from "./components/TopNavbar";
import { LeftNavbar, type PageId } from "./components/LeftNavbar";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { CurrentStatePage } from "./components/CurrentStatePage";
import { TargetStatePage } from "./components/TargetStatePage";
import { RoadmapPage } from "./components/RoadmapPage";

export default function App() {
  const [page, setPage] = useState<PageId>("summary");

  useEffect(() => {
    document.querySelector(".main")?.scrollTo(0, 0);
  }, [page]);

  return (
    <div className="app">
      <TopNavbar />
      <div className="app-body">
        <LeftNavbar currentPage={page} onNavigate={setPage} />
        <main className="main">
          {page === "summary" ? <ExecutiveSummary onNavigate={setPage} /> : null}
          {page === "current" ? <CurrentStatePage /> : null}
          {page === "target" ? <TargetStatePage /> : null}
          {page === "roadmap" ? <RoadmapPage /> : null}
        </main>
      </div>
    </div>
  );
}
