import React from "react";
import ReactDOM from "react-dom/client";
import AppRoot from "./app/AppRoot";
import "./app/styles.css";
import "./marketing/tokens.css";
import "./marketing/landing.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
