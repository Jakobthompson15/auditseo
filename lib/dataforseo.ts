import "server-only";

const BASE = "https://api.dataforseo.com";

function authHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN ?? "";
  const password = process.env.DATAFORSEO_PASSWORD ?? "";
  if (!login || !password) {
    throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD env vars must be set");
  }
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

export async function dfsPost<T = unknown>(
  path: string,
  body: unknown[]
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DataForSEO HTTP ${res.status} on ${path}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    tasks?: Array<{
      status_code: number;
      status_message: string;
      result: unknown;
    }>;
  };

  const task = json.tasks?.[0];
  if (!task) throw new Error(`No task in DataForSEO response: ${path}`);
  if (task.status_code !== 20000) {
    throw new Error(`DataForSEO [${task.status_code}]: ${task.status_message}`);
  }

  return (task.result ?? []) as T;
}
