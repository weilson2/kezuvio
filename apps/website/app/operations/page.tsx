import { PageIntro } from "@/components/site";
import { OperationsWorkspace } from "@/components/operations-workspace";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  {
    title: "Local operations desk",
    description:
      "Authenticated local task assignments, human approval and bounded validation checks for the Kezuvio studio workspace.",
  },
  "/operations",
);

export default function OperationsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Private local workspace"
        title="The studio operations desk."
        description="Assign a bounded validation task, review its approval and inspect the actual execution log. Access requires the separate local operations key."
      />
      <OperationsWorkspace />
    </>
  );
}
