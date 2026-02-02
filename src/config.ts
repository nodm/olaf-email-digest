import { z } from "zod";

const configSchema = z.object({
  // Gmail OAuth2
  gmail: z.object({
    clientId: z.string().min(1, "GMAIL_CLIENT_ID required"),
    clientSecret: z.string().min(1, "GMAIL_CLIENT_SECRET required"),
    refreshToken: z.string().min(1, "GMAIL_REFRESH_TOKEN required"),
  }),

  // AI Provider
  ai: z.object({
    provider: z.enum(["anthropic", "openai", "google"]).default("anthropic"),
    anthropicKey: z.string().optional(),
    openaiKey: z.string().optional(),
    googleKey: z.string().optional(),
  }),

  // App config
  app: z.object({
    label: z.string().default("Newsletters"),
    recipient: z.string().default("me"),
  }),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const config = configSchema.parse({
    gmail: {
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
    ai: {
      provider: process.env.AI_PROVIDER,
      anthropicKey: process.env.ANTHROPIC_API_KEY,
      openaiKey: process.env.OPENAI_API_KEY,
      googleKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
    app: {
      label: process.env.GMAIL_LABEL,
      recipient: process.env.DIGEST_RECIPIENT,
    },
  });

  // Validate that the selected provider has an API key
  const { provider } = config.ai;
  if (provider === "anthropic" && !config.ai.anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY required when AI_PROVIDER=anthropic");
  }
  if (provider === "openai" && !config.ai.openaiKey) {
    throw new Error("OPENAI_API_KEY required when AI_PROVIDER=openai");
  }
  if (provider === "google" && !config.ai.googleKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY required when AI_PROVIDER=google",
    );
  }

  return config;
}
