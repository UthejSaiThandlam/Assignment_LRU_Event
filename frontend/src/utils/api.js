/**
 * API Fetch Utility with automatic port discovery (8001 / 8000)
 */

let activePort = 8001; // default to 8001 since user's uvicorn is running on 8001

export async function apiFetch(path, options = {}) {
  // Try active port first
  try {
    const res = await fetch(`http://127.0.0.1:${activePort}${path}`, options);
    if (res.ok) return res;
  } catch (err) {
    // If activePort fails, try fallback port
    const fallbackPort = activePort === 8001 ? 8000 : 8001;
    try {
      const res = await fetch(`http://127.0.0.1:${fallbackPort}${path}`, options);
      if (res.ok) {
        activePort = fallbackPort;
        return res;
      }
    } catch (e) {
      console.warn(`Backend unreachable on both ports 8000 and 8001: ${e.message}`);
    }
  }

  // Final direct attempt
  return fetch(`http://127.0.0.1:${activePort}${path}`, options);
}

export function getActivePort() {
  return activePort;
}
