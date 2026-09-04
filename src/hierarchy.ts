export const HIERARCHY_LEVELS = ["process", "subprocess", "task", "activity"] as const;
export type HierarchyLevel = (typeof HIERARCHY_LEVELS)[number];

export function deepestHierarchyLevel(expanded: string[]): HierarchyLevel {
  if (expanded.some((id) => /-t\d+/.test(id))) return "activity";
  if (expanded.some((id) => /-s\d+/.test(id))) return "task";
  return "subprocess";
}

export function isHierarchyCrumbReached(level: HierarchyLevel, deepest: HierarchyLevel): boolean {
  return HIERARCHY_LEVELS.indexOf(level) <= HIERARCHY_LEVELS.indexOf(deepest);
}

export function toggleHierarchyExpand(current: string[], id: string): string[] {
  if (current.includes(id)) {
    return current.filter((item) => item !== id && !item.startsWith(`${id}-`));
  }
  return [...current.filter((item) => id.startsWith(`${item}-`)), id];
}
