import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

import { HelmetProvider } from 'react-helmet-async';
import { createRoot } from "react-dom/client";
import App from "@/app/App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
