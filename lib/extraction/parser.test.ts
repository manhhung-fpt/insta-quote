import { describe, expect, it } from "vitest";
import { parseDocumentLines, parseNumber, type PageLine } from "./parser";

const line = (page: number, text: string): PageLine => ({ page, text, fragments: [] });

describe("evidence-first document parser", () => {
  it("parses the supplied invoice layout and preserves exact source lines", () => {
    const rows = [
      line(1, "Code Description Qty Unit Unit Price Amount"),
      line(1, "FX-201 Framing nail gun coil, 90mm galv 24 box $52.00 $1,248.00"),
      line(1, "FX-118 Timber connector bolts M12x150 60 ea $3.40 $204.00"),
      line(1, "Subtotal: $1,452.00"),
    ];
    const result = parseDocumentLines(rows);

    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0].quantity).toMatchObject({ value: 24, evidence: { page: 1, rawValue: "24" } });
    expect(result.lineItems[0].amount).toMatchObject({ value: 1248, evidence: { sourceText: rows[1].text } });
    expect(result.totals[0].amount.value).toBe(1452);
    expect(result.refusals).toHaveLength(0);
  });

  it("surfaces contradictory arithmetic without changing sourced values", () => {
    const source = "AB-1 Safety gloves 2 pair $10.00 $99.00";
    const result = parseDocumentLines([
      line(2, "Code Description Qty Unit Unit Price Amount"),
      line(2, source),
    ]);

    expect(result.lineItems[0].amount?.value).toBe(99);
    expect(result.refusals).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "ARITHMETIC_MISMATCH", page: 2, sourceText: source }),
    ]));
  });

  it("refuses an ambiguous numeric row instead of guessing", () => {
    const source = "AB-2 Confusing row 12 $8.00";
    const result = parseDocumentLines([
      line(1, "Code Description Qty Unit Unit Price Amount"),
      line(1, source),
    ]);

    expect(result.lineItems).toHaveLength(0);
    expect(result.refusals).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "AMBIGUOUS_ROW", sourceText: source }),
    ]));
  });

  it("refuses image-only pages", () => {
    const result = parseDocumentLines([], [1]);
    expect(result.lineItems).toHaveLength(0);
    expect(result.refusals[0]).toMatchObject({ code: "NO_TEXT_LAYER", page: 1, severity: "critical" });
  });

  it("returns user-facing refusals and checks in English when requested", () => {
    const result = parseDocumentLines([], [2], "en");
    expect(result.refusals[0]).toMatchObject({
      title: "No readable text on page 2",
      reason: expect.stringContaining("scan"),
    });
    expect(result.checks[0]).toMatchObject({ label: "Source evidence" });
  });

  it("parses currencies and parenthesized negatives strictly", () => {
    expect(parseNumber("$1,248.00")).toBe(1248);
    expect(parseNumber("(204.50)")).toBe(-204.5);
    expect(parseNumber("12-ish")).toBeNull();
  });
});
