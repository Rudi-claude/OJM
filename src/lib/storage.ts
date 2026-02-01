const ANONYMOUS_ID_KEY = "ojm_anonymous_id";

export function getAnonymousId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ANONYMOUS_ID_KEY);
}

export function setAnonymousId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANONYMOUS_ID_KEY, id);
}

export function removeAnonymousId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ANONYMOUS_ID_KEY);
}

export function generateAnonymousId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}
