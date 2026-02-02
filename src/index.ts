import { loadConfig } from "./config.js";

const config = loadConfig();
console.log("Config loaded:", {
  accounts: config.gmail.accounts.map((a) => a.name),
  label: config.app.label,
  provider: config.ai.provider,
});
