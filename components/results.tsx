"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Copy,
  FileJson,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Evidence } from "./evidence";
import { formatBytes, formatMoney } from "@/lib/format";
import type { AnalysisResult } from "@/lib/types";
import { useLocale } from "./locale-provider";

type Tab = "overview" | "items" | "refusals" | "json";

function StatusPill({ result }: { result: AnalysisResult }) {
  const { t } = useLocale();
  if (result.status === "extracted") {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-100 px-3 py-1.5 text-xs font-bold text-moss-700"><CheckCircle2 className="h-3.5 w-3.5" /> {t("extracted")}</span>;
  }
  if (result.status === "partial") {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800"><AlertTriangle className="h-3.5 w-3.5" /> {t("needsReview")}</span>;
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-rust-100 px-3 py-1.5 text-xs font-bold text-rust-700"><CircleAlert className="h-3.5 w-3.5" /> {t("refused")}</span>;
}

function EmptyItems() {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <ShieldCheck className="mx-auto h-9 w-9 text-slate-400" />
      <h3 className="mt-3 font-semibold text-ink">{t("noNumbers")}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{t("noNumbersDetail")}</p>
    </div>
  );
}

function Items({ result }: { result: AnalysisResult }) {
  const { t } = useLocale();
  if (result.lineItems.length === 0) return <EmptyItems />;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4 font-semibold">{t("item")}</th>
              <th className="px-4 py-4 font-semibold">{t("quantity")}</th>
              <th className="px-4 py-4 font-semibold">{t("unit")}</th>
              <th className="px-4 py-4 font-semibold">{t("unitPrice")}</th>
              <th className="px-5 py-4 text-right font-semibold">{t("amount")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {result.lineItems.map((item) => (
              <tr key={item.id} className="align-top transition hover:bg-moss-50/40">
                <td className="px-5 py-4">
                  {item.code && <div className="mb-1 font-mono text-xs font-bold text-moss-700">{item.code}</div>}
                  <div className="max-w-sm font-semibold text-ink">{item.description}</div>
                  <Evidence evidence={item.evidence} compact />
                </td>
                <td className="px-4 py-4 font-semibold text-slate-700">{item.quantity?.value ?? "—"}</td>
                <td className="px-4 py-4 text-slate-600">{item.unit ?? "—"}</td>
                <td className="px-4 py-4 font-semibold text-slate-700">{item.unitPrice ? formatMoney(item.unitPrice.value) : "—"}</td>
                <td className="px-5 py-4 text-right font-bold text-ink">{item.amount ? formatMoney(item.amount.value) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.totals.length > 0 && (
        <div className="border-t border-slate-200 bg-[#fbfaf7] px-5 py-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t("documentTotals")}</p>
          <div className="ml-auto max-w-sm space-y-3">
            {result.totals.map((total, index) => (
              <div key={`${total.label}-${index}`} className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold capitalize text-slate-600">{total.label}</span>
                  <Evidence evidence={total.amount.evidence} compact />
                </div>
                <span className="font-bold text-ink">{formatMoney(total.amount.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Refusals({ result }: { result: AnalysisResult }) {
  const { t } = useLocale();
  if (result.refusals.length === 0) {
    return (
      <div className="rounded-2xl border border-moss-100 bg-moss-50 px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-moss-600" />
        <h3 className="mt-3 font-semibold text-moss-900">{t("noRefusals")}</h3>
        <p className="mt-1 text-sm text-moss-700">{t("noRefusalsDetail")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        <strong>{t("refusalIntroStrong")}</strong> {t("refusalIntro")}
      </div>
      {result.refusals.map((refusal) => (
        <article key={refusal.id} className={`rounded-2xl border p-5 ${refusal.severity === "critical" ? "border-rust-100 bg-rust-50/60" : "border-amber-200 bg-amber-50/50"}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${refusal.severity === "critical" ? "bg-rust-100 text-rust-700" : "bg-amber-100 text-amber-800"}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-ink">{refusal.title}</h3>
                {refusal.page && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{t("page", { page: refusal.page })}</span>}
              </div>
              <p className="mt-1.5 text-sm leading-6 text-slate-700">{refusal.reason}</p>
              <div className="mt-3 rounded-xl bg-white/80 px-3.5 py-3 text-sm text-slate-700">
                <span className="font-bold text-moss-700">{t("whatToDo")}</span> {refusal.whatToDo}
              </div>
              {refusal.sourceText && <Evidence evidence={{ page: refusal.page ?? 1, sourceText: refusal.sourceText }} />}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function AiCard({ result }: { result: AnalysisResult }) {
  const { t } = useLocale();
  const assessment = result.aiAssessment;
  const riskLabel = { low: t("riskLow"), medium: t("riskMedium"), high: t("riskHigh"), unknown: t("riskUnknown") }[assessment.risk];
  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Sparkles className="h-5 w-5" /></span>
          <div>
            <h3 className="font-bold text-ink">{t("aiReview")}</h3>
            <p className="text-xs text-slate-500">{assessment.provider} · {assessment.model}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${assessment.risk === "high" ? "bg-rust-100 text-rust-700" : assessment.risk === "medium" ? "bg-amber-100 text-amber-800" : assessment.risk === "low" ? "bg-moss-100 text-moss-700" : "bg-slate-100 text-slate-600"}`}>{riskLabel}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{assessment.summary}</p>
      {assessment.message && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-500">{assessment.message}</p>}
      {assessment.observations.length > 0 && (
        <div className="mt-4 space-y-3">
          {assessment.observations.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-sm font-bold text-slate-800">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
              {item.evidence && <Evidence evidence={item.evidence} compact />}
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 flex items-center gap-1.5 text-xs text-violet-700"><Bot className="h-3.5 w-3.5" /> {t("aiBoundary")}</p>
    </div>
  );
}

function Overview({ result }: { result: AnalysisResult }) {
  const { t } = useLocale();
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <PackageCheck className="h-5 w-5 text-moss-600" />
            <p className="mt-4 text-2xl font-bold text-ink">{result.lineItems.length}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{t("sourcedLines")}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="mt-4 text-2xl font-bold text-ink">{result.refusals.length}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{t("reviewPoints")}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <FileJson className="h-5 w-5 text-slate-500" />
            <p className="mt-4 text-2xl font-bold text-ink">{result.document.pageCount}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{t("pagesRead")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-moss-600" /><h3 className="font-bold text-ink">{t("automatedChecks")}</h3></div>
          <div className="space-y-3">
            {result.checks.map((check) => (
              <div key={check.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${check.status === "passed" ? "bg-moss-100 text-moss-700" : check.status === "warning" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-500"}`}>
                  {check.status === "passed" ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <div><p className="text-sm font-bold text-slate-800">{check.label}</p><p className="mt-0.5 text-sm leading-5 text-slate-500">{check.detail}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AiCard result={result} />
    </div>
  );
}

export function Results({ result }: { result: AnalysisResult }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>(result.refusals.length > 0 ? "refusals" : "overview");
  const [copied, setCopied] = useState(false);
  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: t("overview") },
    { id: "items", label: t("items") },
    { id: "refusals", label: t("refusals") },
    { id: "json", label: "JSON" },
  ];

  return (
    <section className="mt-8 overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-soft">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-2xl font-semibold text-ink">{t("results")}</h2><StatusPill result={result} /></div>
            <p className="mt-1 text-sm text-slate-500">{result.document.fileName} · {formatBytes(result.document.sizeBytes)}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-moss-50 px-3 py-2 text-xs font-semibold text-moss-700"><ShieldCheck className="h-4 w-4" /> {t("noGuessing")}</div>
        </div>
      </div>
      <div className="border-b border-slate-200 px-3 sm:px-6">
        <div className="flex overflow-x-auto" role="tablist">
          {tabs.map((item) => {
            const count = item.id === "items" ? result.lineItems.length : item.id === "refusals" ? result.refusals.length : null;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`focus-ring whitespace-nowrap border-b-2 px-4 py-4 text-sm font-bold transition ${tab === item.id ? "border-moss-600 text-moss-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                {item.label}{count !== null && <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === item.id ? "bg-moss-100" : "bg-slate-100"}`}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-5 sm:p-7" role="tabpanel">
        {tab === "overview" && <Overview result={result} />}
        {tab === "items" && <Items result={result} />}
        {tab === "refusals" && <Refusals result={result} />}
        {tab === "json" && (
          <div className="relative">
            <button type="button" onClick={copyJson} className="focus-ring absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:text-moss-700">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? t("copied") : t("copy")}
            </button>
            <pre className="max-h-[560px] overflow-auto rounded-2xl bg-[#172126] p-5 pt-14 text-xs leading-6 text-emerald-100">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </section>
  );
}
