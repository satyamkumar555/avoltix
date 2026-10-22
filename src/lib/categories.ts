export type Category = { id: string; name: string; description: string; parentId: string | null; order: number; published: boolean; imageUrl?: string };

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const childrenOf = (cats: Category[], pid: string | null) =>
  cats.filter((c) => (c.parentId ?? null) === pid).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

export function descendantIds(cats: Category[], id: string, seen = new Set<string>()): string[] {
  if (seen.has(id)) return [];
  seen.add(id);
  return [id, ...childrenOf(cats, id).flatMap((c) => descendantIds(cats, c.id, seen))];
}
export function flatten(cats: Category[], pid: string | null = null, depth = 0, seen = new Set<string>()): { c: Category; depth: number }[] {
  return childrenOf(cats, pid).flatMap((c) => {
    if (seen.has(c.id)) return [];
    seen.add(c.id);
    return [{ c, depth }, ...flatten(cats, c.id, depth + 1, seen)];
  });
}
/** True if making `newParent` the parent of `id` would create a loop. */
export const wouldCycle = (cats: Category[], id: string, newParent: string | null) =>
  newParent !== null && descendantIds(cats, id).includes(newParent);
