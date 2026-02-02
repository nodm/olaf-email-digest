import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { parseArgs } from "node:util";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
];

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

// Parse --account flag
const { values } = parseArgs({
  options: {
    account: { type: "string", short: "a" },
  },
});

const accountName = values.account;
if (!accountName) {
  console.error("Usage: npm run auth -- --account=<name>");
  console.error("Example: npm run auth -- --account=personal");
  process.exit(1);
}

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET in .env");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log(`Authorizing account "${accountName}"...\n`);
console.log("Opening browser for authorization...\n");
console.log("If browser doesn't open, visit:\n");
console.log(authUrl);
console.log("\n");

// Open browser (cross-platform) using execFile for safety
const openCmd =
  process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
      ? "cmd"
      : "xdg-open";

const args =
  process.platform === "win32" ? ["/c", "start", "", authUrl] : [authUrl];

execFile(openCmd, args, (err) => {
  if (err) {
    console.log(
      "Could not open browser automatically. Please visit the URL above.\n",
    );
  }
});

// Start local server to receive callback
const server = createServer(async (req, res) => {
  if (!req.url?.startsWith("/callback")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400);
    res.end("Missing authorization code");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<h1>Authorization successful!</h1><p>You can close this window.</p>",
    );

    const envVar = `GMAIL_REFRESH_TOKEN_${accountName.toUpperCase()}`;
    console.log(`Authorization successful for account "${accountName}"!\n`);
    console.log("Add this to your .env file:\n");
    console.log(`${envVar}=${tokens.refresh_token}`);
    console.log("");

    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500);
    res.end("Failed to exchange code for tokens");
    console.error("Token exchange failed:", err);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(
    `Waiting for callback on http://localhost:${PORT}/callback ...\n`,
  );
});
