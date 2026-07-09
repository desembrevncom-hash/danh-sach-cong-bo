import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

import { createRoot } from "react-dom/client";
import App from "@/app/App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
