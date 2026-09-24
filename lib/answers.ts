export function normalizeAnswer(value: string): string {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[−–—]/g, '-')
    .replace(/°/g, '');
}

function parts(value: string): string[] {
  return normalizeAnswer(value)
    .split(/[;|/]|или/)
    .map((part) => part.trim())
    .filter(Boolean)
    .sort();
}

export function answersMatch(user: string, expected: string): boolean {
  const left = normalizeAnswer(user);
  const right = normalizeAnswer(expected);
  if (!left || !right) return false;
  if (left === right) return true;
  return parts(left).join('|') === parts(right).join('|');
}
