export type Evidence = {
  page: number;
  sourceText: string;
  rawValue?: string;
};

export type SourcedNumber = {
  value: number;
  evidence: Evidence;
};

export type LineItem = {
  id: string;
  code?: string;
  description: string;
  quantity?: SourcedNumber;
  unit?: string;
  unitPrice?: SourcedNumber;
  amount?: SourcedNumber;
  evidence: Evidence;
};

export type DocumentTotal = {
  label: string;
  amount: SourcedNumber;
};

export type RefusalCode =
  | "NO_TEXT_LAYER"
  | "NO_TABLE_HEADER"
  | "AMBIGUOUS_ROW"
  | "MISSING_EVIDENCE"
  | "CONTRADICTORY_VALUES"
  | "ARITHMETIC_MISMATCH"
  | "UNSUPPORTED_LAYOUT"
  | "ENCRYPTED_PDF";

export type Refusal = {
  id: string;
  code: RefusalCode;
  title: string;
  reason: string;
  whatToDo: string;
  page?: number;
  sourceText?: string;
  severity: "warning" | "critical";
};

export type Check = {
  id: string;
  status: "passed" | "warning" | "not_run";
  label: string;
  detail: string;
};

export type AiAssessment = {
  status: "completed" | "not_configured" | "failed";
  provider: "Gemini";
  model: string;
  risk: "low" | "medium" | "high" | "unknown";
  summary: string;
  observations: Array<{
    title: string;
    detail: string;
    evidence?: Evidence;
  }>;
  message?: string;
};

export type AnalysisResult = {
  document: {
    fileName: string;
    sizeBytes: number;
    pageCount: number;
    processedAt: string;
  };
  status: "extracted" | "partial" | "refused";
  lineItems: LineItem[];
  totals: DocumentTotal[];
  refusals: Refusal[];
  checks: Check[];
  aiAssessment: AiAssessment;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    detail?: string;
    whatToDo?: string;
  };
};
