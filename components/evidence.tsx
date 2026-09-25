"use client";

import { useState } from "react";
import { ChevronDown, FileText, Quote } from "lucide-react";
import type { Evidence as EvidenceType } from "@/lib/types";
import { useLocale } from "./locale-provider";

export function Evidence({ evidence, compact = false }: { evidence: EvidenceType; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-moss-100 bg-moss-50 px-2.5 py-1 text-xs font-semibold text-moss-700 transition hover:border-moss-500"
        aria-expanded={open}
      >
        <FileText className="h-3.5 w-3.5" />
        {t("evidencePage", { page: evidence.page })}
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 flex gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm">
          <Quote className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" />
          <div>
            <div className="font-mono text-[13px] leading-relaxed">{evidence.sourceText}</div>
            {evidence.rawValue && (
              <div className="mt-2 text-xs text-slate-500">
                {t("matchedValue")} <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">{evidence.rawValue}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
