import type { Check, DocumentTotal, LineItem, Refusal } from "@/lib/types";

export type TextFragment = {
  text: string;
  x: number;
  y: number;
  width: number;
};

export type PageLine = {
  page: number;
  text: string;
  fragments: TextFragment[];
};

type ParseOutput = {
  lineItems: LineItem[];
  totals: DocumentTotal[];
  refusals: Refusal[];
  checks: Check[];
};

const HEADER_DESCRIPTION = /\b(description|product|item description|details|goods)\b/i;
const HEADER_QUANTITY = /\b(qty|quantity|ordered|delivered)\b/i;
const HEADER_AMOUNT = /\b(amount|line total|value|extended)\b/i;
const HEADER_PRICE = /\b(unit price|price|rate|unit cost)\b/i;
const SUMMARY_LINE = /^\s*(subtotal|sub-total|gst|vat|tax|total|amount due)\b/i;

const numericToken = String.raw`(?:[$€£]\s*)?(?:\(\s*)?-?\d[\d,]*(?:\.\d+)?\s*\)?`;
const quantityToken = String.raw`-?\d+(?:[.,]\d+)?`;
const unitToken = String.raw`[A-Za-z][A-Za-z0-9./-]*`;

function makeId(prefix: string, page: number, index: number) {
  return `${prefix}-p${page}-${index + 1}`;
}

export function parseNumber(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/[$€£\s,]/g, "")
    .replace(/^\((.+)\)$/, "-$1");
  if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function sourced(value: number, page: number, sourceText: string, rawValue: string) {
  return { value, evidence: { page, sourceText, rawValue } };
}

function parseTotal(line: PageLine, index: number): DocumentTotal | null {
  const match = line.text.match(
    new RegExp(`^\\s*(subtotal|sub-total|gst(?:\\s*\\([^)]*\\))?|vat(?:\\s*\\([^)]*\\))?|tax(?:\\s*\\([^)]*\\))?|total(?:\\s*\\([^)]*\\))?|amount due)\\s*:?\\s*(${numericToken})\\s*$`, "i"),
  );
  if (!match) return null;
  const value = parseNumber(match[2]);
  if (value === null) return null;
  return {
    label: match[1].trim(),
    amount: sourced(value, line.page, line.text, match[2].trim()),
  };
}

type ParsedRow = Omit<LineItem, "id">;

function parseInvoiceRow(line: PageLine): ParsedRow | null {
  const withCode = new RegExp(
    `^\\s*([A-Za-z0-9][A-Za-z0-9._/-]*)\\s+(.+?)\\s+(${quantityToken})\\s+(${unitToken})\\s+(${numericToken})\\s+(${numericToken})\\s*$`,
  );
  const withoutCode = new RegExp(
    `^\\s*(.+?)\\s+(${quantityToken})\\s+(${unitToken})\\s+(${numericToken})\\s+(${numericToken})\\s*$`,
  );
  const codeMatch = line.text.match(withCode);
  if (codeMatch) {
    const quantity = parseNumber(codeMatch[3]);
    const unitPrice = parseNumber(codeMatch[5]);
    const amount = parseNumber(codeMatch[6]);
    if (quantity === null || unitPrice === null || amount === null) return null;
    return {
      code: codeMatch[1],
      description: codeMatch[2].trim(),
      quantity: sourced(quantity, line.page, line.text, codeMatch[3]),
      unit: codeMatch[4],
      unitPrice: sourced(unitPrice, line.page, line.text, codeMatch[5]),
      amount: sourced(amount, line.page, line.text, codeMatch[6]),
      evidence: { page: line.page, sourceText: line.text },
    };
  }

  const plainMatch = line.text.match(withoutCode);
  if (!plainMatch) return null;
  const quantity = parseNumber(plainMatch[2]);
  const unitPrice = parseNumber(plainMatch[4]);
  const amount = parseNumber(plainMatch[5]);
  if (quantity === null || unitPrice === null || amount === null) return null;
  return {
    description: plainMatch[1].trim(),
    quantity: sourced(quantity, line.page, line.text, plainMatch[2]),
    unit: plainMatch[3],
    unitPrice: sourced(unitPrice, line.page, line.text, plainMatch[4]),
    amount: sourced(amount, line.page, line.text, plainMatch[5]),
    evidence: { page: line.page, sourceText: line.text },
  };
}

