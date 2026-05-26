import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./lib/theme";
import App from "./App";
import "./styles.css";
import * as serviceWorker from "./registerServiceWorker";

const container = document.getElementById("root");
if (!container) throw new Error("Elemento raiz #root não encontrado!");

const root = createRoot(container);

root.render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);

// Registra o Service Worker para suporte PWA em produção
serviceWorker.register();
