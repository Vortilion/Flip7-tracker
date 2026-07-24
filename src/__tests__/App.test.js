import { describe, it, expect } from "vitest";
import { sortedHandAfterAdd, makeInitialDeck, sum } from "../App";

describe("sortedHandAfterAdd", () => {
  it("should add a numeric card to empty hand", () => {
    const result = sortedHandAfterAdd([], "5");
    expect(result).toEqual(["5"]);
  });

  it("should add multiple numeric cards in ascending order", () => {
    const hand = ["12"];
    const result = sortedHandAfterAdd(hand, "3");
    expect(result).toEqual(["3", "12"]);
  });

  it("should keep special cards before numeric cards", () => {
    const hand = ["+2"];
    const result = sortedHandAfterAdd(hand, "5");
    expect(result).toEqual(["+2", "5"]);
  });

  it("should add special card to hand with numeric cards", () => {
    const hand = ["1", "5", "12"];
    const result = sortedHandAfterAdd(hand, "freeze");
    expect(result).toEqual(["freeze", "1", "5", "12"]);
  });

  it("should handle adding to hand with multiple special cards", () => {
    const hand = ["+2", "freeze", "3", "7"];
    const result = sortedHandAfterAdd(hand, "5");
    expect(result).toEqual(["+2", "freeze", "3", "5", "7"]);
  });

  it("should add numeric card 0 and maintain sort order", () => {
    const hand = ["5", "12"];
    const result = sortedHandAfterAdd(hand, "0");
    expect(result).toEqual(["0", "5", "12"]);
  });

  it("should maintain numeric sort order when adding in middle", () => {
    const hand = ["1", "8"];
    const result = sortedHandAfterAdd(hand, "5");
    expect(result).toEqual(["1", "5", "8"]);
  });

  it("should add duplicate numeric card and sort", () => {
    const hand = ["5", "5", "12"];
    const result = sortedHandAfterAdd(hand, "8");
    expect(result).toEqual(["5", "5", "8", "12"]);
  });

  it("should handle multiple special cards and numeric", () => {
    const hand = ["+2", "+4", "2", "8"];
    const result = sortedHandAfterAdd(hand, "5");
    expect(result).toEqual(["+2", "+4", "2", "5", "8"]);
  });

  it("should add special card to hand with mixed cards", () => {
    const hand = ["+2", "3", "x2", "7"];
    const result = sortedHandAfterAdd(hand, "+6");
    expect(result).toEqual(["+2", "x2", "+6", "3", "7"]);
  });

  it("should handle all special cards", () => {
    let result = [];
    result = sortedHandAfterAdd(result, "freeze");
    result = sortedHandAfterAdd(result, "+2");
    result = sortedHandAfterAdd(result, "flip three");
    expect(result).toEqual(["freeze", "+2", "flip three"]);
  });

  it("should treat 0 as numeric, not special", () => {
    // regression: card '0' was previously not in numberCards and was grouped with specials
    const hand = ["+2", "freeze"];
    const result = sortedHandAfterAdd(hand, "0");
    expect(result).toEqual(["+2", "freeze", "0"]);
  });

  it("should place 0 numerically before other numbers", () => {
    const hand = ["3", "7"];
    const result = sortedHandAfterAdd(hand, "0");
    expect(result).toEqual(["0", "3", "7"]);
  });

  it("should treat second chance as special (before numerics)", () => {
    const hand = ["1", "5"];
    const result = sortedHandAfterAdd(hand, "second chance");
    expect(result).toEqual(["second chance", "1", "5"]);
  });

  it("should treat flip three as special (before numerics)", () => {
    const hand = ["3", "9"];
    const result = sortedHandAfterAdd(hand, "flip three");
    expect(result).toEqual(["flip three", "3", "9"]);
  });

  it("all specials appear before all numerics in mixed hand", () => {
    let result = [];
    result = sortedHandAfterAdd(result, "5");
    result = sortedHandAfterAdd(result, "freeze");
    result = sortedHandAfterAdd(result, "3");
    result = sortedHandAfterAdd(result, "+4");
    result = sortedHandAfterAdd(result, "second chance");
    result = sortedHandAfterAdd(result, "1");
    // specials: freeze, +4, second chance — numerics: 1, 3, 5
    const specials = result.filter((c) =>
      ["freeze", "+4", "second chance"].includes(c),
    );
    const numerics = result.filter((c) => ["1", "3", "5"].includes(c));
    const lastSpecialIdx = result.lastIndexOf(
      specials[specials.length - 1],
    );
    const firstNumericIdx = result.indexOf(numerics[0]);
    expect(lastSpecialIdx).toBeLessThan(firstNumericIdx);
  });

  it("should correctly carry original indices when splitting specials and numerics", () => {
    // validates that handSpecialBadges / handNumberBadges can rely on correct indices
    const hand = ["freeze", "2", "7"];
    const withExtra = sortedHandAfterAdd(hand, "5");
    // specials group: indices where card is not numeric
    const specialEntries = withExtra
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => isNaN(Number(c)));
    // numeric group: indices where card is numeric
    const numericEntries = withExtra
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !isNaN(Number(c)));
    // all special indices come before all numeric indices
    const maxSpecialIdx = Math.max(...specialEntries.map((e) => e.i));
    const minNumericIdx = Math.min(...numericEntries.map((e) => e.i));
    expect(maxSpecialIdx).toBeLessThan(minNumericIdx);
  });
});

