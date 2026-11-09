import type { ReactNode } from "react";
import Link from "next/link";
import "@/app/demo/demo.css";

export function DemoFrame({
  title,
  category,
  description,
  className = "",
  children,
}: {
  title: string;
  category: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`demo-page ${className}`}>
      <div className="container demo-page-heading">
        <Link href="/demo" className="demo-back-link">
          <span aria-hidden="true">←</span> All demonstrations
        </Link>
        <div className="demo-title-row">
          <div>
            <span className="eyebrow">{category}</span>
            <h1>{title}</h1>
          </div>
          <span className="demo-pill">DEMO MODE</span>
        </div>
        <p>{description}</p>
      </div>
      <section
        className="container demo-workspace"
        aria-label={`${title} demonstration`}
      >
        {children}
      </section>
    </div>
  );
}
