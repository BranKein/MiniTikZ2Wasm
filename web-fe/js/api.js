import { API_BASE } from "./config.js";

export async function callStep(step, { input }) {
  const response = await fetch(`${API_BASE}${step.url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  return { status: response.status, body: await response.json() };
}
