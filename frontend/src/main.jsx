import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

// Apply saved theme before first render to avoid flash
(function () {
  try {
    const stored = JSON.parse(localStorage.getItem("tymvora-theme") || "{}");
    const t = stored?.state?.theme || "light";
    const resolved = t === "dark" ? "dark" : t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", resolved);
  } catch (_) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
