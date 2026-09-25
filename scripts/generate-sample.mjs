import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(currentDir, "..", "public", "samples");
fs.mkdirSync(outputDir, { recursive: true });

const escapePdf = (value) => value.replace(/([\\()])/g, "\\$1");
const text = (value, x, y, size = 12, font = "F1") =>
  `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdf(value)}) Tj ET`;

const commands = [
  text("Ironbark Trade Merchants Ltd", 55, 545, 22, "F2"),
  text("Tax Invoice", 55, 515, 15),
  text("Document No: IB-55871", 55, 475),
  text("Date: 5 August 2026", 55, 456),
  text("Bill to: Coastal Build Co", 55, 437),
  text("Job ref: CB-2216", 55, 418),
  text("Code", 55, 350, 11, "F2"),
  text("Description", 130, 350, 11, "F2"),
  text("Qty", 450, 350, 11, "F2"),
  text("Unit", 520, 350, 11, "F2"),
  text("Unit Price", 600, 350, 11, "F2"),
  text("Amount", 720, 350, 11, "F2"),
  "55 344 m 790 344 l S",
  text("FX-201", 55, 318), text("Framing nail gun coil, 90mm galv", 130, 318), text("24", 450, 318), text("box", 520, 318), text("$52.00", 600, 318), text("$1,248.00", 720, 318),
  text("FX-118", 55, 290), text("Timber connector bolts M12x150", 130, 290), text("60", 450, 290), text("ea", 520, 290), text("$3.40", 600, 290), text("$204.00", 720, 290),
  text("RF-330", 55, 262), text("Roofing screws Type 17, 65mm", 130, 262), text("10", 450, 262), text("box", 520, 262), text("$46.50", 600, 262), text("$465.00", 720, 262),
  text("IN-045", 55, 234), text("R2.6 wall insulation batts, pack", 130, 234), text("22", 450, 234), text("pack", 520, 234), text("$61.00", 600, 234), text("$1,342.00", 720, 234),
  text("Subtotal:", 470, 175), text("$3,259.00", 720, 175),
  text("GST (15%):", 470, 150), text("$488.85", 720, 150),
  text("Total (incl GST):", 470, 125, 12, "F2"), text("$3,747.85", 720, 125, 12, "F2"),
  text("Payment due 20 days from invoice date.", 55, 70, 10),
].join("\n");

const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  `<< /Length ${Buffer.byteLength(commands)} >>\nstream\n${commands}\nendstream`,
];

let pdf = "%PDF-1.4\n";
const offsets = [0];
objects.forEach((object, index) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
});
const xrefOffset = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

fs.writeFileSync(path.join(outputDir, "ironbark-invoice.pdf"), Buffer.from(pdf));
