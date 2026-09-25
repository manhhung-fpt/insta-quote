# Proofline

Evidence-first PDF line-item extraction. The service extracts only values that can be linked to a page and exact source line; uncertain or contradictory content is returned as a readable refusal.

## Stack

- Next.js 15, TypeScript, React 19
- Tailwind CSS
- PDF.js for page-aware text extraction
- Optional Gemini assessment (never used to create or change extracted numbers)
- Vitest

## Run locally

```bash
npm install
node scripts/generate-sample.mjs
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The built-in sample is based on the supplied Ironbark invoice.

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
