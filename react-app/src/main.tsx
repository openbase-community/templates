import { configure$${name_pascal}ApiClient } from "$${api_client_package_name}";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

configure$${name_pascal}ApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL || undefined,
});

const originalError = console.error;
console.error = (...args) => {
  // TODO: Pass error to Openbase
  originalError(...args); // Pass through all other errors
};

createRoot(document.getElementById("root")!).render(<App />);
