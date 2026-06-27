export async function isRedisAvailable() {
  try {
    const response = await fetch('http://localhost:8000/dev/ping');
    return response.ok;
  } catch {
    return false;
  }
}

export async function emitSocketEvent(channel, event, data = {}) {
  const response = await fetch('http://localhost:8000/dev/emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, event, data }),
  });
  return response.ok;
}