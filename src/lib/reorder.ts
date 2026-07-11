export type OrderedItem = { id: string; order: number };

// Recomputes sequential `order` values from a new id order. Ids in
// `newOrderIds` that don't match a known item, and repeated ids, are
// ignored (first occurrence wins). Items left out of `newOrderIds` keep
// their previous relative order and are appended after the reordered ones,
// so a partial drag never drops or duplicates rows.
export function reorder<T extends OrderedItem>(
  items: T[],
  newOrderIds: string[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const reordered: T[] = [];

  for (const id of newOrderIds) {
    if (seen.has(id)) continue;
    const item = byId.get(id);
    if (!item) continue;
    seen.add(id);
    reordered.push(item);
  }

  const remaining = items
    .filter((item) => !seen.has(item.id))
    .sort((a, b) => a.order - b.order);

  return [...reordered, ...remaining].map((item, index) => ({
    ...item,
    order: index,
  }));
}
