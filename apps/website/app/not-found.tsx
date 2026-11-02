import Link from "next/link";
export default function NotFound() {
  return (
    <section className="container not-found">
      <span className="eyebrow" style={{ justifyContent: "center" }}>
        Page not found
      </span>
      <h1>Let’s find your way.</h1>
      <p>This page may have moved, or the address may be incomplete.</p>
      <Link href="/" className="button">
        Back to home
      </Link>
    </section>
  );
}
