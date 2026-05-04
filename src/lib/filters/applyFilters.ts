import type { Camp, FinderFilters } from '../../features/finder/types';

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(camp: Camp, query: string): boolean {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery === '') {
    return true;
  }

  const haystack = [
    camp.name,
    camp.organization,
    camp.type,
    camp.rawType,
    camp.neighborhood,
    camp.address,
    camp.ageRange,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function parseAgeRange(ageRange: string): { min: number; max: number } | null {
  const text = normalizeText(ageRange);

  if (text.includes('adults only')) {
    return { min: 18, max: Number.POSITIVE_INFINITY };
  }

  if (text.includes('mature teens and adults')) {
    return { min: 16, max: Number.POSITIVE_INFINITY };
  }

  if (text.includes('teens and adults')) {
    return { min: 13, max: Number.POSITIVE_INFINITY };
  }

  if (text.includes('teen youth')) {
    return { min: 13, max: 17 };
  }

  if (text.includes('middle- and high-schoolers')) {
    return { min: 11, max: 18 };
  }

  if (
    text === '' ||
    text.includes('all ages') ||
    text.includes('children and young adults') ||
    text === 'youth'
  ) {
    return null;
  }

  const gradeMatch = text.match(/grades?\s+([k\d]+)\s*-\s*([k\d]+)/i);

  if (gradeMatch) {
    return {
      min: gradeTokenToAge(gradeMatch[1]),
      max: gradeTokenToAge(gradeMatch[2]),
    };
  }

  const singleGradeMatch = text.match(/grade\s+([k\d]+)/i);

  if (singleGradeMatch) {
    const age = gradeTokenToAge(singleGradeMatch[1]);
    return { min: age, max: age };
  }

  const plusMatch = text.match(/(\d+(?:\.\d+)?)\s*\+/);

  if (plusMatch) {
    const min = Math.floor(Number(plusMatch[1]));
    return { min, max: Number.POSITIVE_INFINITY };
  }

  const olderMatch = text.match(/(\d+(?:\.\d+)?)\s+years?\s+and\s+older/);

  if (olderMatch) {
    const min = Math.floor(Number(olderMatch[1]));
    return { min, max: Number.POSITIVE_INFINITY };
  }

  const onlyMatch = text.match(/age\s+(\d+(?:\.\d+)?)\s+only/);

  if (onlyMatch) {
    const age = Math.floor(Number(onlyMatch[1]));
    return { min: age, max: age };
  }

  const numbers = Array.from(text.matchAll(/\d+(?:\.\d+)?/g), (match) =>
    Number(match[0]),
  );

  if (numbers.length === 0) {
    return null;
  }

  if (numbers.length === 1) {
    const age = Math.floor(numbers[0]);
    return { min: age, max: age };
  }

  return {
    min: Math.floor(Math.min(...numbers)),
    max: Math.floor(Math.max(...numbers)),
  };
}

function gradeTokenToAge(token: string): number {
  const normalized = token.toLowerCase();

  if (normalized === 'k') {
    return 5;
  }

  return Number(normalized) + 5;
}

function matchesAge(ageRange: string, age: number | null): boolean {
  if (age == null) {
    return true;
  }

  const parsed = parseAgeRange(ageRange);

  if (parsed == null) {
    return true;
  }

  return age >= parsed.min && age <= parsed.max;
}

export function extractCost(costLabel: string): number | null {
  const text = normalizeText(costLabel);

  if (text.includes('free')) {
    return 0;
  }

  if (text.includes('sliding scale') && !/\d/.test(text)) {
    return 0;
  }

  const numbers = Array.from(text.replace(/,/g, '').matchAll(/\$?(\d+(?:\.\d+)?)/g), (match) =>
    Number(match[1]),
  ).filter((value) => Number.isFinite(value));

  if (numbers.length === 0) {
    return null;
  }

  return Math.min(...numbers);
}

function compareByCost(left: Camp, right: Camp): number {
  const leftValue = extractCost(left.costLabel);
  const rightValue = extractCost(right.costLabel);

  if (leftValue == null && rightValue == null) {
    return left.costLabel.localeCompare(right.costLabel);
  }

  if (leftValue == null) {
    return 1;
  }

  if (rightValue == null) {
    return -1;
  }

  return leftValue - rightValue || left.costLabel.localeCompare(right.costLabel);
}

function compareCamps(left: Camp, right: Camp, sort: FinderFilters['sort']): number {
  if (sort === 'name') {
    return left.name.localeCompare(right.name);
  }

  if (sort === 'cost') {
    return compareByCost(left, right);
  }

  if (sort === 'current') {
    return Number(left.isStale) - Number(right.isStale);
  }

  return (left.distanceMiles ?? Number.POSITIVE_INFINITY) -
    (right.distanceMiles ?? Number.POSITIVE_INFINITY);
}

export function applyFilters(
  camps: Camp[],
  filters: FinderFilters,
): Camp[] {
  return camps
    .filter((camp) => matchesQuery(camp, filters.query))
    .filter(
      (camp) => filters.type === 'all' || camp.typeTags.includes(filters.type),
    )
    .filter(
      (camp) => filters.season === 'all' || camp.seasons.includes(filters.season),
    )
    .filter(
      (camp) =>
        filters.maxDistance == null ||
        (camp.distanceMiles ?? Number.POSITIVE_INFINITY) <= filters.maxDistance,
    )
    .filter((camp) => matchesAge(camp.ageRange, filters.age))
    .filter((camp) => {
      if (filters.maxCost == null) return true;
      const cost = extractCost(camp.costLabel);
      return cost == null || cost <= filters.maxCost;
    })
    .filter((camp) => {
      if (filters.aidFilter === 'yes') return camp.financialAidAvailable === true;
      if (filters.aidFilter === 'known') return camp.financialAidAvailable != null;
      return true;
    })
    .filter((camp) => {
      if (filters.freshnessFilter === 'current') return !camp.isStale;
      if (filters.freshnessFilter === 'stale') return camp.isStale;
      return true;
    })
    .filter((camp) =>
      filters.selectedOrg == null || camp.organization === filters.selectedOrg,
    )
    .sort((left, right) => compareCamps(left, right, filters.sort));
}
