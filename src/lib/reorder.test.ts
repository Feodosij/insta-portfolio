import { describe, expect, it } from "vitest";

import { reorder } from "./reorder";

const items = [
  { id: "a", order: 0 },
  { id: "b", order: 1 },
  { id: "c", order: 2 },
];

describe("reorder", () => {
  it("applies a full new order", () => {
    const result = reorder(items, ["c", "a", "b"]);
    expect(result.map((item) => item.id)).toEqual(["c", "a", "b"]);
    expect(result.map((item) => item.order)).toEqual([0, 1, 2]);
  });

  it("keeps items left out of the new order, appended after in their previous relative order", () => {
    const result = reorder(items, ["b"]);
    expect(result.map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(result.map((item) => item.order)).toEqual([0, 1, 2]);
  });

  it("keeps only the first occurrence of a duplicate id", () => {
    const result = reorder(items, ["a", "a", "b", "c"]);
    expect(result.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("ignores unknown ids without breaking the rest of the order", () => {
    const result = reorder(items, ["ghost", "b", "a"]);
    expect(result.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });

  it("leaves relative order unchanged when given an empty new order", () => {
    const result = reorder(items, []);
    expect(result.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});
