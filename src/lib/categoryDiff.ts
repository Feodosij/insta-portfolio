export type CategoryDiff = { toAdd: string[]; toRemove: string[] };

export function categoryDiff(
  oldCategoryIds: string[],
  newCategoryIds: string[],
): CategoryDiff {
  const oldSet = new Set(oldCategoryIds);
  const newSet = new Set(newCategoryIds);

  return {
    toAdd: [...newSet].filter((id) => !oldSet.has(id)),
    toRemove: [...oldSet].filter((id) => !newSet.has(id)),
  };
}
