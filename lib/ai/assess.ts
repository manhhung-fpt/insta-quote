import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiAssessment, Check, LineItem, Refusal } from "@/lib/types";
import type { AnalysisLocale } from "@/lib/extraction/parser";

type AiPayload = {
  risk: "low" | "medium" | "high";
  summary: string;
  observations: Array<{ title: string; detail: string; evidenceId?: string }>;
};

function hasUntraceableNumber(text: string) {
  return /(?:[$€£]\s*)?\b\d+(?:[.,]\d+)?\b/.test(text);
}

function safeJson(text: string): AiPayload | null {
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const value = JSON.parse(cleaned) as AiPayload;
    if (!["low", "medium", "high"].includes(value.risk)) return null;
    if (typeof value.summary !== "string" || !Array.isArray(value.observations)) return null;
    if (hasUntraceableNumber(value.summary)) return null;
    if (value.observations.some((item) => typeof item.title !== "string" || typeof item.detail !== "string" || hasUntraceableNumber(`${item.title} ${item.detail}`))) return null;
    return value;
  } catch {
    return null;
  }
}

export async function assessDocument(
  lineItems: LineItem[],
  refusals: Refusal[],
  checks: Check[],
  locale: AnalysisLocale = "vi",
): Promise<AiAssessment> {
  const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: "not_configured",
      provider: "Gemini",
      model: modelName,
      risk: "unknown",
      summary: locale === "vi"
        ? "Chưa bật đánh giá AI. Kết quả trích xuất và các kiểm tra quy tắc vẫn hoạt động đầy đủ."
        : "AI review is not enabled. Extraction and deterministic checks are still fully available.",
      observations: [],
      message: locale === "vi"
        ? "Thêm GEMINI_API_KEY vào biến môi trường để bật đánh giá AI."
        : "Add GEMINI_API_KEY to the environment to enable AI review.",
    };
  }

  const evidence = lineItems.map((item) => ({
    id: item.id,
    page: item.evidence.page,
    sourceText: item.evidence.sourceText,
  }));
  const input = {
    evidence,
    refusalReasons: refusals.map(({ code, title, reason }) => ({ code, title, reason })),
    ruleChecks: checks.map(({ status, label, detail }) => ({ status, label, detail })),
  };

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      systemInstruction: [
        "You are a cautious document quality reviewer.",
        "You may assess risk, clarity and recommended human review, but never invent or repeat numerical values.",
        "Only reference evidenceId values provided in the input.",
        locale === "vi" ? "Write concise Vietnamese for non-technical users." : "Write concise English for non-technical users.",
        "Return JSON: {risk: low|medium|high, summary: string, observations: [{title, detail, evidenceId?}] }.",
        "Do not include digits, quantities, prices, page numbers or currency in any prose field.",
      ].join(" "),
    });
    const response = await model.generateContent(JSON.stringify(input));
    const parsed = safeJson(response.response.text());
    if (!parsed) throw new Error("AI response did not pass the evidence safety check");

    return {
      status: "completed",
      provider: "Gemini",
      model: modelName,
      risk: parsed.risk,
      summary: parsed.summary,
      observations: parsed.observations.map((observation) => {
        const item = lineItems.find((candidate) => candidate.id === observation.evidenceId);
        return {
          title: observation.title,
          detail: observation.detail,
          evidence: item?.evidence,
        };
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI provider error";
    return {
      status: "failed",
      provider: "Gemini",
      model: modelName,
      risk: "unknown",
      summary: locale === "vi"
        ? "Không thể hoàn tất đánh giá AI. Kết quả trích xuất bên dưới vẫn giữ nguyên và không bị AI thay đổi."
        : "AI review could not be completed. The extraction below remains unchanged and was not altered by AI.",
      observations: [],
      message,
    };
  }
}
