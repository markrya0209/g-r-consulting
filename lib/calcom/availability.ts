const CALCOM_BASE = "https://api.cal.com/v1";

async function calFetch(path: string) {
  const res = await fetch(`${CALCOM_BASE}${path}`, {
    headers: { Authorization: `Bearer ${process.env.CALCOM_API_KEY}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Cal.com ${res.status}`);
  return res.json();
}

export async function getNextAvailableSlots(
  eventTypeId: string,
  count = 3
): Promise<{ start: string; end: string }[]> {
  const from = new Date().toISOString().split("T")[0];
  const to = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

  const data = await calFetch(
    `/slots?eventTypeId=${eventTypeId}&startTime=${from}&endTime=${to}`
  );

  const slots: { start: string; end: string }[] = [];
  for (const daySlots of Object.values(data.slots as Record<string, { time: string }[]>)) {
    for (const s of daySlots) {
      slots.push({ start: s.time, end: s.time });
      if (slots.length >= count) return slots;
    }
  }
  return slots;
}
