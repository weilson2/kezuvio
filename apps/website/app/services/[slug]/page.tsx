import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/lib/content";
import { PageIntro, CTA } from "@/components/site";
import { Card, Icon } from "@kezuvio/ui";
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  return {
    title: s?.title || "Service not found",
    description: s?.description,
    alternates: { canonical: `/services/${slug}` },
  };
}
export default async function Service({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  if (!s) notFound();
  return (
    <>
      <PageIntro
        eyebrow={s.title}
        title={s.short}
        description={s.description}
      />
      <section className="container content-bottom">
        <Link href="/services" className="text-link back-link">
          ← All services
        </Link>
        <div className="service-detail-grid">
          <div>
            <h2>Start with what matters.</h2>
            <p className="lead">{s.detail}</p>
            <ul className="feature-list">
              {s.features.map((f) => (
                <li key={f}>
                  <Icon name="check" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Card className="detail-card">
            <span className="icon-box">
              <Icon name={s.icon} />
            </span>
            <h3 style={{ marginTop: 24 }}>Is this a good fit?</h3>
            <p>{s.fit}</p>
            <Link href={`/contact?service=${s.slug}`} className="button">
              Discuss your project <Icon name="arrow" />
            </Link>
          </Card>
        </div>
        <p className="notice" style={{ marginTop: 40 }}>
          Service scope, integrations, timelines and support are agreed per
          project. Hardware, payments and compliance requirements need separate
          assessment.
        </p>
      </section>
      <CTA />
    </>
  );
}
