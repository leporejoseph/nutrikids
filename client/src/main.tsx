import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add custom CSS variables for theming
document.documentElement.style.setProperty('--primary', '107 70% 52%'); // Deep purple
document.documentElement.style.setProperty('--secondary', '202 68% 50%'); // Thunder blue
document.documentElement.style.setProperty('--accent', '270 67% 88%'); // Light purple
document.documentElement.style.setProperty('--darkBlue', '218 53% 34%');

createRoot(document.getElementById("root")!).render(<App />);
