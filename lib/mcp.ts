import Anthropic from "@anthropic-ai/sdk";

export async function callWithMCP(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const mcpServer: {
    type: "url";
    url: string;
    name: string;
    authorization_token?: string;
  } = {
    type: "url",
    url: process.env.DATAFORSEO_MCP_URL ?? "https://mcp.dataforseo.com/mcp",
    name: "dataforseo",
  };

  if (process.env.DATAFORSEO_API_TOKEN) {
    mcpServer.authorization_token = process.env.DATAFORSEO_API_TOKEN;
  }

  type CreateFn = (p: unknown) => Promise<Anthropic.Beta.BetaMessage>;
  const createMessage = client.beta.messages.create.bind(
    client.beta.messages
  ) as unknown as CreateFn;

  const response = await createMessage({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    stream: false,
    messages: [{ role: "user", content: prompt }],
    betas: ["mcp-client-2025-04-04"],
    mcp_servers: [mcpServer],
  });

  for (let i = response.content.length - 1; i >= 0; i--) {
    const block = response.content[i];
    if (block.type === "text") return block.text;
  }
  return "";
}
