# Proofline

Evidence-first PDF line-item extraction. The service extracts only values that can be linked to a page and exact source line; uncertain or contradictory content is returned as a readable refusal.

## Stack

- Next.js 15, TypeScript, React 19
- Tailwind CSS
- PDF.js for page-aware text extraction
- Optional Gemini assessment (never used to create or change extracted numbers)
- Vietnamese/English interface with a persistent language toggle
- Vitest

## Run locally

```bash
npm install
node scripts/generate-sample.mjs
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The built-in sample is based on the supplied Ironbark invoice.

Use the `VI / EN` switch in the header to change the full interface language. The selected locale is persisted locally and is sent to the analysis API so validation errors, refusals, checks, and AI review use the same language.

Extraction works without any AI key. To enable the AI review card, add `GEMINI_API_KEY` to `.env.local`. The default is the stable, throughput-oriented `gemini-3.5-flash-lite`; `GEMINI_MODEL` remains configurable so the deployment can follow account availability without changing code.

## API

`POST /api/analyze` with `multipart/form-data`, field name `file`.

Successful responses contain:

- `lineItems`: conservative extraction; every numeric field has `{ value, evidence: { page, sourceText, rawValue } }`
- `totals`: totals explicitly printed in the document, also with evidence
- `refusals`: skipped/contradictory content, the exact reason, the source where available, and what a person should do next
- `checks`: deterministic safety checks
- `aiAssessment`: optional qualitative document review; it cannot mutate extraction output

The API validates PDF signatures and file size. Image-only pages are not OCR-guessed: they produce a `NO_TEXT_LAYER` refusal.

## Safety boundary

The extraction pipeline is deterministic. AI sees only already-sourced evidence and refusal/check summaries. Its prose response is rejected if it contains a number, and an AI outage never changes the extraction result.

## Verify

```bash
npm test
npm run build
```

## Known scope

This time-boxed version supports common single-line invoice, packing-list and docket tables. Complex merged cells, rotated text, handwriting and scans require an OCR/layout stage; those inputs are intentionally refused instead of guessed.

## Engineering reflection

### What was the hardest decision, and why did I choose that approach?

The hardest decision was where to place AI in the pipeline. Using a model for extraction would improve recall across varied layouts, but it would also make the core requirement, never return a number without evidence harder to enforce and test. I therefore made extraction deterministic and deliberately conservative: PDF.js reconstructs page aware source lines, strict parsers accept only recognizable table rows, and every numeric field is created together with its page, source line, and raw token. AI runs afterward as a qualitative reviewer and cannot mutate extraction output. Its response is also rejected if its prose introduces a number.

This choice sacrifices recall for auditability. In this product, a visible refusal is recoverable; a plausible but unsupported amount can silently enter a downstream workflow and is much more expensive.

### Where am I not confident?

The largest uncertainty is document-layout coverage. PDF text layers do not guarantee reading order, and the current line reconstruction uses coordinate grouping plus patterns aimed at common single-line tables. It will intentionally refuse, and may over-refuse, documents with wrapped descriptions, merged cells, repeated headers, rotated pages, unusual decimal conventions, or text positioned one character at a time. The six supplied documents should be treated as a starting corpus rather than proof of general accuracy.

I would also want more production evidence around encrypted/malformed PDFs, memory use on large documents, and Gemini quota/provider failures. The AI path is isolated and fails safely, but real provider behavior and Vietnamese/English response quality still need monitoring with representative traffic.

### What would I do with three more days?

1. Build an evaluation harness from annotated PDFs, measuring field-level precision, recall, refusal rate, and evidence correctness. Add adversarial fixtures for contradictions, locale-specific numbers, reordered text, and malformed files.
2. Replace the regex-first table reader with a coordinate-aware column model that supports wrapped and multi-line rows. Add an OCR path for scanned pages, but only emit OCR values when their bounding boxes and confidence can be surfaced as evidence; otherwise keep the refusal.
3. Add a side-by-side PDF viewer that highlights the exact source region when evidence is opened, plus structured logs, request limits, timeouts, file-type hardening, accessibility tests, and deployment/CI configuration.
