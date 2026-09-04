import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { BrandProvider } from "./brand/BrandContext";
import { BrandSwitcher } from "./brand/BrandSwitcher";
import "./index.css";
import "./brand/skan-2026.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrandProvider>
      <div className="root-shell">
        <BrandSwitcher />
        <App />
      </div>
    </BrandProvider>
  </StrictMode>,
);
