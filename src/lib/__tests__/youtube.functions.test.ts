import { describe, it, expect } from "vitest";
import { parseIdentifier, isoDurationToSeconds } from "../youtube.functions";

describe("parseIdentifier", () => {
  it("extracts a video ID from a standard watch URL", () => {
    expect(parseIdentifier("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      type: "video",
      value: "dQw4w9WgXcQ",
    });
  });

  it("extracts a video ID from a youtu.be short link", () => {
    expect(parseIdentifier("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      type: "video",
      value: "dQw4w9WgXcQ",
    });
  });

  it("extracts a video ID from a Shorts URL", () => {
    expect(parseIdentifier("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
      type: "video",
      value: "dQw4w9WgXcQ",
    });
  });

  it("recognizes a channel handle", () => {
    expect(parseIdentifier("@mkbhd")).toEqual({ type: "handle", value: "@mkbhd" });
  });

  it("recognizes a handle inside a full URL", () => {
    expect(parseIdentifier("https://www.youtube.com/@mkbhd")).toEqual({ type: "handle", value: "@mkbhd" });
  });

  it("recognizes a raw channel ID (UC...)", () => {
    const id = "UC" + "x".repeat(22);
    expect(parseIdentifier(id)).toEqual({ type: "id", value: id });
  });

  it("recognizes a /channel/ URL", () => {
    const id = "UC" + "x".repeat(22);
    expect(parseIdentifier(`https://www.youtube.com/channel/${id}`)).toEqual({ type: "id", value: id });
  });

  it("falls back to search for a plain channel name", () => {
    expect(parseIdentifier("MrBeast")).toEqual({ type: "search", value: "MrBeast" });
  });
});

describe("isoDurationToSeconds", () => {
  it("parses hours, minutes, and seconds", () => {
    expect(isoDurationToSeconds("PT1H2M3S")).toBe(3723);
  });

  it("parses minutes and seconds only", () => {
    expect(isoDurationToSeconds("PT15M33S")).toBe(933);
  });

  it("parses seconds only", () => {
    expect(isoDurationToSeconds("PT45S")).toBe(45);
  });

  it("parses days", () => {
    expect(isoDurationToSeconds("P1DT2H")).toBe(86400 + 7200);
  });

  it("returns 0 for an unparseable string", () => {
    expect(isoDurationToSeconds("not-a-duration")).toBe(0);
  });
});
