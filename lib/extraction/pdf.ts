import type { PageLine, TextFragment } from "./parser";

type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
};

function isTextItem(item: unknown): item is PdfTextItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Partial<PdfTextItem>;
  return typeof candidate.str === "string" && Array.isArray(candidate.transform);
}

function groupIntoLines(fragments: TextFragment[], page: number): PageLine[] {
  const groups: TextFragment[][] = [];
  const ordered = [...fragments].sort((a, b) => b.y - a.y || a.x - b.x);

  for (const fragment of ordered) {
    const group = groups.find((candidate) => Math.abs(candidate[0].y - fragment.y) <= 3);
    if (group) group.push(fragment);
    else groups.push([fragment]);
  }

  return groups
    .map((group) => {
      const sorted = [...group].sort((a, b) => a.x - b.x);
      let text = "";
      let previousEnd = 0;
      for (const fragment of sorted) {
        const averageCharacterWidth = fragment.text.length > 0 ? fragment.width / fragment.text.length : 0;
        const gap = fragment.x - previousEnd;
        const needsSpace = text.length > 0 && !/\s$/.test(text) && gap > Math.max(1.5, averageCharacterWidth * 0.35);
        text += `${needsSpace ? " " : ""}${fragment.text}`;
        previousEnd = Math.max(previousEnd, fragment.x + fragment.width);
      }
      return { page, text: text.trim(), fragments: sorted };
    })
    .filter((line) => line.text.length > 0);
}

export async function extractPdfText(data: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const document = await loadingTask.promise;
  const lines: PageLine[] = [];
  const pagesWithNoText: number[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const fragments = content.items.flatMap((item) => {
      if (!isTextItem(item)) return [];
      return [{
        text: item.str,
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0,
        width: item.width ?? 0,
      }];
    });
    const pageLines = groupIntoLines(fragments, pageNumber);
    if (pageLines.length === 0) pagesWithNoText.push(pageNumber);
    lines.push(...pageLines);
    page.cleanup();
  }

  return { pageCount: document.numPages, lines, pagesWithNoText };
}
