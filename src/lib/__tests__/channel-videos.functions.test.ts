import { describe, it, expect } from "vitest";
import { type ChannelVideoTile, type ChannelDetails } from "../channel-videos.functions";

describe("channel-videos types and export schema", () => {
  it("structures channel video tile items correctly with all export parameters", () => {
    const sampleTile: ChannelVideoTile = {
      id: "abc12345678",
      title: "Why Inventions Take So Long",
      url: "https://www.youtube.com/watch?v=abc12345678",
      thumbnailUrl: "https://i.ytimg.com/vi/abc12345678/hqdefault.jpg",
      publishedAt: "2024-03-12T14:20:00Z",
      publishedDate: "12 Mar 2024",
      viewsNum: 1540200,
      viewsText: "1.5M",
      durationSec: 840,
      durationText: "14:00",
      isShort: false,
      multiplier: 2.8,
      multiplierText: "2.8x",
      viewsSubRatio: "10.4%",
      channelTitle: "Veritasium",
      channelUrl: "https://www.youtube.com/@veritasium",
      likesNum: 45000,
      commentsNum: 3200,
    };

    expect(sampleTile.id).toBe("abc12345678");
    expect(sampleTile.title).toBeTruthy();
    expect(sampleTile.viewsNum).toBe(1540200);
    expect(sampleTile.multiplierText).toBe("2.8x");
    expect(sampleTile.durationText).toBe("14:00");
    expect(sampleTile.viewsSubRatio).toBe("10.4%");
    expect(sampleTile.channelTitle).toBe("Veritasium");
  });

  it("structures channel details with subscriber and video count statistics", () => {
    const details: ChannelDetails = {
      id: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      title: "Veritasium",
      handle: "@veritasium",
      url: "https://www.youtube.com/@veritasium",
      avatarUrl: "https://example.com/avatar.jpg",
      subscribers: "15.4M",
      subscriberCount: 15400000,
      videoCount: "412",
      videoCountNum: 412,
    };

    expect(details.title).toBe("Veritasium");
    expect(details.videoCount).toBe("412");
    expect(details.videoCountNum).toBe(412);
    expect(details.subscriberCount).toBe(15400000);
  });
});