describe("makeInitialDeck", () => {
  it("should create a deck object with all cards", () => {
    const deck = makeInitialDeck();
    expect(deck).toBeDefined();
    expect(typeof deck).toBe("object");
  });

  it("should have correct count for card 0", () => {
    const deck = makeInitialDeck();
    expect(deck["0"]).toBe(1);
  });

  it("should have correct count for numeric cards", () => {
    const deck = makeInitialDeck();
    expect(deck["1"]).toBe(1);
    expect(deck["2"]).toBe(2);
    expect(deck["3"]).toBe(3);
    expect(deck["5"]).toBe(5);
    expect(deck["12"]).toBe(12);
  });

  it("should have correct count for +X cards", () => {
    const deck = makeInitialDeck();
    expect(deck["+2"]).toBe(1);
    expect(deck["+4"]).toBe(1);
    expect(deck["+6"]).toBe(1);
    expect(deck["+8"]).toBe(1);
    expect(deck["+10"]).toBe(1);
  });

  it("should have correct count for special action cards", () => {
    const deck = makeInitialDeck();
    expect(deck["x2"]).toBe(1);
    expect(deck["freeze"]).toBe(3);
    expect(deck["flip three"]).toBe(3);
    expect(deck["second chance"]).toBe(3);
  });

  it("should have all expected keys", () => {
    const deck = makeInitialDeck();
    const expectedKeys = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "+2",
      "+4",
      "+6",
      "+8",
      "+10",
      "x2",
      "freeze",
      "flip three",
      "second chance",
    ];
    expectedKeys.forEach((key) => {
      expect(deck).toHaveProperty(key);
    });
  });

  it("should return consistent deck composition", () => {
    const deck1 = makeInitialDeck();
    const deck2 = makeInitialDeck();
    expect(deck1).toEqual(deck2);
  });

  it("card 0 count should be 1, not 0 (regression: was previously index-based)", () => {
    // Before fix, numberCards started at "1"; "0" was added separately.
    // Now numberCards includes "0" and count = numValue === 0 ? 1 : numValue.
    const deck = makeInitialDeck();
    expect(deck["0"]).toBe(1);
    expect(deck["1"]).toBe(1); // count = numValue = 1
  });

  it("numeric card counts should equal their face value (except 0)", () => {
    const deck = makeInitialDeck();
    for (let n = 1; n <= 12; n++) {
      expect(deck[String(n)]).toBe(n);
    }
  });
});

describe("sum", () => {
  it("should sum values in an object", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(sum(obj)).toBe(6);
  });

  it("should handle empty object", () => {
    expect(sum({})).toBe(0);
  });

  it("should handle object with zero values", () => {
    const obj = { a: 0, b: 5, c: 0 };
    expect(sum(obj)).toBe(5);
  });

  it("should handle object with negative values", () => {
    const obj = { a: 10, b: -3, c: 5 };
    expect(sum(obj)).toBe(12);
  });

  it("should calculate correct total for initial deck", () => {
    const deck = makeInitialDeck();
    const total = sum(deck);
    // 0(1) + 1(1) + 2(2) + 3(3) + ... + 12(12) + specials
    // Numeric: 1 + 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 = 79
    // Specials: 1 + 1 + 1 + 1 + 1 + 1 + 3 + 3 + 3 = 15
    // Total: 79 + 15 = 94
    expect(total).toBe(94);
  });

  it("should sum numeric string keys", () => {
    const deck = { 0: 1, 1: 1, 2: 2 };
    expect(sum(deck)).toBe(4);
  });
});
