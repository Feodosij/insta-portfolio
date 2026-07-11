import { describe, expect, it } from "vitest";

import { categoryDiff } from "./categoryDiff";

describe("categoryDiff", () => {
  it("adds everything when starting from an empty list", () => {
    expect(categoryDiff([], ["a", "b"])).toEqual({
      toAdd: ["a", "b"],
      toRemove: [],
    });
  });

  it("removes everything when clearing to an empty list", () => {
    expect(categoryDiff(["a", "b"], [])).toEqual({
      toAdd: [],
      toRemove: ["a", "b"],
    });
  });

  it("returns empty diffs when nothing changed", () => {
    expect(categoryDiff(["a", "b"], ["a", "b"])).toEqual({
      toAdd: [],
      toRemove: [],
    });
  });

  it("computes a partial replacement", () => {
    expect(categoryDiff(["a", "b"], ["b", "c"])).toEqual({
      toAdd: ["c"],
      toRemove: ["a"],
    });
  });

  it("dedupes ids on both sides", () => {
    expect(categoryDiff(["a", "a"], ["a", "b", "b"])).toEqual({
      toAdd: ["b"],
      toRemove: [],
    });
  });
});
