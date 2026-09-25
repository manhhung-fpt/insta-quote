"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "vi" | "en";

const vi = {
  evidencePage: "Trang {page} · Xem nguồn",
  matchedValue: "Giá trị khớp:",
  dropPdf: "Thả PDF vào đây",
  uploadPromise: "Hệ thống chỉ xuất số khi có thể chỉ ra chính xác trang và dòng nguồn.",
  choosePdf: "Chọn file PDF",
  useSample: "Dùng hóa đơn mẫu",
  uploadLimit: "PDF tối đa 10 MB · File không được lưu sau khi xử lý",
  ready: "Sẵn sàng phân tích",
  removeFile: "Bỏ file",
  analyzing: "Đang đọc và kiểm chứng tài liệu…",
  analyze: "Phân tích tài liệu",
  overview: "Tổng quan",
  items: "Dòng hàng",
  refusals: "Cần kiểm tra",
  extracted: "Đã trích xuất",
  needsReview: "Cần kiểm tra",
  refused: "Đã từ chối trích xuất",
  noNumbers: "Không có số nào được xuất",
  noNumbersDetail: "Bằng chứng hiện tại chưa đủ chắc chắn. Đây là kết quả an toàn — xem tab “Cần kiểm tra” để biết lý do cụ thể.",
  item: "Mặt hàng",
  quantity: "Số lượng",
  unit: "Đơn vị",
  unitPrice: "Đơn giá",
  amount: "Thành tiền",
  documentTotals: "Tổng ghi trên tài liệu",
  noRefusals: "Không có nội dung bị từ chối",
  noRefusalsDetail: "Tất cả dòng được nhận diện đều có bằng chứng đủ rõ.",
  refusalIntroStrong: "Không phải lỗi hệ thống.",
  refusalIntro: "Đây là những chỗ tài liệu chưa đủ rõ hoặc đang tự mâu thuẫn; hệ thống chủ động không đoán.",
  page: "Trang {page}",
  whatToDo: "Nên làm gì:",
  riskLow: "Rủi ro thấp",
  riskMedium: "Nên kiểm tra",
  riskHigh: "Rủi ro cao",
  riskUnknown: "Chưa đánh giá",
  aiReview: "AI đánh giá tài liệu",
  aiBoundary: "AI chỉ đánh giá; không tạo hoặc sửa số liệu trích xuất.",
  sourcedLines: "Dòng có bằng chứng",
  reviewPoints: "Điểm cần kiểm tra",
  pagesRead: "Trang đã đọc",
  automatedChecks: "Kiểm tra tự động",
  results: "Kết quả phân tích",
  noGuessing: "Không đoán số liệu",
  copied: "Đã sao chép",
  copy: "Sao chép",
  language: "Ngôn ngữ",
  sourceFirst: "Có nguồn mới có số",
  heroLine1: "Đọc tài liệu.",
  heroLine2: "Không đoán.",
  heroCopy: "Trích xuất dòng hàng từ invoice, packing list và delivery docket — kèm đúng trang, nguyên văn nguồn và lý do rõ ràng cho mọi nội dung bị từ chối.",
  benefitEvidence: "Bằng chứng từng số",
  benefitConflict: "Nêu rõ mâu thuẫn",
  benefitAi: "AI không sửa dữ liệu",
  detail: "Chi tiết:",
  recovery: "Bạn có thể làm gì:",
  process1Title: "Đọc theo trang",
  process1Copy: "Giữ lại vị trí và nguyên văn của từng dòng trong PDF.",
  process2Title: "Trích xuất bảo thủ",
  process2Copy: "Dòng mơ hồ bị từ chối thay vì được điền bằng phỏng đoán.",
  process3Title: "Kiểm tra độc lập",
  process3Copy: "Quy tắc số học và AI đánh giá rủi ro mà không sửa dữ liệu nguồn.",
  sampleLoadError: "Không tải được file mẫu.",
  sampleOpenError: "Không thể mở hóa đơn mẫu.",
  chooseLocalPdf: "Hãy chọn một file PDF từ máy của bạn.",
  invalidServerData: "Máy chủ trả về dữ liệu không hợp lệ.",
  analysisError: "Không thể phân tích tài liệu.",
  retryConnection: "Kiểm tra kết nối rồi thử lại. File của bạn chưa được trích xuất.",
} as const;

