"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowRight, FileCheck2, FileText, LoaderCircle, UploadCloud, X } from "lucide-react";
import { formatBytes } from "@/lib/format";

type Props = {
  file: File | null;
  loading: boolean;
  onFile: (file: File | null) => void;
  onAnalyze: () => void;
  onSample: () => void;
};

export function Uploader({ file, loading, onFile, onAnalyze, onSample }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = useCallback((candidate?: File) => {
    if (candidate) onFile(candidate);
  }, [onFile]);

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-6">
      {!file ? (
        <div
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            accept(event.dataTransfer.files[0]);
          }}
          className={`rounded-[22px] border-2 border-dashed px-5 py-10 text-center transition sm:py-14 ${dragging ? "border-moss-500 bg-moss-50" : "border-slate-200 bg-[#fbfaf7] hover:border-moss-500/60"}`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-moss-100 text-moss-700">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold text-ink">Thả PDF vào đây</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Hệ thống chỉ xuất số khi có thể chỉ ra chính xác trang và dòng nguồn.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="focus-ring rounded-xl bg-moss-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-moss-900"
            >
              Chọn file PDF
            </button>
            <button
              type="button"
              onClick={onSample}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-moss-500 hover:text-moss-700"
            >
              Dùng hóa đơn mẫu
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-400">PDF tối đa 10 MB · File không được lưu sau khi xử lý</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => accept(event.target.files?.[0])}
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-4 rounded-2xl border border-moss-100 bg-moss-50 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-moss-700 shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{file.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{formatBytes(file.size)} · Sẵn sàng phân tích</p>
            </div>
            {!loading && (
              <button
                type="button"
                onClick={() => onFile(null)}
                aria-label="Bỏ file"
                className="focus-ring rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-rust-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={loading}
            className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-moss-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-moss-900 disabled:cursor-wait disabled:opacity-80"
          >
            {loading ? (
              <><LoaderCircle className="h-5 w-5 animate-spin" /> Đang đọc và kiểm chứng tài liệu…</>
            ) : (
              <><FileCheck2 className="h-5 w-5" /> Phân tích tài liệu <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
