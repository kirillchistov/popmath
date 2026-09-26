export function normalizeAnswer(value: string): string {
  return tokenize(value).join(';');
}

function prepare(value: string): string {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/х/g, 'x')
    .replace(/у/g, 'y')
    .replace(/[−–—]/g, '-')
    .replace(/[°º]/g, '')
    .replace(/≥/g, '>=')
    .replace(/≤|⩽|≦/g, '<=');
}

function tokenize(value: string): string[] {
  let text = prepare(value);
  const intervals: string[] = [];
  text = text.replace(
    /\((\s*-?[\d.,]+)\s*[,;]\s*(-?[\d.,]+)\s*\)/g,
    (_all, left: string, right: string) => {
      const token = `(${left.replace(/,/g, '.').trim()};${right.replace(/,/g, '.').trim()})`;
      intervals.push(token);
      return `__INT${intervals.length - 1}__`;
    },
  );
  text = text
    .replace(/или/g, ';')
    .replace(/(?<=[\dx).])\s*и\s*(?=[-+]?\d)/g, ';')
    .replace(/\band\b/g, ';')
    .replace(/\bor\b/g, ';')
    .replace(/,\s+(?=[-+xy])/g, ';')
    .replace(/[|/]/g, ';');

  return text
    .split(';')
    .map((part) => {
      const marker = part.trim().match(/^__INT(\d+)__$/);
      if (marker) return intervals[Number(marker[1])] ?? '';
      return cleanPart(part);
    })
    .filter(Boolean)
    .sort();
}

function cleanPart(part: string): string {
  return part
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/(\d)\*([xy])/g, '$1$2')
    .replace(/\.+$/g, '')
    .replace(/^[xy]=/, '')
    .replace(/^\++/, '');
}

const INEQ = /^(?:x)?(>=|<=|>|<)(-?\d+(?:\.\d+)?)$/;
const NUMBER = /^-?\d+(?:\.\d+)?$/;

function parseIneq(
  value: string,
): { op: string; num: string } | null {
  const match = value.match(INEQ);
  if (!match) return null;
  return { op: match[1], num: match[2] };
}

function scalarMatch(user: string, expected: string): boolean {
  if (user === expected) return true;
  const userIneq = parseIneq(user);
  const expectedIneq = parseIneq(expected);
  if (userIneq && expectedIneq) {
    return userIneq.op === expectedIneq.op && userIneq.num === expectedIneq.num;
  }
  if (userIneq && NUMBER.test(expected)) {
    return userIneq.num === expected;
  }
  if (expectedIneq && NUMBER.test(user)) {
    return expectedIneq.num === user;
  }
  return false;
}

export function answersMatch(user: string, expected: string): boolean {
  const left = tokenize(user);
  const right = tokenize(expected);
  if (left.length === 0 || right.length === 0) return false;
  if (left.join('|') === right.join('|')) return true;
  if (left.length === 1 && right.length === 1) {
    return scalarMatch(left[0], right[0]);
  }
  return false;
}

export function looksLikeInattention(
  user: string,
  expected: string,
  trapAnswers: string[] = [],
): boolean {
  if (!user.trim()) return false;
  if (trapAnswers.some((trap) => answersMatch(user, trap))) return true;

  const left = tokenize(user);
  const right = tokenize(expected);
  if (left.length !== 1 || right.length !== 1) return false;
  const a = left[0];
  const b = right[0];
  if (!a || !b || a === b) return false;
  if (a === `-${b}` || b === `-${a}`) return true;
  if (a.replace(/[<>]/g, (sign) => (sign === '<' ? '>' : '<')) === b) {
    return true;
  }
  return false;
}
