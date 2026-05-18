export function toUtcStartOfDayIso(dateInput: string): string {
  return new Date(`${dateInput}T00:00:00.000Z`).toISOString();
}

export function toUtcEndOfDayIso(dateInput: string): string {
  return new Date(`${dateInput}T23:59:59.999Z`).toISOString();
}
