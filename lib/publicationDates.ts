// Publication timestamps from Nino are UTC, including legacy values without an offset.
export function publicationDate(value: string): Date {
  return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : value + "Z");
}

export function publicationInput(value?: string | null): string {
  if (!value) return "";
  const date = publicationDate(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function publicationPayload(value: string, previous?: string | null): string | null {
  if (!value) return null;
  if (previous && value === publicationInput(previous)) return publicationDate(previous).toISOString();
  return new Date(value).toISOString();
}
