import type { AutomationView } from "../automation/index.ts";
export const workflowStages = [
  "Inquiry",
  "Qualification",
  "Quotation Draft",
  "Human Review",
  "Approved Proposal",
  "Follow-up",
] as const;
export type WorkflowStage = (typeof workflowStages)[number];
export type InquiryWorkflow = {
  inquiryId: string;
  stage: WorkflowStage;
  analysisId: string | null;
  quoteId: string | null;
  canReview: boolean;
  canPrepare: boolean;
  canFollowUp: boolean;
  steps: { name: WorkflowStage; status: "done" | "current" | "pending" }[];
};
/** View-only progress. Server Automation permissions and revision checks remain authoritative. */
export function workflowFor(
  inquiryId: string,
  view: Pick<AutomationView, "inquiries" | "analyses" | "quotes" | "followups">,
): InquiryWorkflow | null {
  if (!view.inquiries.some((row) => row.id === inquiryId)) return null;
  const analysis = view.analyses.find((row) => row.inquiryId === inquiryId);
  const quote = view.quotes.find((row) => row.inquiryId === inquiryId);
  const reviewed =
    !!analysis &&
    !!quote &&
    quote.approval?.revision === quote.revision &&
    ["Approved", "Ready"].includes(quote.status);
  const ready = reviewed && quote?.status === "Ready";
  const followed =
    ready && view.followups.some((row) => row.inquiryId === inquiryId);
  const completed = [
    true,
    !!analysis,
    !!analysis && !!quote,
    reviewed,
    ready,
    followed,
  ];
  const current = !analysis ? 1 : !quote ? 2 : !reviewed ? 3 : !ready ? 4 : 5;
  return {
    inquiryId,
    stage: workflowStages[current],
    analysisId: analysis?.id ?? null,
    quoteId: quote?.id ?? null,
    canReview:
      !!analysis && !!quote && ["Draft", "Rejected"].includes(quote.status),
    canPrepare: reviewed && quote?.status === "Approved",
    canFollowUp: ready,
    steps: workflowStages.map((name, index) => ({
      name,
      status: completed[index]
        ? "done"
        : index === current
          ? "current"
          : "pending",
    })),
  };
}
