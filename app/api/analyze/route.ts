import { NextResponse } from "next/server";
import { assessDocument } from "@/lib/ai/assess";
import { extractPdfText } from "@/lib/extraction/pdf";
import { parseDocumentLines } from "@/lib/extraction/parser";
import type { AnalysisResult, ApiError } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function errorResponse(status: number, code: string, message: string, detail?: string, whatToDo?: string) {
  return NextResponse.json<ApiError>({ error: { code, message, detail, whatToDo } }, { status });
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "INVALID_FORM", "Không đọc được dữ liệu tải lên.", undefined, "Hãy chọn lại file PDF và thử lại.");
  }

  const candidate = formData.get("file");
  if (!(candidate instanceof File)) {
    return errorResponse(400, "FILE_REQUIRED", "Chưa có file PDF trong yêu cầu.", undefined, "Chọn một file PDF rồi bấm Phân tích.");
  }

  const maxMegabytes = Number(process.env.MAX_PDF_SIZE_MB || 10);
  const maxBytes = maxMegabytes * 1024 * 1024;
  if (candidate.size === 0) {
    return errorResponse(400, "EMPTY_FILE", "File đang trống.", undefined, "Chọn một file PDF có nội dung.");
  }
  if (candidate.size > maxBytes) {
    return errorResponse(413, "FILE_TOO_LARGE", "File vượt quá giới hạn tải lên.", `Giới hạn hiện tại là ${maxMegabytes} MB.`, "Nén hoặc chia nhỏ PDF rồi thử lại.");
  }

  const bytes = new Uint8Array(await candidate.arrayBuffer());
  const isPdf = bytes.length >= 5 && new TextDecoder("ascii").decode(bytes.slice(0, 5)) === "%PDF-";
  if (!isPdf) {
    return errorResponse(415, "NOT_A_PDF", "File tải lên không phải PDF hợp lệ.", undefined, "Xuất tài liệu sang PDF rồi tải lên lại.");
  }

  try {
    const extracted = await extractPdfText(bytes);
    const parsed = parseDocumentLines(extracted.lines, extracted.pagesWithNoText);
    const aiAssessment = await assessDocument(parsed.lineItems, parsed.refusals, parsed.checks);
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
      encrypted ? "PDF đang được bảo vệ bằng mật khẩu." : "Không thể xử lý file PDF này.",
      detail,
      encrypted ? "Gỡ mật khẩu khỏi bản sao PDF rồi tải lên lại." : "Thử xuất lại PDF hoặc dùng một bản không bị hỏng.",
    );
  }
}
