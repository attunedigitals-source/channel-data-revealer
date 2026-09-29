import { describe, it, expect } from "vitest";
import { CURATED_OUTLIERS } from "../outlier.functions";

describe("outlier.functions", () => {
  it("has curated outliers matching the viral discovery interface", () => {
    expect(CURATED_OUTLIERS.length).toBeGreaterThanOrEqual(5);

    const filmitgirl = CURATED_OUTLIERS.find((o) => o.channelTitle === "filmitgirl");
    expect(filmitgirl).toBeDefined();
    expect(filmitgirl?.multiplier).toBe(40);
    expect(filmitgirl?.viewsText).toBe("627.8K");
    expect(filmitgirl?.isShort).toBe(true);

    const carnelltakes = CURATED_OUTLIERS.find((o) => o.channelTitle === "carnelltakes");
    expect(carnelltakes).toBeDefined();
    expect(carnelltakes?.multiplier).toBe(33);

    const brainrottcity = CURATED_OUTLIERS.find((o) => o.channelTitle === "brainrottcity");
    expect(brainrottcity).toBeDefined();
    expect(brainrottcity?.multiplier).toBe(34);
  });

  it("ensures every curated outlier has valid tile fields", () => {
    for (const outlier of CURATED_OUTLIERS) {
      expect(outlier.id).toBeTruthy();
      expect(outlier.title).toBeTruthy();
      expect(outlier.thumbnailUrl).toBeTruthy();
      expect(outlier.multiplier).toBeGreaterThan(0);
      expect(outlier.viewsNum).toBeGreaterThan(0);
      expect(outlier.channelTitle).toBeTruthy();
      expect(outlier.publishedDate).toBeTruthy();
    }
  });

  it("verifies curated pool has at least 90 items to fill multiple screens", () => {
    expect(CURATED_OUTLIERS.length).toBeGreaterThanOrEqual(90);
  });

  it("ensures every curated outlier has a unique ID and unique title (no repetition)", () => {
    const ids = CURATED_OUTLIERS.map((o) => o.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(CURATED_OUTLIERS.length);

    const titles = CURATED_OUTLIERS.map((o) => o.title.toLowerCase().trim());
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(CURATED_OUTLIERS.length);
  });

  it("verifies offset-based pagination slices cleanly without repeating items", () => {
    const batch1 = CURATED_OUTLIERS.slice(0, 24);
    const batch2 = CURATED_OUTLIERS.slice(24, 48);
    const batch3 = CURATED_OUTLIERS.slice(48, 72);
    const batch4 = CURATED_OUTLIERS.slice(72, 96);

    expect(batch1.length).toBe(24);
    expect(batch2.length).toBe(24);
    expect(batch3.length).toBe(24);
    expect(batch4.length).toBe(24);

    const b1Ids = new Set(batch1.map((o) => o.id));
    for (const item of batch2) {
      expect(b1Ids.has(item.id)).toBe(false);
    }
    const b2Ids = new Set(batch2.map((o) => o.id));
    for (const item of batch3) {
      expect(b1Ids.has(item.id)).toBe(false);
      expect(b2Ids.has(item.id)).toBe(false);
    }
    const b3Ids = new Set(batch3.map((o) => o.id));
    for (const item of batch4) {
      expect(b1Ids.has(item.id)).toBe(false);
      expect(b2Ids.has(item.id)).toBe(false);
      expect(b3Ids.has(item.id)).toBe(false);
    }
  });

  it("verifies format filtering for shorts returns only shorts and all formats returns everything", () => {
    const shortsOnly = CURATED_OUTLIERS.filter((o) => o.isShort);
    expect(shortsOnly.length).toBeGreaterThanOrEqual(30);
    for (const item of shortsOnly) {
      expect(item.isShort).toBe(true);
      expect(item.durationSec).toBeLessThanOrEqual(60);
    }

    const allFormats = CURATED_OUTLIERS;
    expect(allFormats.length).toBeGreaterThan(shortsOnly.length);
  });
});
