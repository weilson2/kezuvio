"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Badge, Button, Field, TextArea } from "@kezuvio/ui";
import { Empty, Select, Stats } from "../demos/shared";
import { LabShell, useLabWorkspace, type LabWorkspace } from "./platform-shell";
import {
  listingTypes,
  stages,
  type PropertyView,
} from "../../../../packages/property/model";
import "./property.css";

type ViewProps = { view: PropertyView; workspace: LabWorkspace };
type Listing = PropertyView["listings"][number];
type Contact = PropertyView["contacts"][number];
type Lead = PropertyView["leads"][number];
type Appointment = PropertyView["appointments"][number];
type Area =
  | "Overview"
  | "Listings"
  | "Contacts"
  | "Pipeline"
  | "Agents"
  | "Viewings"
  | "Follow-ups"
  | "Activity";
const managerAreas: Area[] = [
  "Overview",
  "Listings",
  "Contacts",
  "Pipeline",
  "Agents",
  "Viewings",
  "Follow-ups",
  "Activity",
];
const zone = "Asia/Kuala_Lumpur";
const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});
const dateTime = new Intl.DateTimeFormat("en-MY", {
  timeZone: zone,
  dateStyle: "medium",
  timeStyle: "short",
});
const dayLabel = new Intl.DateTimeFormat("en-MY", {
  timeZone: zone,
  dateStyle: "full",
});
const timeLabel = new Intl.DateTimeFormat("en-MY", {
  timeZone: zone,
  timeStyle: "short",
});
const rm = (sen: number) => money.format(sen / 100);
const stamp = (value: string) => `${dateTime.format(new Date(value))} MYT`;
const closed = (lead: Lead) => lead.stage === "Won" || lead.stage === "Lost";
const read = (form: FormData, field: string) => String(form.get(field) ?? "");
const optional = (form: FormData, field: string) => read(form, field) || null;
const busy = (workspace: LabWorkspace) =>
  workspace.busy || workspace.needsRefresh;

function sen(value: string) {
  const [whole, decimals = ""] = value.trim().split(".");
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim()))
    throw new Error("Enter an RM price with at most two decimal places.");
  const result = Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
  if (!Number.isSafeInteger(result))
    throw new Error("Enter a smaller RM price.");
  return result;
}

function myt(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Enter a valid Malaysia date and time.");
  const date = new Date(`${value}:00+08:00`);
  if (
    !Number.isFinite(date.getTime()) ||
    localInput(date.toISOString()) !== value
  )
    throw new Error("Enter a valid Malaysia date and time.");
  return date.toISOString();
}

function localInput(value: string) {
  return new Date(Date.parse(value) + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

function Heading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="property-heading">
      <div>
        <span className="eyebrow">Property CRM</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </header>
  );
}

function Choice({
  label,
  name,
  children,
  value,
  onChange,
  defaultValue,
  required,
  disabled,
}: {
  label: string;
  name: string;
  children: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
      >
        {children}
      </select>
    </div>
  );
}

function Editor({
  title,
  workspace,
  save,
  cancel,
  children,
}: {
  title: string;
  workspace: LabWorkspace;
  save: (data: FormData) => Promise<unknown>;
  cancel: () => void;
  children: ReactNode;
}) {
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  useEffect(() => {
    const opener = document.activeElement;
    const form = formRef.current;
    form?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    return () => {
      // Wait for React to enable the opener after a successful save.
      window.requestAnimationFrame(() => {
        if (
          opener instanceof HTMLElement &&
          opener.isConnected &&
          !opener.matches(":disabled") &&
          (document.activeElement === document.body ||
            (document.activeElement && form?.contains(document.activeElement)))
        )
          opener.focus();
      });
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await save(new FormData(event.currentTarget));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Check the entered details.",
      );
    }
  }
  return (
    <form
      ref={formRef}
      className="demo-panel property-editor"
      aria-labelledby={titleId}
      onSubmit={submit}
    >
      <h3 id={titleId}>{title}</h3>
      <fieldset disabled={busy(workspace)} className="property-form-fields">
        {children}
      </fieldset>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="labs-actions">
        <Button type="submit" disabled={busy(workspace)}>
          Save {title.toLowerCase().split(" ").at(-1)}
        </Button>
        <Button variant="secondary" onClick={cancel} disabled={busy(workspace)}>
          Close form
        </Button>
      </div>
    </form>
  );
}

