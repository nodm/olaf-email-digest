import { loadConfig } from "./config.js";

const config = loadConfig();
console.log("Config loaded:", {
  label: config.app.label,
  provider: config.ai.provider,
});
