import { describe, it, expect } from "vitest";
import { sortedHandAfterAdd } from "../App.jsx";

describe("sortedHandAfterAdd", () => {
  it("places non-numeric cards first and numeric cards ascending", () => {
    const hand = ["+2", "5", "2"];
    const result = sortedHandAfterAdd(hand, "3");
    expect(result).toEqual(["+2", "2", "3", "5"]);
  });

  it("keeps multiple non-numerics at front in insertion order", () => {
    const hand = ["+2"];
    const result = sortedHandAfterAdd(hand, "+4");
    expect(result).toEqual(["+2", "+4"]);
  });
});
