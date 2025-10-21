import { createRoot } from "react-dom/client";
import "./lib/i18n"; // Initialize i18n first
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
