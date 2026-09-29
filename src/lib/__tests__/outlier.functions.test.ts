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
});