function parseQuantityRow(line: PageLine): ParsedRow | null {
  const withCode = new RegExp(
    `^\\s*([A-Za-z0-9][A-Za-z0-9._/-]*)\\s+(.+?)\\s+(${quantityToken})\\s+(${unitToken})\\s*$`,
  );
  const match = line.text.match(withCode);
  if (!match) return null;
  const quantity = parseNumber(match[3]);
  if (quantity === null) return null;
  return {
    code: match[1],
    description: match[2].trim(),
    quantity: sourced(quantity, line.page, line.text, match[3]),
    unit: match[4],
    evidence: { page: line.page, sourceText: line.text },
  };
}

function isPlausibleDataRow(text: string) {
  return /\d/.test(text) && text.trim().split(/\s+/).length >= 3 && !SUMMARY_LINE.test(text);
}

export function parseDocumentLines(lines: PageLine[], pagesWithNoText: number[] = []): ParseOutput {
  const lineItems: LineItem[] = [];
  const totals: DocumentTotal[] = [];
  const refusals: Refusal[] = [];
  const checks: Check[] = [];
  const headerIndexes = new Set<number>();

  for (const page of pagesWithNoText) {
    refusals.push({
      id: `no-text-p${page}`,
      code: "NO_TEXT_LAYER",
      title: `Không đọc được chữ ở trang ${page}`,
      reason: "Trang này có vẻ là ảnh scan và không có lớp văn bản để kiểm chứng chính xác.",
      whatToDo: "Hãy xuất lại PDF có lớp chữ hoặc chạy OCR rồi tải lên lại.",
      page,
      severity: "critical",
    });
  }

  lines.forEach((line, index) => {
    const text = line.text.replace(/\s+/g, " ").trim();
    if (HEADER_DESCRIPTION.test(text) && (HEADER_QUANTITY.test(text) || HEADER_AMOUNT.test(text))) {
      headerIndexes.add(index);
    }
    const total = parseTotal({ ...line, text }, index);
    if (total) totals.push(total);
  });

  if (headerIndexes.size === 0 && lines.length > 0) {
    refusals.push({
      id: "no-table-header",
      code: "NO_TABLE_HEADER",
      title: "Không tìm thấy bảng hàng hóa rõ ràng",
      reason: "Tài liệu có chữ, nhưng không có hàng tiêu đề đủ rõ để xác định cột mô tả và số lượng/thành tiền.",
      whatToDo: "Kiểm tra đúng loại tài liệu hoặc dùng bản PDF có bố cục bảng rõ hơn.",
      severity: "critical",
    });
  }

  for (const headerIndex of headerIndexes) {
    const header = lines[headerIndex];
    const headerText = header.text.replace(/\s+/g, " ").trim();
    const expectsPrice = HEADER_PRICE.test(headerText) || HEADER_AMOUNT.test(headerText);
    let rowCount = 0;

    for (let index = headerIndex + 1; index < lines.length; index += 1) {
      const line = { ...lines[index], text: lines[index].text.replace(/\s+/g, " ").trim() };
      if (line.page !== header.page && headerIndexes.has(index)) break;
      if (headerIndexes.has(index)) break;
      if (SUMMARY_LINE.test(line.text)) break;
      if (!line.text) continue;

      const parsed = expectsPrice ? parseInvoiceRow(line) : parseQuantityRow(line);
      if (parsed) {
        lineItems.push({ id: makeId("item", line.page, lineItems.length), ...parsed });
        rowCount += 1;
      } else if (isPlausibleDataRow(line.text)) {
        refusals.push({
          id: makeId("ambiguous", line.page, refusals.length),
          code: "AMBIGUOUS_ROW",
          title: "Một dòng hàng không đủ rõ để trích xuất",
          reason: expectsPrice
            ? "Không thể gán chắc chắn các giá trị vào số lượng, đơn giá và thành tiền. Dòng này đã được bỏ qua."
            : "Không thể gán chắc chắn giá trị số vào cột số lượng. Dòng này đã được bỏ qua.",
          whatToDo: "Đối chiếu dòng gốc bên dưới hoặc tải lên PDF có cột thẳng hàng hơn.",
          page: line.page,
          sourceText: line.text,
          severity: "warning",
        });
      }
    }

    if (rowCount === 0) {
      refusals.push({
        id: makeId("unsupported", header.page, refusals.length),
        code: "UNSUPPORTED_LAYOUT",
        title: "Đã thấy tiêu đề bảng nhưng không đọc chắc chắn được dòng nào",
        reason: "Bố cục các dòng dữ liệu không khớp đủ rõ với các cột trong tiêu đề.",
        whatToDo: "Kiểm tra bản PDF gốc; không nên nhập tay các số khi chưa đối chiếu.",
        page: header.page,
        sourceText: header.text,
        severity: "critical",
      });
    }
  }

  const uniqueItems = lineItems.filter(
    (item, index, all) => all.findIndex((candidate) => candidate.evidence.page === item.evidence.page && candidate.evidence.sourceText === item.evidence.sourceText) === index,
  );

  for (const item of uniqueItems) {
    if (item.quantity && item.unitPrice && item.amount) {
      const calculated = item.quantity.value * item.unitPrice.value;
      if (Math.abs(calculated - item.amount.value) > 0.011) {
        refusals.push({
          id: `math-${item.id}`,
          code: "ARITHMETIC_MISMATCH",
          title: "Các số trên cùng một dòng không khớp nhau",
          reason: "Số lượng nhân đơn giá không bằng thành tiền ghi trên tài liệu. Hệ thống giữ nguyên các giá trị có nguồn nhưng không tự chọn giá trị nào là đúng.",
          whatToDo: "Đối chiếu với bên phát hành trước khi sử dụng dòng này.",
          page: item.evidence.page,
          sourceText: item.evidence.sourceText,
          severity: "critical",
        });
      }
    }
  }

  const byIdentity = new Map<string, LineItem>();
  for (const item of uniqueItems) {
    const identity = `${item.code ?? ""}|${item.description}`.toLocaleLowerCase();
    const previous = byIdentity.get(identity);
    if (previous) {
      const differs =
        previous.quantity?.value !== item.quantity?.value ||
        previous.unitPrice?.value !== item.unitPrice?.value ||
        previous.amount?.value !== item.amount?.value;
      if (differs) {
        refusals.push({
          id: `conflict-${item.id}`,
          code: "CONTRADICTORY_VALUES",
          title: "Cùng một mặt hàng có các giá trị khác nhau",
          reason: "Tài liệu lặp lại cùng mã/mô tả nhưng các số không đồng nhất. Hệ thống không tự chọn một phiên bản.",
          whatToDo: "Mở cả hai trang có bằng chứng và xác nhận phiên bản hợp lệ.",
          page: item.evidence.page,
          sourceText: item.evidence.sourceText,
          severity: "critical",
        });
      }
    } else {
      byIdentity.set(identity, item);
    }
  }

  checks.push({
    id: "evidence",
    status: uniqueItems.length > 0 ? "passed" : "not_run",
    label: "Bằng chứng nguồn",
    detail: uniqueItems.length > 0
      ? "Mọi giá trị số được trích xuất đều gắn với trang và nguyên văn dòng nguồn."
      : "Không có giá trị số nào được xuất khi chưa có bằng chứng đủ chắc chắn.",
  });
  checks.push({
    id: "arithmetic",
    status: refusals.some((item) => item.code === "ARITHMETIC_MISMATCH")
      ? "warning"
      : uniqueItems.some((item) => item.quantity && item.unitPrice && item.amount)
        ? "passed"
        : "not_run",
    label: "Kiểm tra phép tính",
    detail: refusals.some((item) => item.code === "ARITHMETIC_MISMATCH")
      ? "Có ít nhất một dòng cần đối chiếu vì phép tính không khớp."
      : "Không phát hiện mâu thuẫn trong các dòng đủ dữ liệu để kiểm tra.",
  });
  checks.push({
    id: "contradictions",
    status: refusals.some((item) => item.code === "CONTRADICTORY_VALUES") ? "warning" : "passed",
    label: "Kiểm tra mâu thuẫn",
    detail: refusals.some((item) => item.code === "CONTRADICTORY_VALUES")
      ? "Có mặt hàng lặp lại với giá trị khác nhau."
      : "Không phát hiện mặt hàng trùng có giá trị khác nhau.",
  });

  return { lineItems: uniqueItems, totals, refusals, checks };
}