function ListingEditor({
  item,
  workspace,
  close,
}: {
  item?: Listing;
  workspace: LabWorkspace;
  close: () => void;
}) {
  async function save(form: FormData) {
    const details = {
      title: read(form, "title"),
      area: read(form, "area"),
      type: read(form, "type"),
      priceSen: sen(read(form, "price")),
      bedrooms: Number(read(form, "bedrooms")),
      bathrooms: Number(read(form, "bathrooms")),
      sizeSqft: Number(read(form, "size")),
      description: read(form, "description"),
      status: read(form, "status"),
    };
    const packet = await workspace.act(
      item ? "listing.update" : "listing.create",
      item ? { ...details, id: item.id, version: item.version } : details,
      "Listing saved.",
    );
    if (packet) close();
  }
  return (
    <Editor
      title={item ? "Edit listing" : "New listing"}
      workspace={workspace}
      save={save}
      cancel={close}
    >
      <Field
        id="property-title"
        name="title"
        label="Listing title"
        required
        defaultValue={item?.title}
      />
      <Field
        id="property-area"
        name="area"
        label="Area"
        required
        defaultValue={item?.area}
      />
      <Choice
        label="Property type"
        name="type"
        defaultValue={item?.type ?? listingTypes[0]}
      >
        {listingTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </Choice>
      <Field
        id="property-price"
        name="price"
        label="Asking price (RM)"
        inputMode="decimal"
        required
        defaultValue={item ? (item.priceSen / 100).toFixed(2) : undefined}
      />
      <Field
        id="property-beds"
        name="bedrooms"
        label="Bedrooms"
        type="number"
        min="0"
        step="1"
        required
        defaultValue={item?.bedrooms ?? 3}
      />
      <Field
        id="property-baths"
        name="bathrooms"
        label="Bathrooms"
        type="number"
        min="0"
        step="1"
        required
        defaultValue={item?.bathrooms ?? 2}
      />
      <Field
        id="property-size"
        name="size"
        label="Floor area (sq ft)"
        type="number"
        min="1"
        step="1"
        required
        defaultValue={item?.sizeSqft}
      />
      <Choice
        label="Availability"
        name="status"
        defaultValue={item?.status ?? "Available"}
      >
        <option>Available</option>
        <option>Unavailable</option>
      </Choice>
      <TextArea
        id="property-description"
        name="description"
        label="Description"
        rows={3}
        required
        defaultValue={item?.description}
      />
    </Editor>
  );
}

function Listings({ view, workspace }: ViewProps) {
  const manager = workspace.packet?.role === "manager";
  const [editing, setEditing] = useState<Listing | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [availability, setAvailability] = useState("");
  const [maximum, setMaximum] = useState("");
  let max = Infinity;
  let invalidPrice = false;
  if (maximum) {
    try {
      max = sen(maximum);
    } catch {
      invalidPrice = true;
    }
  }
  const results = view.listings.filter(
    (item) =>
      `${item.title} ${item.area}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (!type || item.type === type) &&
      (!availability || item.status === availability) &&
      item.priceSen <= max,
  );
  return (
    <>
      <Heading
        title={manager ? "Listings" : "Browse fictional properties"}
        description="Explore sample Malaysian homes and their asking prices in RM."
      >
        {manager && (
          <Button onClick={() => setEditing("new")} disabled={busy(workspace)}>
            Add listing
          </Button>
        )}
      </Heading>
      {editing && (
        <ListingEditor
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? undefined : editing}
          workspace={workspace}
          close={() => setEditing(null)}
        />
      )}
      <div className="property-filters">
        <Field
          id="property-search"
          label="Search listings"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Title or area"
        />
        <Select
          id="property-filter-type"
          label="Filter property type"
          value={type}
          onChange={setType}
        >
          <option value="">All types</option>
          {listingTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </Select>
        {manager && (
          <Select
            id="property-filter-status"
            label="Filter availability"
            value={availability}
            onChange={setAvailability}
          >
            <option value="">All statuses</option>
            <option>Available</option>
            <option>Unavailable</option>
            <option>Archived</option>
          </Select>
        )}
        <Field
          id="property-filter-price"
          label="Maximum price (RM)"
          inputMode="decimal"
          value={maximum}
          onChange={(event) => setMaximum(event.target.value)}
          error={invalidPrice ? "Enter an RM amount." : undefined}
        />
      </div>
      {results.length ? (
        <div className="property-grid">
          {results.map((item) => (
            <article
              key={item.id}
              className="demo-panel property-card"
              aria-label={item.title}
              data-testid={"property-listing-" + item.id}
            >
              <div className="property-listing-banner">
                <span>{item.type}</span>
                <Badge>{item.status}</Badge>
              </div>
              <h3>{item.title}</h3>
              <p className="property-muted">{item.area}</p>
              <p className="property-price">{rm(item.priceSen)}</p>
              <p>
                {item.bedrooms} beds · {item.bathrooms} baths ·{" "}
                {item.sizeSqft.toLocaleString("en-MY")} sq ft
              </p>
              <p>{item.description}</p>
              {manager && (
                <p className="property-muted">
                  {
                    view.leads.filter(
                      (lead) => !lead.archived && lead.listingId === item.id,
                    ).length
                  }{" "}
                  linked leads
                </p>
              )}
              {manager && item.status !== "Archived" && (
                <div className="labs-actions">
                  <Button
                    variant="secondary"
                    onClick={() => setEditing(item)}
                    disabled={busy(workspace)}
                  >
                    Edit listing
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy(workspace)}
                    onClick={() =>
                      void workspace.act(
                        "listing.archive",
                        { id: item.id, version: item.version },
                        "Listing archived.",
                      )
                    }
                  >
                    Archive listing
                  </Button>
                </div>
              )}
              {manager && item.status === "Archived" && (
                <>
                  <p className="property-muted">
                    Restore as unavailable, then edit availability when ready to
                    show this listing in the customer catalogue.
                  </p>
                  <Button
                    variant="secondary"
                    disabled={busy(workspace)}
                    onClick={() =>
                      void workspace.act(
                        "listing.restore",
                        { id: item.id, version: item.version },
                        "Listing restored as unavailable. Edit availability to show it in the customer catalogue.",
                      )
                    }
                  >
                    Restore listing
                  </Button>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty>No listings match your filters.</Empty>
      )}
    </>
  );
}

function ContactEditor({
  item,
  workspace,
  close,
}: {
  item?: Contact;
  workspace: LabWorkspace;
  close: () => void;
}) {
  async function save(form: FormData) {
    const details = {
      name: read(form, "name"),
      email: read(form, "email"),
      notes: read(form, "notes"),
    };
    if (
      await workspace.act(
        item ? "contact.update" : "contact.create",
        item ? { ...details, id: item.id, version: item.version } : details,
        "Contact saved.",
      )
    )
      close();
  }
  return (
    <Editor
      title={item ? "Edit contact" : "New contact"}
      workspace={workspace}
      save={save}
      cancel={close}
    >
      <Field
        id="property-contact-name"
        name="name"
        label="Contact name"
        required
        defaultValue={item?.name}
      />
      <Field
        id="property-contact-email"
        name="email"
        label="Fictional email"
        type="email"
        help="Use a .test address for this demo."
        defaultValue={item?.email ?? ""}
      />
      <TextArea
        id="property-contact-notes"
        name="notes"
        label="Contact notes"
        rows={3}
        defaultValue={item?.notes}
      />
    </Editor>
  );
}

function Contacts({ view, workspace }: ViewProps) {
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [query, setQuery] = useState("");
  const matches = view.contacts.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <Heading
        title="Contacts"
        description="Keep fictional contacts separate from their property inquiries."
      >
        <Button onClick={() => setEditing("new")} disabled={busy(workspace)}>
          Add contact
        </Button>
      </Heading>
      {editing && (
        <ContactEditor
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? undefined : editing}
          workspace={workspace}
          close={() => setEditing(null)}
        />
      )}
      <div className="property-filters">
        <Field
          id="property-contact-search"
          label="Search contacts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {matches.length ? (
        <div className="property-grid">
          {matches.map((item) => (
            <article
              className="demo-panel property-card"
              key={item.id}
              aria-label={item.name}
            >
              <div className="property-card-top">
                <h3>{item.name}</h3>
                <Badge>{item.archived ? "Archived" : "Active"}</Badge>
              </div>
              <p>{item.email || "No sample email"}</p>
              {item.notes && <p>{item.notes}</p>}
              {!item.archived && (
                <div className="labs-actions">
                  <Button
                    variant="secondary"
                    disabled={busy(workspace)}
                    onClick={() => setEditing(item)}
                  >
                    Edit contact
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy(workspace)}
                    onClick={() =>
                      void workspace.act(
                        "contact.archive",
                        { id: item.id, version: item.version },
                        "Contact archived.",
                      )
                    }
                  >
                    Archive contact
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty>No contacts match your search.</Empty>
      )}
    </>
  );
}

function LeadEditor({
  view,
  workspace,
  item,
  close,
}: ViewProps & { item?: Lead; close: () => void }) {
  async function save(form: FormData) {
    const details = {
      contactId: read(form, "contact"),
      listingId: optional(form, "listing"),
      source: read(form, "source"),
      notes: read(form, "notes"),
    };
    const packet = await workspace.act(
      item ? "lead.update" : "lead.create",
      item
        ? { ...details, id: item.id, version: item.version }
        : { ...details, agentId: optional(form, "agent") },
      "Lead saved.",
    );
    if (packet) close();
  }
  return (
    <Editor
      title={item ? "Edit lead" : "New lead"}
      workspace={workspace}
      save={save}
      cancel={close}
    >
      <Choice
        label="Contact"
        name="contact"
        defaultValue={item?.contactId ?? ""}
        required
      >
        <option value="">Choose a contact</option>
        {view.contacts
          .filter((contact) => !contact.archived)
          .map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
      </Choice>
      <Choice
        label="Listing"
        name="listing"
        defaultValue={item?.listingId ?? ""}
      >
        <option value="">No listing yet</option>
        {view.listings
          .filter(
            (listing) =>
              listing.status === "Available" ||
              (listing.id === item?.listingId && listing.status !== "Archived"),
          )
          .map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.title}
            </option>
          ))}
      </Choice>
      {!item && (
        <Choice label="Assigned agent" name="agent" defaultValue="">
          <option value="">Unassigned</option>
          {view.agents
            .filter((agent) => agent.active)
            .map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
        </Choice>
      )}
      <Field
        id="property-lead-source"
        name="source"
        label="Source"
        placeholder="e.g. Sample property enquiry"
        required
        defaultValue={item?.source}
      />
      <TextArea
        id="property-lead-notes"
        name="notes"
        label="Notes"
        rows={3}
        defaultValue={item?.notes}
      />
    </Editor>
  );
}

function LeadCard({
  view,
  workspace,
  lead,
  edit,
  moved,
}: ViewProps & { lead: Lead; edit: () => void; moved: () => void }) {
  const [stage, setStage] = useState("");
  const [assigning, setAssigning] = useState(false);
  const contact = view.contacts.find((item) => item.id === lead.contactId);
  const listing = view.listings.find((item) => item.id === lead.listingId);
  const agent = view.agents.find((item) => item.id === lead.agentId);
  const reminder = view.reminders
    .filter((item) => item.leadId === lead.id && item.status === "Pending")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  const next = stages[stages.indexOf(lead.stage) + 1];
  const headingId = "property-lead-heading-" + lead.id;
  const reasonId = "property-loss-reason-" + lead.id;
  const disabled = busy(workspace);
  return (
    <article
      className="demo-panel property-card property-lead-card"
      data-testid={"property-lead-" + lead.id}
      aria-labelledby={headingId}
    >
      <div className="property-card-top">
        <h4 id={headingId} tabIndex={-1}>
          {contact?.name ?? "Sample lead"}
        </h4>
        <Badge>{lead.archived ? "Archived" : lead.stage}</Badge>
      </div>
      <dl className="property-lead-meta">
        <div>
          <dt>Listing</dt>
          <dd>{listing?.title ?? "Unlinked"}</dd>
        </div>
        <div>
          <dt>Agent</dt>
          <dd>{agent?.name ?? "Unassigned"}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{lead.source}</dd>
        </div>
      </dl>
      {lead.notes && <p>{lead.notes}</p>}
      {lead.lossReason && (
        <p className="property-muted">Outcome: {lead.lossReason}</p>
      )}
      {reminder && (
        <p className="property-next">
          <strong>Next follow-up</strong>
          <br />
          {reminder.reason} · {stamp(reminder.dueAt)} · {reminder.timing}
        </p>
      )}
      {!lead.archived && !closed(lead) && (
        <>
          <div className="labs-actions">
            <Button variant="secondary" onClick={edit} disabled={disabled}>
              Edit lead
            </Button>
            <Button
              variant="secondary"
              aria-expanded={assigning}
              onClick={() => setAssigning(!assigning)}
              disabled={disabled}
            >
              Assign agent
            </Button>
          </div>
          {assigning && (
            <form
              className="property-inline"
              key={lead.version}
              onSubmit={async (event) => {
                event.preventDefault();
                const packet = await workspace.act(
                  "lead.assign",
                  {
                    id: lead.id,
                    version: lead.version,
                    agentId: optional(
                      new FormData(event.currentTarget),
                      "agent",
                    ),
                  },
                  "Agent assignment saved.",
                );
                if (packet) {
                  setAssigning(false);
                  moved();
                }
              }}
            >
              <Choice
                label="Assigned agent"
                name="agent"
                defaultValue={lead.agentId ?? ""}
                disabled={disabled}
                required={lead.stage !== "New"}
              >
                {(lead.stage === "New" || !lead.agentId) && (
                  <option value="">Unassigned</option>
                )}
                {view.agents
                  .filter((item) => item.active)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </Choice>
              <Button type="submit" variant="secondary" disabled={disabled}>
                Save assignment
              </Button>
            </form>
          )}
          <form
            className="property-inline"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const packet = await workspace.act(
                "lead.move",
                {
                  id: lead.id,
                  version: lead.version,
                  stage,
                  reason: read(form, "reason"),
                },
                "Lead moved to " + stage + ".",
              );
              if (packet) moved();
            }}
          >
            <Choice
              label="Move to stage"
              name="stage"
              value={stage}
              onChange={setStage}
              disabled={disabled}
              required
            >
              <option value="">Choose a stage</option>
              {next && next !== "Lost" && <option>{next}</option>}
              <option>Lost</option>
            </Choice>
            {stage === "Lost" && (
              <Field
                id={reasonId}
                name="reason"
                label="Loss reason"
                required
                disabled={disabled}
              />
            )}
            <Button type="submit" disabled={disabled || !stage}>
              Move lead
            </Button>
          </form>
        </>
      )}
      {!lead.archived && closed(lead) && (
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() =>
            void workspace.act(
              "lead.archive",
              { id: lead.id, version: lead.version },
              "Lead archived.",
            )
          }
        >
          Archive lead
        </Button>
      )}
    </article>
  );
}

function Pipeline({ view, workspace }: ViewProps) {
  const [editing, setEditing] = useState<Lead | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [listing, setListing] = useState("");
  const [source, setSource] = useState("");
  const [agent, setAgent] = useState("");
  const [stage, setStage] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  useEffect(() => {
    if (focus) {
      document.getElementById("property-lead-heading-" + focus)?.focus();
      setFocus(null);
    }
  }, [focus]);
  const sources = Array.from(
    new Set(view.leads.map((lead) => lead.source)),
  ).sort();
  const results = view.leads.filter(
    (lead) =>
      (showArchived || !lead.archived) &&
      (!listing || listing === lead.listingId) &&
      (!source || source === lead.source) &&
      (!agent || agent === (lead.agentId ?? "unassigned")) &&
      (!stage || stage === lead.stage) &&
      (
        view.contacts
          .find((item) => item.id === lead.contactId)
          ?.name.toLowerCase() ?? ""
      ).includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <Heading
        title="Sales pipeline"
        description="Move leads one stage at a time. Qualified needs an available listing and agent. Viewing needs a booked or completed slot. Offer and Won need a completed viewing. Resolve scheduled viewings and reminders before closing."
      >
        <Button onClick={() => setEditing("new")} disabled={busy(workspace)}>
          Add lead
        </Button>
      </Heading>
      {editing && (
        <LeadEditor
          key={editing === "new" ? "new" : editing.id}
          view={view}
          workspace={workspace}
          item={editing === "new" ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}
      <div className="property-filters">
        <Field
          id="property-lead-search"
          label="Search leads"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Contact name"
        />
        <Select
          id="property-lead-listing"
          label="Filter listing"
          value={listing}
          onChange={setListing}
        >
          <option value="">All listings</option>
          {view.listings.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </Select>
        <Select
          id="property-lead-source-filter"
          label="Filter source"
          value={source}
          onChange={setSource}
        >
          <option value="">All sources</option>
          {sources.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Select
          id="property-lead-agent"
          label="Filter agent"
          value={agent}
          onChange={setAgent}
        >
          <option value="">All agents</option>
          <option value="unassigned">Unassigned</option>
          {view.agents.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select
          id="property-lead-stage"
          label="Filter stage"
          value={stage}
          onChange={setStage}
        >
          <option value="">All stages</option>
          {stages.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <label className="property-check">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />{" "}
          Include archived leads
        </label>
      </div>
      {results.length ? (
        <div className="property-board" aria-label="Sales pipeline">
          {stages
            .filter((item) => !stage || item === stage)
            .map((item) => {
              const cards = results.filter((lead) => lead.stage === item);
              return (
                <section
                  className="property-stage"
                  key={item}
                  aria-label={item + " stage"}
                >
                  <header>
                    <h3>{item}</h3>
                    <Badge>{cards.length}</Badge>
                  </header>
                  {cards.length ? (
                    cards.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        view={view}
                        workspace={workspace}
                        edit={() => setEditing(lead)}
                        moved={() => {
                          setStage("");
                          setAgent("");
                          setFocus(lead.id);
                        }}
                      />
                    ))
                  ) : (
                    <p className="property-muted">No leads in this stage.</p>
                  )}
                </section>
              );
            })}
        </div>
      ) : (
        <Empty>No leads match your filters.</Empty>
      )}
    </>
  );
}

function Agents({ view, workspace }: ViewProps) {
  return (
    <>
      <Heading
        title="Agents"
        description="The fictional roster represents assignments and viewing schedules in this workspace."
      />
      <div className="property-grid">
        {view.agents.map((item) => {
          const workload = view.analytics?.agentWorkload.find(
            (agent) => agent.agentId === item.id,
          );
          return (
            <article
              className="demo-panel property-card"
              key={item.id}
              aria-label={item.name}
            >
              <div className="property-card-top">
                <h3>{item.name}</h3>
                <Badge>{item.active ? "Active" : "Inactive"}</Badge>
              </div>
              <p>
                {workload?.openLeads ?? 0} open leads ·{" "}
                {workload?.upcomingViewings ?? 0} upcoming viewings
              </p>
              <Button
                variant="secondary"
                disabled={busy(workspace)}
                onClick={() =>
                  void workspace.act(
                    "agent.set-active",
                    {
                      id: item.id,
                      version: item.version,
                      active: !item.active,
                    },
                    item.active ? "Agent deactivated." : "Agent activated.",
                  )
                }
              >
                {item.active ? "Deactivate agent" : "Activate agent"}
              </Button>
            </article>
          );
        })}
      </div>
    </>
  );
}

function leadName(view: PropertyView, id: string) {
  const lead = view.leads.find((item) => item.id === id);
  return (
    view.contacts.find((item) => item.id === lead?.contactId)?.name ??
    "Sample lead"
  );
}

function leadOption(view: PropertyView, lead: Lead) {
  const listing = view.listings.find((item) => item.id === lead.listingId);
  return (
    leadName(view, lead.id) + (listing ? " · " + listing.title : " · Unlinked")
  );
}

function ViewingEditor({
  view,
  workspace,
  item,
  close,
}: ViewProps & { item?: Appointment; close: () => void }) {
  const leads = view.leads.filter(
    (lead) =>
      !lead.archived &&
      !closed(lead) &&
      view.listings.some(
        (listing) =>
          listing.id === lead.listingId && listing.status === "Available",
      ) &&
      view.agents.some((agent) => agent.id === lead.agentId && agent.active),
  );
  const startDefault = localInput(
    item?.startAt ?? new Date(Date.parse(view.asOf) + 86400000).toISOString(),
  );
  async function save(form: FormData) {
    const startAt = myt(read(form, "start"));
    const duration = Number(read(form, "duration"));
    if (!Number.isSafeInteger(duration) || duration < 15 || duration > 120)
      throw new Error("Enter a viewing duration from 15 to 120 minutes.");
    const endAt = new Date(
      Date.parse(startAt) + duration * 60000,
    ).toISOString();
    if (
      await workspace.act(
        item ? "appointment.reschedule" : "appointment.schedule",
        item
          ? { id: item.id, version: item.version, startAt, endAt }
          : { leadId: read(form, "lead"), startAt, endAt },
        item ? "Viewing rescheduled." : "Viewing scheduled.",
      )
    )
      close();
  }
  return (
    <Editor
      title={item ? "Reschedule viewing" : "New viewing"}
      workspace={workspace}
      save={save}
      cancel={close}
    >
      {item ? (
        <p>
          {leadName(view, item.leadId)} ·{" "}
          {
            view.listings.find((listing) => listing.id === item.listingId)
              ?.title
          }
        </p>
      ) : (
        <Choice label="Lead" name="lead" defaultValue="" required>
          <option value="">Choose an assigned lead</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {leadOption(view, lead)}
            </option>
          ))}
        </Choice>
      )}
      {!item && !leads.length && (
        <p className="notice">
          Assign an active agent and an available listing to an open lead first.
        </p>
      )}
      <Field
        id="property-view-start"
        name="start"
        label="Starts (MYT)"
        type="datetime-local"
        defaultValue={startDefault}
        required
      />
      <Field
        id="property-view-duration"
        name="duration"
        label="Duration (minutes)"
        type="number"
        min="15"
        max="120"
        step="1"
        defaultValue={
          item
            ? (Date.parse(item.endAt) - Date.parse(item.startAt)) / 60000
            : 30
        }
        required
      />
    </Editor>
  );
}

function Viewings({ view, workspace }: ViewProps) {
  const [editing, setEditing] = useState<Appointment | "new" | null>(null);
  const [status, setStatus] = useState("");
  const [agent, setAgent] = useState("");
  const [listing, setListing] = useState("");
  const groups = new Map<string, Appointment[]>();
  for (const item of view.appointments
    .filter(
      (item) =>
        (!status || item.status === status) &&
        (!agent || item.agentId === agent) &&
        (!listing || item.listingId === listing),
    )
    .sort((a, b) => a.startAt.localeCompare(b.startAt))) {
    const day = dayLabel.format(new Date(item.startAt));
    const group = groups.get(day);
    if (group) group.push(item);
    else groups.set(day, [item]);
  }
  const disabled = busy(workspace);
  return (
    <>
      <Heading
        title="Viewing appointments"
        description="Schedule viewings in Malaysia time. An agent or listing can only have one viewing in an overlapping time slot."
      >
        <Button onClick={() => setEditing("new")} disabled={disabled}>
          Schedule viewing
        </Button>
      </Heading>
      {editing && (
        <ViewingEditor
          key={editing === "new" ? "new" : editing.id}
          view={view}
          workspace={workspace}
          item={editing === "new" ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}
      <div className="property-filters">
        <Select
          id="property-view-status"
          label="Filter viewing status"
          value={status}
          onChange={setStatus}
        >
          <option value="">All statuses</option>
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </Select>
        <Select
          id="property-view-agent"
          label="Filter viewing agent"
          value={agent}
          onChange={setAgent}
        >
          <option value="">All agents</option>
          {view.agents.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select
          id="property-view-listing"
          label="Filter viewing listing"
          value={listing}
          onChange={setListing}
        >
          <option value="">All listings</option>
          {view.listings.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </Select>
      </div>
      {groups.size ? (
        <div className="property-stack">
          {Array.from(groups).map(([day, group]) => (
            <section key={day} aria-label={day} className="property-date-group">
              <h3>{day}</h3>
              {group.map((item) => {
                const ended = Date.parse(item.endAt) <= Date.parse(view.asOf);
                return (
                  <article
                    className="demo-panel property-card"
                    data-testid={"property-appointment-" + item.id}
                    key={item.id}
                  >
                    <div className="property-card-top">
                      <h4>{leadName(view, item.leadId)}</h4>
                      <Badge>{item.status}</Badge>
                    </div>
                    <p>
                      {
                        view.listings.find(
                          (listing) => listing.id === item.listingId,
                        )?.title
                      }{" "}
                      ·{" "}
                      {
                        view.agents.find((agent) => agent.id === item.agentId)
                          ?.name
                      }
                    </p>
                    <p>
                      <strong>
                        {timeLabel.format(new Date(item.startAt))} –{" "}
                        {stamp(item.endAt)}
                      </strong>
                    </p>
                    {item.status === "Scheduled" && (
                      <>
                        <div className="labs-actions">
                          <Button
                            variant="secondary"
                            disabled={disabled}
                            onClick={() => setEditing(item)}
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={disabled}
                            onClick={() =>
                              void workspace.act(
                                "appointment.cancel",
                                { id: item.id, version: item.version },
                                "Viewing cancelled.",
                              )
                            }
                          >
                            Cancel viewing
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={disabled || !ended}
                            onClick={() =>
                              void workspace.act(
                                "appointment.complete",
                                { id: item.id, version: item.version },
                                "Viewing completed.",
                              )
                            }
                          >
                            Complete viewing
                          </Button>
                        </div>
                        {!ended && (
                          <p className="property-muted">
                            Completion is available after the scheduled end
                            time.
                          </p>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      ) : (
        <Empty>No viewings match your filters.</Empty>
      )}
    </>
  );
}

function ReminderEditor({
  view,
  workspace,
  close,
}: ViewProps & { close: () => void }) {
  const leads = view.leads.filter((lead) => !lead.archived && !closed(lead));
  async function save(form: FormData) {
    if (
      await workspace.act(
        "reminder.create",
        {
          leadId: read(form, "lead"),
          dueAt: myt(read(form, "due")),
          reason: read(form, "reason"),
        },
        "Reminder saved.",
      )
    )
      close();
  }
  return (
    <Editor
      title="New reminder"
      workspace={workspace}
      save={save}
      cancel={close}
    >
      <Choice label="Lead" name="lead" defaultValue="" required>
        <option value="">Choose an open lead</option>
        {leads.map((lead) => (
          <option key={lead.id} value={lead.id}>
            {leadOption(view, lead)}
          </option>
        ))}
      </Choice>
      <Field
        id="property-reminder-due"
        name="due"
        label="Due (MYT)"
        type="datetime-local"
        defaultValue={localInput(
          new Date(Date.parse(view.asOf) + 86400000).toISOString(),
        )}
        required
      />
      <TextArea
        id="property-reminder-reason"
        name="reason"
        label="Reason"
        rows={3}
        required
      />
    </Editor>
  );
}

function Followups({ view, workspace }: ViewProps) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  const reminders = view.reminders
    .filter((item) => !status || item.timing === status)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const disabled = busy(workspace);
  return (
    <>
      <Heading
        title="Follow-up reminders"
        description="Track due dates and outcomes in this workspace. Reminders stay in the demo."
      >
        <Button disabled={disabled} onClick={() => setEditing(true)}>
          Add reminder
        </Button>
      </Heading>
      {editing && (
        <ReminderEditor
          view={view}
          workspace={workspace}
          close={() => setEditing(false)}
        />
      )}
      <div className="property-filters">
        <Select
          id="property-reminder-status"
          label="Filter reminder status"
          value={status}
          onChange={setStatus}
        >
          <option value="">All statuses</option>
          <option>Overdue</option>
          <option>Upcoming</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </Select>
      </div>
      {reminders.length ? (
        <div className="property-grid">
          {reminders.map((item) => (
            <article
              key={item.id}
              data-testid={"property-reminder-" + item.id}
              className="demo-panel property-card"
            >
              <div className="property-card-top">
                <h3>{leadName(view, item.leadId)}</h3>
                <Badge>{item.timing}</Badge>
              </div>
              <p>
                <strong>{stamp(item.dueAt)}</strong>
              </p>
              <p>{item.reason}</p>
              {item.status === "Pending" && (
                <div className="labs-actions">
                  <Button
                    variant="secondary"
                    disabled={disabled}
                    onClick={() =>
                      void workspace.act(
                        "reminder.complete",
                        { id: item.id, version: item.version },
                        "Reminder completed.",
                      )
                    }
                  >
                    Complete reminder
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={disabled}
                    onClick={() =>
                      void workspace.act(
                        "reminder.cancel",
                        { id: item.id, version: item.version },
                        "Reminder cancelled.",
                      )
                    }
                  >
                    Cancel reminder
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty>No reminders match your filters.</Empty>
      )}
    </>
  );
}

function Overview({ view }: { view: PropertyView }) {
  const summary = view.analytics;
  if (!summary) return null;
  return (
    <>
      <Heading
        title="Pipeline overview"
        description="Review active leads, appointments and closed outcomes for this demo workspace."
      />
      <div className="property-highlights">
        <div className="property-hero-stat">
          <span>Asking value in active pipeline</span>
          <strong data-testid="property-asking-value">
            {rm(summary.askingValueSen)}
          </strong>
          <p>Each available listing is counted once across open leads.</p>
        </div>
        <div className="demo-panel property-card">
          <span>Closed-lead conversion</span>
          <strong className="property-price" data-testid="property-conversion">
            {summary.conversionTenths === null
              ? "—"
              : (summary.conversionTenths / 10).toFixed(1) + "%"}
          </strong>
          <p>
            {summary.won} won · {summary.lost} lost. Won ÷ all non-archived
            closed leads.
          </p>
        </div>
      </div>
      <Stats
        items={[
          { label: "Open leads", value: summary.openLeads },
          { label: "Upcoming viewings", value: summary.upcomingViewings },
          { label: "Overdue reminders", value: summary.overdueReminders },
          { label: "Unassigned leads", value: summary.unassignedLeads },
        ]}
      />
      <div className="property-grid property-analytics-grid">
        <section
          className="demo-panel property-card"
          aria-label="Open leads by stage"
        >
          <h3>Open leads by stage</h3>
          <ul className="property-metric-list">
            {stages
              .filter((stage) => stage !== "Won" && stage !== "Lost")
              .map((stage) => (
                <li key={stage}>
                  <span>{stage}</span>
                  <strong>{summary.stages[stage]}</strong>
                </li>
              ))}
          </ul>
        </section>
        {summary.agentWorkload.length > 0 && (
          <section
            className="demo-panel property-card"
            aria-label="Agent workload"
          >
            <h3>Agent workload</h3>
            <ul className="property-metric-list">
              {summary.agentWorkload.map((item) => (
                <li key={item.agentId}>
                  <strong>{item.name}</strong>
                  <span>
                    {item.openLeads} open · {item.upcomingViewings} viewings
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function historySubject(
  view: PropertyView,
  event: PropertyView["history"][number],
) {
  const kind = event.event.split(".")[0];
  switch (kind) {
    case "listing":
      return view.listings.find((item) => item.id === event.subjectId)?.title;
    case "contact":
      return view.contacts.find((item) => item.id === event.subjectId)?.name;
    case "agent":
      return view.agents.find((item) => item.id === event.subjectId)?.name;
    case "lead":
      return "Lead for " + leadName(view, event.subjectId);
    case "appointment": {
      const item = view.appointments.find(
        (item) => item.id === event.subjectId,
      );
      return item ? "Viewing for " + leadName(view, item.leadId) : undefined;
    }
    case "reminder": {
      const item = view.reminders.find((item) => item.id === event.subjectId);
      return item ? "Follow-up for " + leadName(view, item.leadId) : undefined;
    }
  }
}

function Activity({ view }: { view: PropertyView }) {
  return (
    <>
      <Heading
        title="Activity history"
        description="Review accepted changes saved in this workspace."
      />
      {view.history.length ? (
        <ol
          className="property-stack property-history"
          aria-label="Saved changes"
        >
          {view.history.map((item) => (
            <li className="demo-panel property-card" key={item.id}>
              <div className="property-card-top">
                <h3>{item.event}</h3>
                <small>{stamp(item.at)}</small>
              </div>
              <p className="property-muted">
                Subject:{" "}
                <strong>{historySubject(view, item) ?? "Saved record"}</strong>
                {" · "}
                <code>{item.subjectId}</code>
              </p>
              <p>{item.detail}</p>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>Updates appear here after the first saved change.</Empty>
      )}
    </>
  );
}

function Content({ view, workspace }: ViewProps) {
  const role = workspace.packet?.role;
  const areas: Area[] =
    role === "manager"
      ? managerAreas
      : role === "viewer"
        ? ["Overview"]
        : ["Listings"];
  const [area, setArea] = useState<Area>(areas[0]);
  const selected = areas.includes(area) ? area : areas[0];
  return (
    <div className="property-app">
      <div
        className="demo-tablist property-nav"
        role="group"
        aria-label="Property CRM views"
      >
        {areas.map((item) => (
          <Button
            key={item}
            variant={item === selected ? "primary" : "secondary"}
            aria-pressed={item === selected}
            onClick={() => setArea(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      {selected === "Overview" && <Overview view={view} />}
      {selected === "Listings" && (
        <Listings view={view} workspace={workspace} />
      )}
      {selected === "Contacts" && (
        <Contacts view={view} workspace={workspace} />
      )}
      {selected === "Pipeline" && (
        <Pipeline view={view} workspace={workspace} />
      )}
      {selected === "Agents" && <Agents view={view} workspace={workspace} />}
      {selected === "Viewings" && (
        <Viewings view={view} workspace={workspace} />
      )}
      {selected === "Follow-ups" && (
        <Followups view={view} workspace={workspace} />
      )}
      {selected === "Activity" && <Activity view={view} />}
    </div>
  );
}

export function PropertyWorkspace() {
  const workspace = useLabWorkspace("property-crm");
  const packet = workspace.packet;
  return (
    <LabShell
      title="Property CRM"
      category="Listings & sales workspace"
      description="Explore fictional Malaysian properties and manage the journey from inquiry to a recorded sales outcome."
      workspace={workspace}
      roles={["customer", "manager", "viewer"]}
    >
      {packet && (
        <Content
          key={[packet.workspaceId, packet.generation, packet.role].join(":")}
          view={packet.state as PropertyView}
          workspace={workspace}
        />
      )}
    </LabShell>
  );
}
