const CALCOM_BASE = "https://api.cal.com/v1";

async function calFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${CALCOM_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Cal.com API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function confirmBooking(calBookingUid: string) {
  return calFetch(`/bookings/${calBookingUid}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "ACCEPTED" }),
  });
}

export async function cancelBooking(calBookingUid: string) {
  return calFetch(`/bookings/${calBookingUid}/cancel`, { method: "DELETE" });
}
