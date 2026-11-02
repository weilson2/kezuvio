import type { Metadata } from "next";
import { PageIntro } from "@/components/site";
import { BrandWorkbench } from "@/components/brand-workbench";
export const metadata: Metadata = {
  title: "Brand foundation",
  description:
    "Kezuvio Labs identity, vector logos, color palette, typography and reusable component specimens.",
  robots: { index: false, follow: false },
};
export default function Brand() {
  return (
    <>
      <PageIntro
        eyebrow="Kezuvio Labs / Brand foundation v0.1"
        title="A clear identity. Room to evolve."
        description="A shared foundation for every Kezuvio experience. Explore the signature, the visual language and the details that hold it together."
      />
      <div className="container content-bottom">
        <div className="brand-banner">
          <img
            src="/brand/logos/kezuvio-horizontal-dark.svg"
            width="450"
            height="112"
            alt="Kezuvio Labs horizontal logo"
          />
          <div>
            <span className="eyebrow">The brand promise</span>
            <p className="brand-statement">Create. Build. Evolve.</p>
            <p>Digital Solutions for Growing Businesses.</p>
          </div>
        </div>
        <BrandWorkbench />
      </div>
    </>
  );
}
