"use client";

import { useCallback, useState } from "react";
import { AlertCircle, ArrowDown, LockKeyhole, ScanSearch, ShieldCheck } from "lucide-react";
import { Results } from "@/components/results";
import { Uploader } from "@/components/uploader";
import type { AnalysisResult, ApiError } from "@/lib/types";

type Failure = { message: string; detail?: string; whatToDo?: string };

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  const handleFile = useCallback((nextFile: File | null) => {
    setFile(nextFile);
    setResult(null);
    setFailure(null);
  }, []);

  const loadSample = useCallback(async () => {
    setFailure(null);
    try {
      const response = await fetch("/samples/ironbark-invoice.pdf");
      if (!response.ok) throw new Error("Không tải được file mẫu.");
      const blob = await response.blob();
      handleFile(new File([blob], "ironbark-invoice.pdf", { type: "application/pdf" }));
    } catch (error) {
      setFailure({
        message: "Không thể mở hóa đơn mẫu.",
        detail: error instanceof Error ? error.message : undefined,
        whatToDo: "Hãy chọn một file PDF từ máy của bạn.",
      });
    }
  }, [handleFile]);

  const analyze = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setFailure(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/analyze", { method: "POST", body });
      const payload = await response.json() as AnalysisResult | ApiError;
      if (!response.ok || "error" in payload) {
        if ("error" in payload) {
          throw Object.assign(new Error(payload.error.message), { detail: payload.error.detail, whatToDo: payload.error.whatToDo });
        }
        throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
      }
      setResult(payload);
      window.setTimeout(() => document.getElementById("analysis-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (error) {
      const known = error as Error & { detail?: string; whatToDo?: string };
      setFailure({
        message: known.message || "Không thể phân tích tài liệu.",
        detail: known.detail,
        whatToDo: known.whatToDo || "Kiểm tra kết nối rồi thử lại. File của bạn chưa được trích xuất.",
      });
    } finally {
      setLoading(false);
    }
  }, [file]);

  return (
    <main className="grain min-h-screen">
      <header className="border-b border-slate-900/5 bg-paper/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss-700 text-white"><ScanSearch className="h-5 w-5" /></div>
            <span className="font-display text-xl font-bold tracking-tight text-ink">Proofline</span>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex"><LockKeyhole className="h-4 w-4 text-moss-600" /> Evidence-first extraction</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1fr_.82fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-moss-100 bg-white/70 px-3 py-1.5 text-xs font-bold text-moss-700 shadow-sm"><ShieldCheck className="h-4 w-4" /> Có nguồn mới có số</div>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-6xl">
              Đọc tài liệu.<br /><span className="italic text-moss-700">Không đoán.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Trích xuất dòng hàng từ invoice, packing list và delivery docket — kèm đúng trang, nguyên văn nguồn và lý do rõ ràng cho mọi nội dung bị từ chối.
            </p>
            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
              {["Bằng chứng từng số", "Nêu rõ mâu thuẫn", "AI không sửa dữ liệu"].map((text) => (
                <div key={text} className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-moss-100 text-moss-700">✓</span>{text}</div>
              ))}
            </div>
            <ArrowDown className="mt-10 hidden h-5 w-5 animate-bounce text-slate-400 lg:block" />
          </div>
          <Uploader file={file} loading={loading} onFile={handleFile} onAnalyze={analyze} onSample={loadSample} />
        </section>

        {failure && (
          <section className="mt-8 rounded-2xl border border-rust-100 bg-rust-50 p-5" role="alert">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rust-100 text-rust-700"><AlertCircle className="h-5 w-5" /></span>
              <div>
                <h2 className="font-bold text-rust-700">{failure.message}</h2>
                {failure.detail && <p className="mt-1 break-words text-sm leading-6 text-slate-600">Chi tiết: {failure.detail}</p>}
                {failure.whatToDo && <p className="mt-2 text-sm leading-6 text-slate-700"><strong>Bạn có thể làm gì:</strong> {failure.whatToDo}</p>}
              </div>
            </div>
          </section>
        )}

        <div id="analysis-result" className="scroll-mt-4">{result && <Results key={result.document.processedAt} result={result} />}</div>

        <section className="mt-16 border-t border-slate-900/10 pt-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["01", "Đọc theo trang", "Giữ lại vị trí và nguyên văn của từng dòng trong PDF."],
              ["02", "Trích xuất bảo thủ", "Dòng mơ hồ bị từ chối thay vì được điền bằng phỏng đoán."],
              ["03", "Kiểm tra độc lập", "Quy tắc số học và AI đánh giá rủi ro mà không sửa dữ liệu nguồn."],
            ].map(([number, title, copy]) => (
              <div key={number} className="flex gap-4"><span className="font-mono text-xs font-bold text-moss-600">{number}</span><div><h3 className="font-bold text-ink">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{copy}</p></div></div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
