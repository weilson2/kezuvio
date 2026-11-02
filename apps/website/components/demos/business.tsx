"use client";
import { useEffect, useState } from "react";
import { Button, Field, TextArea } from "@kezuvio/ui";
import { Select, type DemoProps } from "./shared";
export function BusinessDemo({ state, act, busy }: DemoProps) {
  const [theme, setTheme] = useState(state.business.theme),
    [headline, setHeadline] = useState(state.business.headline),
    [description, setDescription] = useState(state.business.description),
    [enquiry, setEnquiry] = useState(false);
  useEffect(() => {
    setTheme(state.business.theme);
    setHeadline(state.business.headline);
    setDescription(state.business.description);
    setEnquiry(false);
  }, [state.business]);
  return (
    <>
      <form
        className="demo-panel business-editor"
        onSubmit={(e) => {
          e.preventDefault();
          act(
            "business",
            { theme, headline, description },
            "Website preview updated. No public site was changed.",
          );
        }}
      >
        <div>
          <h2>Make the preview yours.</h2>
          <p>Use fictional copy. Edit, apply and compare three themes.</p>
        </div>
        <Select
          id="business-theme"
          label="Visual theme"
          value={theme}
          onChange={setTheme}
        >
          <option value="forest">Forest studio</option>
          <option value="indigo">Indigo digital</option>
          <option value="clay">Clay workshop</option>
        </Select>
        <Field
          id="business-headline"
          label="Hero headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={80}
          required
        />
        <TextArea
          id="business-description"
          label="Introduction"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={220}
          required
        />
        <Button type="submit" disabled={busy}>
          Apply to preview
        </Button>
      </form>
      <div className={`sample-business business-${state.business.theme}`}>
        <header>
          <strong>
            ruang<span>.</span>
          </strong>
          <nav aria-label="Sample business navigation">
            <a href="#sample-about">About</a>
            <a href="#sample-services">Services</a>
            <a href="#sample-gallery">Gallery</a>
            <a href="#sample-contact">Contact</a>
          </nav>
        </header>
        <section className="sample-hero">
          <div>
            <span className="sample-kicker">
              Fictional neighbourhood studio
            </span>
            <h2>{state.business.headline}</h2>
            <p>{state.business.description}</p>
            <a href="#sample-contact" className="sample-button">
              Plan a sample visit ↗
            </a>
          </div>
          <div
            className="sample-room"
            role="img"
            aria-label="Illustrated studio workspace"
          >
            <div className="room-window" />
            <div className="room-table" />
            <div className="room-plant" />
          </div>
        </section>
        <section className="sample-about" id="sample-about">
          <span className="sample-kicker">A place to begin</span>
          <h2>Good work needs a little room.</h2>
          <p>
            Ruang is an imaginary studio for focused work, small gatherings and
            creative practice. This sample website shows how a business can tell
            its story clearly.
          </p>
        </section>
        <section id="sample-services" className="sample-services">
          {[
            ["01", "Workspaces", "A quiet desk for a focused morning."],
            ["02", "Creative sessions", "A space to explore something new."],
            ["03", "Small gatherings", "Bring a few good ideas together."],
          ].map(([n, title, text]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>
        <section
          id="sample-gallery"
          className="sample-gallery"
          aria-label="Illustrative studio gallery"
        >
          {["The focus corner", "The shared table", "The creative room"].map(
            (title, i) => (
              <figure key={title}>
                <div
                  className={`gallery-illustration gallery-${i}`}
                  aria-hidden="true"
                >
                  <span />
                </div>
                <figcaption>{title} · Illustration</figcaption>
              </figure>
            ),
          )}
        </section>
        <section id="sample-contact" className="sample-contact">
          <h2>A new idea starts here.</h2>
          <p>
            Sample enquiry only. No real business or contact information is
            represented.
          </p>
          <Button onClick={() => setEnquiry(true)}>Prepare sample visit</Button>
          {enquiry && (
            <p role="status">
              Sample visit request prepared for Sample Guest. No message was
              sent.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