type TranslationKey = keyof typeof vi;

const en: Record<TranslationKey, string> = {
  evidencePage: "Page {page} · View source",
  matchedValue: "Matched value:",
  dropPdf: "Drop your PDF here",
  uploadPromise: "A number is returned only when its exact page and source line can be shown.",
  choosePdf: "Choose PDF",
  useSample: "Use sample invoice",
  uploadLimit: "PDF up to 10 MB · Files are not retained after processing",
  ready: "Ready to analyze",
  removeFile: "Remove file",
  analyzing: "Reading and verifying the document…",
  analyze: "Analyze document",
  overview: "Overview",
  items: "Line items",
  refusals: "Needs review",
  extracted: "Extracted",
  needsReview: "Needs review",
  refused: "Extraction refused",
  noNumbers: "No numbers were returned",
  noNumbersDetail: "The available evidence is not strong enough. This is a safe result — open “Needs review” for the exact reasons.",
  item: "Item",
  quantity: "Quantity",
  unit: "Unit",
  unitPrice: "Unit price",
  amount: "Amount",
  documentTotals: "Totals printed on the document",
  noRefusals: "Nothing was refused",
  noRefusalsDetail: "Every recognized row had sufficiently clear evidence.",
  refusalIntroStrong: "This is not a system error.",
  refusalIntro: "These parts are unclear or contradict one another, so the system deliberately did not guess.",
  page: "Page {page}",
  whatToDo: "What to do:",
  riskLow: "Low risk",
  riskMedium: "Review recommended",
  riskHigh: "High risk",
  riskUnknown: "Not assessed",
  aiReview: "AI document review",
  aiBoundary: "AI reviews quality only; it cannot create or change extracted numbers.",
  sourcedLines: "Sourced lines",
  reviewPoints: "Review points",
  pagesRead: "Pages read",
  automatedChecks: "Automated checks",
  results: "Analysis results",
  noGuessing: "No guessed data",
  copied: "Copied",
  copy: "Copy",
  language: "Language",
  sourceFirst: "No source, no number",
  heroLine1: "Read documents.",
  heroLine2: "Never guess.",
  heroCopy: "Extract line items from invoices, packing lists, and delivery dockets — with the exact page, source text, and a clear reason for anything refused.",
  benefitEvidence: "Evidence for every number",
  benefitConflict: "Contradictions surfaced",
  benefitAi: "AI cannot alter data",
  detail: "Details:",
  recovery: "What you can do:",
  process1Title: "Read page by page",
  process1Copy: "Preserve the location and exact source text of every PDF line.",
  process2Title: "Extract conservatively",
  process2Copy: "Refuse ambiguous rows instead of filling gaps with guesses.",
  process3Title: "Check independently",
  process3Copy: "Arithmetic rules and AI assess risk without changing source data.",
  sampleLoadError: "The sample file could not be downloaded.",
  sampleOpenError: "The sample invoice could not be opened.",
  chooseLocalPdf: "Choose a PDF from your computer instead.",
  invalidServerData: "The server returned an invalid response.",
  analysisError: "The document could not be analyzed.",
  retryConnection: "Check your connection and try again. No data was extracted from your file.",
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  useEffect(() => {
    const saved = window.localStorage.getItem("proofline-locale");
    const browserLocale = navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
    setLocaleState(saved === "vi" || saved === "en" ? saved : browserLocale);
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("proofline-locale", next);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key, values) => {
      let message = (locale === "vi" ? vi : en)[key];
      for (const [name, replacement] of Object.entries(values ?? {})) {
        message = message.replaceAll(`{${name}}`, String(replacement));
      }
      return message;
    },
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="flex items-center gap-2" aria-label={t("language")}>
      <span className={`text-xs font-bold transition ${locale === "vi" ? "text-moss-700" : "text-slate-400"}`}>VI</span>
      <button
        type="button"
        role="switch"
        aria-checked={locale === "en"}
        aria-label={t("language")}
        onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
        className="focus-ring relative h-7 w-12 rounded-full bg-moss-700 p-1 shadow-inner transition"
      >
        <span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${locale === "en" ? "translate-x-5" : "translate-x-0"}`} />
      </button>
      <span className={`text-xs font-bold transition ${locale === "en" ? "text-moss-700" : "text-slate-400"}`}>EN</span>
    </div>
  );
}
