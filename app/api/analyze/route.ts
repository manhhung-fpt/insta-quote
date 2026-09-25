import { NextResponse } from "next/server";
import { assessDocument } from "@/lib/ai/assess";
import { extractPdfText } from "@/lib/extraction/pdf";
import { parseDocumentLines, type AnalysisLocale } from "@/lib/extraction/parser";
import type { AnalysisResult, ApiError } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function errorResponse(status: number, code: string, message: string, detail?: string, whatToDo?: string) {
  return NextResponse.json<ApiError>({ error: { code, message, detail, whatToDo } }, { status });
}

const routeCopy = {
  vi: {
    invalidForm: "Không đọc được dữ liệu tải lên.", retryFile: "Hãy chọn lại file PDF và thử lại.",
    fileRequired: "Chưa có file PDF trong yêu cầu.", chooseAndAnalyze: "Chọn một file PDF rồi bấm Phân tích.",
    emptyFile: "File đang trống.", chooseWithContent: "Chọn một file PDF có nội dung.",
    tooLarge: "File vượt quá giới hạn tải lên.", limit: (size: number) => `Giới hạn hiện tại là ${size} MB.`, compress: "Nén hoặc chia nhỏ PDF rồi thử lại.",
    notPdf: "File tải lên không phải PDF hợp lệ.", exportPdf: "Xuất tài liệu sang PDF rồi tải lên lại.",
    encrypted: "PDF đang được bảo vệ bằng mật khẩu.", processingFailed: "Không thể xử lý file PDF này.",
    removePassword: "Gỡ mật khẩu khỏi bản sao PDF rồi tải lên lại.", reExport: "Thử xuất lại PDF hoặc dùng một bản không bị hỏng.",
  },
  en: {
    invalidForm: "The uploaded form data could not be read.", retryFile: "Choose the PDF again and retry.",
    fileRequired: "No PDF was included in the request.", chooseAndAnalyze: "Choose a PDF and select Analyze document.",
    emptyFile: "The selected file is empty.", chooseWithContent: "Choose a PDF that contains data.",
    tooLarge: "The file exceeds the upload limit.", limit: (size: number) => `The current limit is ${size} MB.`, compress: "Compress or split the PDF, then retry.",
    notPdf: "The uploaded file is not a valid PDF.", exportPdf: "Export the document as a PDF and upload it again.",
    encrypted: "The PDF is password protected.", processingFailed: "This PDF could not be processed.",
    removePassword: "Remove the password from a copy of the PDF and upload it again.", reExport: "Export the PDF again or use a copy that is not damaged.",
  },
};

export async function POST(request: Request) {
  let locale: AnalysisLocale = request.headers.get("accept-language")?.toLowerCase().startsWith("en") ? "en" : "vi";
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    const copy = routeCopy[locale];
    return errorResponse(400, "INVALID_FORM", copy.invalidForm, undefined, copy.retryFile);
  }

  locale = formData.get("locale") === "en" ? "en" : "vi";
  const copy = routeCopy[locale];

  const candidate = formData.get("file");
  if (!(candidate instanceof File)) {
    return errorResponse(400, "FILE_REQUIRED", copy.fileRequired, undefined, copy.chooseAndAnalyze);
  }

  const maxMegabytes = Number(process.env.MAX_PDF_SIZE_MB || 10);
  const maxBytes = maxMegabytes * 1024 * 1024;
  if (candidate.size === 0) {
    return errorResponse(400, "EMPTY_FILE", copy.emptyFile, undefined, copy.chooseWithContent);
  }
  if (candidate.size > maxBytes) {
    return errorResponse(413, "FILE_TOO_LARGE", copy.tooLarge, copy.limit(maxMegabytes), copy.compress);
  }

  const bytes = new Uint8Array(await candidate.arrayBuffer());
  const isPdf = bytes.length >= 5 && new TextDecoder("ascii").decode(bytes.slice(0, 5)) === "%PDF-";
  if (!isPdf) {
    return errorResponse(415, "NOT_A_PDF", copy.notPdf, undefined, copy.exportPdf);
  }

  try {
    const extracted = await extractPdfText(bytes);
    const parsed = parseDocumentLines(extracted.lines, extracted.pagesWithNoText, locale);
    const aiAssessment = await assessDocument(parsed.lineItems, parsed.refusals, parsed.checks, locale);
    const hasCriticalRefusal = parsed.refusals.some((item) => item.severity === "critical");
    const status: AnalysisResult["status"] = parsed.lineItems.length === 0
      ? "refused"
      : parsed.refusals.length > 0 || hasCriticalRefusal
        ? "partial"
        : "extracted";

    const result: AnalysisResult = {
      document: {
        fileName: candidate.name,
        sizeBytes: candidate.size,
        pageCount: extracted.pageCount,
        processedAt: new Date().toISOString(),
      },
      status,
      ...parsed,
      aiAssessment,
    };
    return NextResponse.json(result);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown PDF processing error";
    const encrypted = /password|encrypted/i.test(detail);
    return errorResponse(
      encrypted ? 422 : 500,
      encrypted ? "ENCRYPTED_PDF" : "PDF_PROCESSING_FAILED",
      encrypted ? copy.encrypted : copy.processingFailed,
      detail,
      encrypted ? copy.removePassword : copy.reExport,
    );
  }
}
