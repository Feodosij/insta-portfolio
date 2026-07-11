import { describe, expect, it } from "vitest";

import { buildUploadSignature } from "./cloudinary";

const secret = "test-secret";

describe("buildUploadSignature", () => {
  it("returns the same signature for the same params", () => {
    const params = { timestamp: 1700000000, folder: "gallery" };

    expect(buildUploadSignature(params, secret)).toBe(
      buildUploadSignature(params, secret),
    );
  });

  it("changes when timestamp changes", () => {
    const base = { timestamp: 1700000000, folder: "gallery" };
    const changed = { ...base, timestamp: 1700000001 };

    expect(buildUploadSignature(base, secret)).not.toBe(
      buildUploadSignature(changed, secret),
    );
  });

  it("changes when folder changes", () => {
    const base = { timestamp: 1700000000, folder: "gallery" };
    const changed = { ...base, folder: "hero" };

    expect(buildUploadSignature(base, secret)).not.toBe(
      buildUploadSignature(changed, secret),
    );
  });

  it("changes when public_id changes", () => {
    const base = {
      timestamp: 1700000000,
      folder: "gallery",
      public_id: "photo-1",
    };
    const changed = { ...base, public_id: "photo-2" };

    expect(buildUploadSignature(base, secret)).not.toBe(
      buildUploadSignature(changed, secret),
    );
  });
});
