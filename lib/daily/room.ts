const DAILY_BASE = "https://api.daily.co/v1";

async function dailyFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${DAILY_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Daily.co API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function createRoom(bookingId: string, scheduledAt: Date) {
  // Room expires 2h after scheduled session start
  const expiryTime = Math.floor(scheduledAt.getTime() / 1000) + 2 * 3600;

  const room = await dailyFetch("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name: `session-${bookingId}`,
      properties: {
        exp: expiryTime,
        enable_screenshare: true,
        enable_chat: true,
        max_participants: 2,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  return room.url as string;
}
