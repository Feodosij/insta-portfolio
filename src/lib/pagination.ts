export type Paginatable = {
  id: string;
  order: number;
};

export type Cursor = {
  order: number;
  id: string;
};

export type PaginateResult<T> = {
  items: T[];
  nextCursor: Cursor | null;
};

export type PaginateOptions = {
  cursor?: Cursor | null;
  limit: number;
};

function compare(a: Paginatable, b: Paginatable): number {
  if (a.order !== b.order) return a.order - b.order;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/**
 * Slices a cursor-based page out of the full (unsorted) set of items,
 * ordered by the composite key (order, id) — order alone isn't unique,
 * so id is the tiebreaker to keep pagination stable and duplicate-free.
 */
export function paginate<T extends Paginatable>(
  items: T[],
  { cursor = null, limit }: PaginateOptions,
): PaginateResult<T> {
  const sorted = [...items].sort(compare);

  const startIndex = cursor
    ? sorted.findIndex((item) => compare(item, cursor) > 0)
    : 0;

  if (startIndex === -1) {
    return { items: [], nextCursor: null };
  }

  const page = sorted.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < sorted.length;
  const last = page[page.length - 1];

  return {
    items: page,
    nextCursor: hasMore && last ? { order: last.order, id: last.id } : null,
  };
}

export function encodeCursor(cursor: Cursor): string {
  return `${cursor.order}:${cursor.id}`;
}

export function decodeCursor(raw: string | null | undefined): Cursor | null {
  if (!raw) return null;
  const separatorIndex = raw.indexOf(":");
  if (separatorIndex === -1) return null;

  const order = Number(raw.slice(0, separatorIndex));
  const id = raw.slice(separatorIndex + 1);
  if (!id || Number.isNaN(order)) return null;

  return { order, id };
}
