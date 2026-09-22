"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Field, Icon, TextArea } from "@kezuvio/ui";
import { services } from "@/lib/content";
import { draftPackages } from "@/lib/studio-content";
type Errors = Record<string, string>;
export function ContactForm({ email }: { email: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [brief, setBrief] = useState("");
  const [feedback, setFeedback] = useState("");
  const [packageName, setPackageName] = useState("");
  useEffect(() => {
    const requested = new URLSearchParams(location.search).get("service");
    const packageId = new URLSearchParams(location.search).get("package");
    setPackageName(
      draftPackages.find((item) => item.id === packageId)?.name || "",
    );
    if (requested && services.some((s) => s.slug === requested)) {
      const select = formRef.current?.elements.namedItem(
        "service",
      ) as HTMLSelectElement;
      select.value = requested;
    }
  }, []);
  function prepare(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const address = String(data.get("email") || "").trim();
    const company = String(data.get("company") || "").trim();
    const message = String(data.get("message") || "").trim();
    const problems: Errors = {};
    if (!name || name.length > 100)
      problems.name = "Enter your name (up to 100 characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254)
      problems.email = "Enter a valid email address.";
    if (message.length < 20 || message.length > 3000)
      problems.message = "Tell us a little more (20–3,000 characters).";
    if (!data.get("consent"))
      problems.consent =
        "Please confirm that you understand this is a local preview.";
    if (data.get("website")) {
      setFeedback("Unable to prepare this enquiry. Please try again.");
      return;
    }
    setErrors(problems);
    setFeedback("");
    setBrief("");
    if (Object.keys(problems).length) {
      const first = form.elements.namedItem(
        Object.keys(problems)[0],
      ) as HTMLElement;
      first?.focus();
      return;
    }
    const service =
      services.find((s) => s.slug === data.get("service"))?.title ||
      "Help me choose";
    setBrief(
      `PROJECT ENQUIRY — KEZUVIO LABS\n\nName: ${name}\nEmail: ${address}\nBusiness: ${company || "Not provided"}\nInterested in: ${service}\n${packageName ? `Draft package: ${packageName}\n` : ""}\n${message}\n\nPrepared locally. Not sent.`,
    );
    window.dispatchEvent(new CustomEvent("kezuvio:contact-prepared"));
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([brief], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "kezuvio-project-enquiry.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback(
      "Your enquiry file has been downloaded. Nothing has been sent.",
    );
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(brief);
      setFeedback("Enquiry copied. Nothing has been sent.");
    } catch {
      setFeedback(
        "Clipboard access is unavailable. Download the enquiry file instead.",
      );
    }
  }
  return (
    <form
      ref={formRef}
      className="contact-form"
      onSubmit={prepare}
      noValidate
      onChange={() => {
        if (brief) setBrief("");
        setFeedback("");
      }}
    >
      <div className="notice">
        <strong>Enquiry preview</strong>
        <br />
        Prepare a project brief on this device. This form does not send messages
        or store your details on a server.
      </div>
      {packageName && (
        <p className="notice">
          Requested draft package: <strong>{packageName}</strong>. Scope and
          price require review.
        </p>
      )}
      <div className="form-row">
        <Field
          id="name"
          name="name"
          label="Your name *"
          autoComplete="name"
          maxLength={100}
          required
          error={errors.name}
          placeholder="Your name"
        />
        <Field
          id="email"
          name="email"
          type="email"
          label="Email address *"
          autoComplete="email"
          maxLength={254}
          required
          error={errors.email}
          placeholder="you@yourbusiness.com"
        />
      </div>
      <Field
        id="company"
        name="company"
        label="Business name"
        autoComplete="organization"
        maxLength={150}
        placeholder="Optional"
      />
      <div className="field">
        <label htmlFor="service">What can we help with?</label>
        <select id="service" name="service">
          <option value="">Help me choose</option>
          {services.map((s) => (
            <option value={s.slug} key={s.slug}>
              {s.title}
            </option>
          ))}
        </select>
      </div>
      <TextArea
        id="message"
        name="message"
        label="Tell us about your idea *"
        placeholder="What would you like to make easier, improve or create?"
        maxLength={3000}
        required
        error={errors.message}
      />
      <div hidden aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "consent-error" : undefined}
          />
          <span>
            I understand this prepares a local enquiry and does not send a
            message. <Link href="/privacy">Privacy information</Link>.
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="field-error">
            {errors.consent}
          </p>
        )}
      </div>
      {Object.keys(errors).length > 0 && !brief && (
        <p role="alert" className="field-error">
          Please check the highlighted fields before continuing.
        </p>
      )}
      <Button type="submit">
        Prepare my enquiry <Icon name="arrow" />
      </Button>
      {brief && (
        <div className="form-status">
          <div role="status">
            <h3>Your enquiry is ready.</h3>
            <p>
              Nothing has been sent. Download or copy your brief to keep it.
            </p>
          </div>
          <pre>{brief}</pre>
          <div className="button-row">
            <Button onClick={download}>
              <Icon name="download" />
              Download brief
            </Button>
            <Button variant="secondary" onClick={copy}>
              Copy brief
            </Button>
            {email && (
              <a
                className="button secondary"
                href={`mailto:${email}?subject=${encodeURIComponent("Project enquiry — Kezuvio Labs")}&body=${encodeURIComponent(brief.replace("Prepared locally. Not sent.", ""))}`}
              >
                Open email draft
              </a>
            )}
          </div>
        </div>
      )}
      <p role="status" className="field-help">
        {feedback}
      </p>
    </form>
  );
}
