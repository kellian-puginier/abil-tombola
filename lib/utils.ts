export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// French phone number: accepts 0X XX XX XX XX with various separators,
// or +33 X XX XX XX XX. Returns the digits-only normalized form
// (e.g. "+33612345678") or null if invalid.
export function normalizeFrenchPhone(input: string): string | null {
  const cleaned = input.replace(/[^\d+]/g, "");
  let match = cleaned.match(/^\+33([1-9]\d{8})$/);
  if (match) return `+33${match[1]}`;
  match = cleaned.match(/^0([1-9]\d{8})$/);
  if (match) return `+33${match[1]}`;
  return null;
}

export function buyerShortLabel(firstName: string, lastName: string, club: string) {
  const initial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : "";
  return `${firstName} ${initial}${club ? ` — ${club}` : ""}`;
}
