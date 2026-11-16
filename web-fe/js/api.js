import { API_BASE } from "./config.js";

export async function callStep(stepId, source) {
  const response = await fetch(`${API_BASE}/api/${stepId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source }),
  });
  return { status: response.status, body: await response.json() };
}
