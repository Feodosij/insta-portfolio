import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor, paginate } from "./pagination";

type Item = { id: string; order: number };

describe("paginate", () => {
  it("returns the first page when there is no cursor", () => {
    const items: Item[] = [
      { id: "a", order: 0 },
      { id: "b", order: 1 },
      { id: "c", order: 2 },
    ];

    const result = paginate(items, { limit: 2 });

    expect(result.items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(result.nextCursor).toEqual({ order: 1, id: "b" });
  });

  it("returns a middle page given a cursor", () => {
    const items: Item[] = [
      { id: "a", order: 0 },
      { id: "b", order: 1 },
      { id: "c", order: 2 },
      { id: "d", order: 3 },
    ];

    const result = paginate(items, {
      cursor: { order: 1, id: "b" },
      limit: 2,
    });

    expect(result.items.map((item) => item.id)).toEqual(["c", "d"]);
    expect(result.nextCursor).toBeNull();
  });

  it("returns a final page with fewer items than the limit", () => {
    const items: Item[] = [
      { id: "a", order: 0 },
      { id: "b", order: 1 },
      { id: "c", order: 2 },
    ];

    const result = paginate(items, {
      cursor: { order: 0, id: "a" },
      limit: 5,
    });

    expect(result.items.map((item) => item.id)).toEqual(["b", "c"]);
    expect(result.nextCursor).toBeNull();
  });

  it("returns an empty page for an empty category", () => {
    const result = paginate([] as Item[], { limit: 10 });

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it("breaks ties on id when order is equal, regardless of input order", () => {
    const items: Item[] = [
      { id: "c", order: 1 },
      { id: "a", order: 1 },
      { id: "b", order: 1 },
    ];

    const firstPage = paginate(items, { limit: 2 });
    expect(firstPage.items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(firstPage.nextCursor).toEqual({ order: 1, id: "b" });

    const secondPage = paginate(items, {
      cursor: firstPage.nextCursor,
      limit: 2,
    });
    expect(secondPage.items.map((item) => item.id)).toEqual(["c"]);
    expect(secondPage.nextCursor).toBeNull();
  });
});

describe("cursor encode/decode", () => {
  it("round-trips through a string", () => {
    const cursor = { order: 12, id: "photo-uuid" };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it("returns null for missing or malformed input", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("not-a-cursor")).toBeNull();
  });
});
