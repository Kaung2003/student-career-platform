import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env["ANTHROPIC_API_KEY"]);
}

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });
  }
  return client;
}
