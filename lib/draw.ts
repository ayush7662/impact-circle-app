export function generateDrawNumbers(): number[] {
  const picks = new Set<number>();
  while (picks.size < 5) {
    picks.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(picks);
}
