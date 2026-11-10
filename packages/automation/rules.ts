/** Local, deterministic rules. Inquiry text is inert data, never instructions. */
export const ANALYSIS_RULES_VERSION = "local-rules-v1";
export const rateDefinitions = [
  { key: "discovery", label: "Discovery & requirements", unitPriceSen: 30000 },
  { key: "website", label: "Website foundation", unitPriceSen: 180000 },
  {
    key: "commerce",
    label: "Commerce catalogue & checkout",
    unitPriceSen: 240000,
  },
  { key: "booking", label: "Booking workflow", unitPriceSen: 120000 },
  {
    key: "automation",
    label: "Internal automation workflow",
    unitPriceSen: 150000,
  },
  { key: "reporting", label: "Dashboard & reporting", unitPriceSen: 90000 },
] as const;
export type Requirement = {
  key: string;
  label: string;
  reason: string;
  quantity: number;
};
export type AnalysisResult = {
  rulesVersion: string;
  requirements: Requirement[];
  summary: string;
  warnings: string[];
};
const rules = [
  { key: "website", terms: ["website", "web site", "landing", "portfolio"] },
  {
    key: "commerce",
    terms: ["shop", "store", "cart", "checkout", "inventory", "commerce"],
  },
  {
    key: "booking",
    terms: ["booking", "appointment", "reservation", "schedule"],
  },
  {
    key: "automation",
    terms: [
      "automation",
      "workflow",
      "follow-up",
      "follow up",
      "email",
      "whatsapp",
    ],
  },
  { key: "reporting", terms: ["dashboard", "report", "analytics"] },
] as const;
export function analyzeInquiry(brief: string): AnalysisResult {
  const normalized = brief.toLowerCase().replace(/\s+/g, " ").trim();
  const requirements: Requirement[] = [
    {
      key: "discovery",
      label: rateDefinitions[0].label,
      quantity: 1,
      reason: "Every project starts with human requirements review.",
    },
  ];
  for (const rule of rules) {
    const matched = rule.terms.filter((term) => normalized.includes(term));
    if (matched.length)
      requirements.push({
        key: rule.key,
        label: rateDefinitions.find((rate) => rate.key === rule.key)!.label,
        quantity: 1,
        reason: `Matched keywords: ${matched.join(", ")}.`,
      });
  }
  return {
    rulesVersion: ANALYSIS_RULES_VERSION,
    requirements,
    summary: `${requirements.length} suggested work packages from local keyword rules. A human must review scope and pricing.`,
    warnings: [
      "Deterministic demonstration, not a paid AI model.",
      "No external messages, integrations or real payment processing are included.",
      ...(requirements.length === 1
        ? [
            "No specialist keywords matched; clarify requirements with the fictional customer.",
          ]
        : []),
    ],
  };
}
export type QuoteLine = {
  key: string;
  label: string;
  quantity: number;
  unitPriceSen: number;
};
export function quoteTotals(lines: QuoteLine[], discountPct: number) {
  const subtotalSen = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPriceSen,
    0,
  );
  const discountSen = Math.floor((subtotalSen * discountPct + 50) / 100);
  return { subtotalSen, discountSen, totalSen: subtotalSen - discountSen };
}
/** Parse plain RM decimals to integer sen; no floating-point multiplication. */
export function parseSen(
  value: string,
  maximum = 1000000,
  allowZero = false,
): number {
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(value))
    throw new Error("Use a plain RM amount with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const sen = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (sen < (allowZero ? 0 : 1) || sen > maximum)
    throw new Error("Amount is outside the demo limit.");
  return sen;
}
