import { randomUUID } from "node:crypto";
import {
  assertRole,
  integer,
  LabsError,
  type Action,
  type ProductModule,
} from "../demo-platform/index.ts";
import {
  limits,
  listingTypes,
  nextStage,
  stages,
  type Agent,
  type Appointment,
  type Contact,
  type Lead,
  type Listing,
  type PropertyAnalytics,
  type PropertyState,
  type PropertyView,
  type Reminder,
  type Stage,
  type Versioned,
} from "./model.ts";
import { seedProperty } from "./seed.ts";

export * from "./model.ts";

const dayMs = 24 * 60 * 60 * 1000;
const terminal = (stage: Stage) => stage === "Won" || stage === "Lost";
const open = (lead: Lead) => !lead.archived && !terminal(lead.stage);

function reject(message: string): never {
  throw new LabsError(409, message);
}

function fields(args: Action["args"], keys: readonly string[]) {
  if (
    Object.keys(args).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(args, key))
  )
    throw new LabsError(400, "Unexpected or missing action arguments.");
}

function input(value: unknown, label: string, max: number, optional = false) {
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (!optional && !value.trim())
  )
    throw new LabsError(
      400,
      `${label} must be ${optional ? "at most" : "between 1 and"} ${max} characters.`,
    );
  return value.trim();
}

function choice<T extends string>(
  value: unknown,
  choices: readonly T[],
  label: string,
): T {
  if (
    typeof value !== "string" ||
    !choices.some((allowed) => allowed === value)
  )
    throw new LabsError(400, `Select a valid ${label}.`);
  return value as T;
}

function get<T extends Versioned>(rows: T[], value: unknown, label: string): T {
  const id = input(value, `${label} ID`, 80);
  const row = rows.find((item) => item.id === id);
  if (!row) throw new LabsError(404, `${label} not found in this workspace.`);
  return row;
}

function versioned<T extends Versioned>(
  rows: T[],
  args: Action["args"],
  label: string,
): T {
  const row = get(rows, args.id, label);
  if (integer(args.version, "Record version", 1) !== row.version)
    reject("This record changed. Refresh the workspace before editing.");
  return row;
}

function change<T extends Versioned>(
  row: T,
  changes: Partial<Omit<T, keyof Versioned>>,
) {
  Object.assign(row, changes);
  row.version++;
}

function insert<T extends Versioned>(
  rows: T[],
  values: Omit<T, keyof Versioned>,
  limit: number,
): T {
  if (rows.length >= limit)
    throw new LabsError(
      429,
      "This workspace reached its record limit. Reset the demo to start again.",
    );
  const row = { ...values, id: randomUUID(), version: 1 } as T;
  rows.push(row);
  return row;
}

const listingFields = [
  "title",
  "area",
  "type",
  "priceSen",
  "bedrooms",
  "bathrooms",
  "sizeSqft",
  "description",
  "status",
];

function listingInput(args: Action["args"]): Omit<Listing, keyof Versioned> {
  return {
    title: input(args.title, "Title", 80),
    area: input(args.area, "Area", 80),
    type: choice(args.type, listingTypes, "property type"),
    priceSen: integer(args.priceSen, "Asking price in sen", 1, limits.priceSen),
    bedrooms: integer(args.bedrooms, "Bedrooms", 0, 30),
    bathrooms: integer(args.bathrooms, "Bathrooms", 0, 30),
    sizeSqft: integer(args.sizeSqft, "Size in square feet", 1, 100_000),
    description: input(args.description, "Description", 400, true),
    status: choice(args.status, ["Available", "Unavailable"], "listing status"),
  };
}

const contactFields = ["name", "email", "notes"];

function contactInput(
  args: Action["args"],
): Omit<Contact, keyof Versioned | "archived"> {
  const email = input(args.email, "Sample email", 120, true).toLowerCase();
  if (
    email &&
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9]+(?:-[a-z0-9]+)*\.)+test$/.test(
      email,
    )
  )
    throw new LabsError(
      400,
      "Use a fictional .test email address or leave it blank.",
    );
  return {
    name: input(args.name, "Contact name", 80),
    email,
    notes: input(args.notes, "Notes", 400, true),
  };
}

function available(state: PropertyState, id: unknown) {
  const listing = get(state.listings, id, "Listing");
  if (listing.status !== "Available") reject("Choose an available listing.");
  return listing;
}

function activeAgent(state: PropertyState, id: unknown) {
  const agent = get(state.agents, id, "Agent");
  if (!agent.active) reject("Choose an active agent.");
  return agent;
}

function activeContact(state: PropertyState, id: unknown) {
  const contact = get(state.contacts, id, "Contact");
  if (contact.archived) reject("Choose a contact that is not archived.");
  return contact;
}

function scheduled(state: PropertyState, leadId: string) {
  return state.appointments.some(
    (item) => item.leadId === leadId && item.status === "Scheduled",
  );
}

function appointmentReady(state: PropertyState, lead: Lead) {
  activeContact(state, lead.contactId);
  if (lead.listingId === null || lead.agentId === null)
    reject("Choose an available listing and assign an active agent first.");
  return {
    listingId: available(state, lead.listingId).id,
    agentId: activeAgent(state, lead.agentId).id,
  };
}

function requireOpen(lead: Lead) {
  if (!open(lead)) reject("This lead is closed. Its history is read-only.");
}

function clearOutstanding(state: PropertyState, lead: Lead) {
  if (scheduled(state, lead.id))
    reject("Complete or cancel scheduled viewings before closing this lead.");
  if (
    state.reminders.some(
      (item) => item.leadId === lead.id && item.status === "Pending",
    )
  )
    reject("Complete or cancel pending reminders before closing this lead.");
}

function instant(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  )
    throw new LabsError(400, `${label} must be a valid UTC date and time.`);
  const ms = Date.parse(value);
  if (!Number.isFinite(ms) || new Date(ms).toISOString() !== value)
    throw new LabsError(400, `${label} must be a valid UTC date and time.`);
  return value;
}

function slot(
  state: PropertyState,
  lead: Lead,
  args: Action["args"],
  now: number,
  ignore?: string,
) {
  requireOpen(lead);
  const { listingId, agentId } = appointmentReady(state, lead);
  const startAt = instant(args.startAt, "Viewing start");
  const endAt = instant(args.endAt, "Viewing end");
  const start = Date.parse(startAt),
    end = Date.parse(endAt);
  const minutes = (end - start) / 60_000;
  if (start < now || start > now + 365 * dayMs)
    throw new LabsError(
      400,
      "Choose a viewing start between now and 365 days from now.",
    );
  if (!Number.isInteger(minutes) || minutes < 15 || minutes > 120)
    throw new LabsError(400, "Viewing duration must be 15–120 whole minutes.");
  if (
    state.appointments.some(
      (item) =>
        item.id !== ignore &&
        item.status === "Scheduled" &&
        (item.listingId === listingId || item.agentId === agentId) &&
        start < Date.parse(item.endAt) &&
        Date.parse(item.startAt) < end,
    )
  )
    reject("The agent or property already has a viewing during that time.");
  return { leadId: lead.id, listingId, agentId, startAt, endAt };
}

function apply(
  state: PropertyState,
  action: Action,
  now: number,
): { id: string; detail: string } {
  const a = action.args;
  switch (action.type) {
    case "listing.create": {
      fields(a, listingFields);
      const row = insert(state.listings, listingInput(a), limits.listings);
      return { id: row.id, detail: "Listing created." };
    }
    case "listing.update": {
      fields(a, ["id", "version", ...listingFields]);
      const row = versioned(state.listings, a, "Listing");
      if (row.status === "Archived") reject("Archived listings are read-only.");
      const values = listingInput(a);
      if (
        values.status === "Unavailable" &&
        state.appointments.some(
          (item) => item.listingId === row.id && item.status === "Scheduled",
        )
      )
        reject(
          "Resolve scheduled viewings before making this listing unavailable.",
        );
      change(row, values);
      return {
        id: row.id,
        detail: "Listing details and availability updated.",
      };
    }
    case "listing.archive": {
      fields(a, ["id", "version"]);
      const row = versioned(state.listings, a, "Listing");
      if (row.status === "Archived")
        reject("This listing is already archived.");
      if (
        state.leads.some((lead) => lead.listingId === row.id && open(lead)) ||
        state.appointments.some(
          (item) => item.listingId === row.id && item.status === "Scheduled",
        )
      )
        reject(
          "Resolve open leads and scheduled viewings before archiving this listing.",
        );
      change(row, { status: "Archived" });
      return {
        id: row.id,
        detail: "Listing archived. Historical links retained.",
      };
    }
    case "listing.restore": {
      fields(a, ["id", "version"]);
      const row = versioned(state.listings, a, "Listing");
      if (row.status !== "Archived")
        reject("Only an archived listing can be restored.");
      change(row, { status: "Unavailable" });
      return {
        id: row.id,
        detail:
          "Listing restored as unavailable. Review it before making it available.",
      };
    }
    case "contact.create": {
      fields(a, contactFields);
      const row = insert(
        state.contacts,
        { ...contactInput(a), archived: false },
        limits.contacts,
      );
      return { id: row.id, detail: "Contact created." };
    }
    case "contact.update": {
      fields(a, ["id", "version", ...contactFields]);
      const row = versioned(state.contacts, a, "Contact");
      if (row.archived) reject("Archived contacts are read-only.");
      change(row, contactInput(a));
      return { id: row.id, detail: "Contact updated." };
    }
    case "contact.archive": {
      fields(a, ["id", "version"]);
      const row = versioned(state.contacts, a, "Contact");
      if (row.archived) reject("This contact is already archived.");
      if (state.leads.some((lead) => lead.contactId === row.id && open(lead)))
        reject("Resolve this contact's open leads before archiving.");
      change(row, { archived: true });
      return {
        id: row.id,
        detail: "Contact archived. Historical links retained.",
      };
    }
    case "agent.set-active": {
      fields(a, ["id", "version", "active"]);
      const row = versioned(state.agents, a, "Agent");
      if (typeof a.active !== "boolean")
        throw new LabsError(400, "Choose an agent availability.");
      if (
        !a.active &&
        (state.leads.some((lead) => lead.agentId === row.id && open(lead)) ||
          state.appointments.some(
            (item) => item.agentId === row.id && item.status === "Scheduled",
          ))
      )
        reject(
          "Resolve open assignments and scheduled viewings before deactivating this agent.",
        );
      change(row, { active: a.active });
      return {
        id: row.id,
        detail: a.active ? "Agent activated." : "Agent deactivated.",
      };
    }
    case "lead.create": {
      fields(a, ["contactId", "listingId", "agentId", "source", "notes"]);
      const row = insert(
        state.leads,
        {
          contactId: activeContact(state, a.contactId).id,
          listingId:
            a.listingId === null ? null : available(state, a.listingId).id,
          agentId: a.agentId === null ? null : activeAgent(state, a.agentId).id,
          source: input(a.source, "Lead source", 50),
          notes: input(a.notes, "Notes", 400, true),
          stage: "New",
          lossReason: null,
          closedAt: null,
          archived: false,
        },
        limits.leads,
      );
      return { id: row.id, detail: "Lead created in New." };
    }
    case "lead.update": {
      fields(a, ["id", "version", "contactId", "listingId", "source", "notes"]);
      const row = versioned(state.leads, a, "Lead");
      requireOpen(row);
      if (a.listingId !== row.listingId && scheduled(state, row.id))
        reject("Resolve the scheduled viewing before changing the listing.");
      const listingId =
        a.listingId === row.listingId
          ? row.listingId
          : a.listingId === null
            ? null
            : available(state, a.listingId).id;
      if (listingId === null && row.stage !== "New")
        reject("A qualified lead must keep a listing.");
      change(row, {
        contactId: activeContact(state, a.contactId).id,
        listingId,
        source: input(a.source, "Lead source", 50),
        notes: input(a.notes, "Notes", 400, true),
      });
      return { id: row.id, detail: "Lead details updated." };
    }
    case "lead.assign": {
      fields(a, ["id", "version", "agentId"]);
      const row = versioned(state.leads, a, "Lead");
      requireOpen(row);
      if (a.agentId !== row.agentId && scheduled(state, row.id))
        reject(
          "Resolve the scheduled viewing before changing the assigned agent.",
        );
      const agentId =
        a.agentId === null ? null : activeAgent(state, a.agentId).id;
      if (agentId === null && row.stage !== "New")
        reject("A qualified lead must keep an assigned agent.");
      change(row, { agentId });
      return {
        id: row.id,
        detail: agentId
          ? `Assigned to ${get(state.agents, agentId, "Agent").name}.`
          : "Agent assignment removed.",
      };
    }
    case "lead.move": {
      fields(a, ["id", "version", "stage", "reason"]);
      const row = versioned(state.leads, a, "Lead");
      requireOpen(row);
      const stage = choice(a.stage, stages, "sales stage");
      const reason = input(a.reason, "Move reason", 200, stage !== "Lost");
      if (stage !== "Lost" && nextStage[row.stage] !== stage)
        reject("Choose the next permitted stage or record the lead as Lost.");
      if (stage !== "Lost") {
        const { listingId, agentId } = appointmentReady(state, row);
        if (
          stage !== "Qualified" &&
          !state.appointments.some(
            (item) =>
              item.leadId === row.id &&
              item.listingId === listingId &&
              item.agentId === agentId &&
              (item.status === "Completed" ||
                (stage === "Viewing" && item.status === "Scheduled")),
          )
        )
          reject(
            stage === "Viewing"
              ? "Record a viewing for this listing and assigned agent first."
              : "Complete a viewing for this listing and assigned agent first.",
          );
      }
      if (terminal(stage)) clearOutstanding(state, row);
      const previous = row.stage;
      change(row, {
        stage,
        lossReason: stage === "Lost" ? reason : null,
        closedAt: terminal(stage) ? new Date(now).toISOString() : null,
      });
      return {
        id: row.id,
        detail: `${previous} → ${stage}.${reason ? ` ${reason}` : ""}`,
      };
    }
    case "lead.archive": {
      fields(a, ["id", "version"]);
      const row = versioned(state.leads, a, "Lead");
      if (!terminal(row.stage) || row.archived)
        reject("Only an unarchived Won or Lost lead can be archived.");
      clearOutstanding(state, row);
      change(row, { archived: true });
      return {
        id: row.id,
        detail: "Closed lead archived. Historical links retained.",
      };
    }
    case "appointment.schedule": {
      fields(a, ["leadId", "startAt", "endAt"]);
      const lead = get(state.leads, a.leadId, "Lead");
      const row = insert(
        state.appointments,
        { ...slot(state, lead, a, now), status: "Scheduled" },
        limits.appointments,
      );
      return { id: row.id, detail: "Viewing scheduled." };
    }
    case "appointment.reschedule": {
      fields(a, ["id", "version", "startAt", "endAt"]);
      const row = versioned(state.appointments, a, "Viewing");
      if (row.status !== "Scheduled")
        reject("Only a scheduled viewing can be rescheduled.");
      const lead = get(state.leads, row.leadId, "Lead");
      change(row, slot(state, lead, a, now, row.id));
      return { id: row.id, detail: "Viewing rescheduled." };
    }
    case "appointment.cancel":
    case "appointment.complete": {
      fields(a, ["id", "version"]);
      const row = versioned(state.appointments, a, "Viewing");
      if (row.status !== "Scheduled")
        reject("This viewing has already been resolved.");
      const complete = action.type === "appointment.complete";
      if (complete && Date.parse(row.endAt) > now)
        reject("A viewing can be completed once its time slot has ended.");
      change(row, { status: complete ? "Completed" : "Cancelled" });
      return {
        id: row.id,
        detail: complete
          ? "Viewing marked complete."
          : "Viewing cancelled. Its slot is released.",
      };
    }
    case "reminder.create": {
      fields(a, ["leadId", "dueAt", "reason"]);
      const lead = get(state.leads, a.leadId, "Lead");
      requireOpen(lead);
      const dueAt = instant(a.dueAt, "Reminder due time");
      if (Math.abs(Date.parse(dueAt) - now) > 365 * dayMs)
        throw new LabsError(400, "Choose a reminder due time within 365 days.");
      const row = insert(
        state.reminders,
        {
          leadId: lead.id,
          dueAt,
          reason: input(a.reason, "Reminder reason", 200),
          status: "Pending",
        },
        limits.reminders,
      );
      return { id: row.id, detail: "Internal follow-up reminder created." };
    }
    case "reminder.cancel":
    case "reminder.complete": {
      fields(a, ["id", "version"]);
      const row = versioned(state.reminders, a, "Reminder");
      if (row.status !== "Pending")
        reject("This reminder has already been resolved.");
      const complete = action.type === "reminder.complete";
      change(row, { status: complete ? "Completed" : "Cancelled" });
      return {
        id: row.id,
        detail: complete
          ? "Follow-up marked complete."
          : "Follow-up cancelled.",
      };
    }
    default:
      throw new LabsError(400, "Unknown property action.");
  }
}

function analytics(
  state: PropertyState,
  now: number,
  includeAgents: boolean,
): PropertyAnalytics {
  const counts: Record<Stage, number> = {
    New: 0,
    Qualified: 0,
    Viewing: 0,
    Offer: 0,
    Won: 0,
    Lost: 0,
  };
  for (const lead of state.leads) if (!lead.archived) counts[lead.stage]++;
  const openLeads = state.leads.filter(open);
  const linked = new Set(openLeads.map((lead) => lead.listingId));
  const upcoming = state.appointments.filter(
    (item) => item.status === "Scheduled" && Date.parse(item.startAt) >= now,
  );
  const closed = counts.Won + counts.Lost;
  return {
    stages: counts,
    openLeads: openLeads.length,
    won: counts.Won,
    lost: counts.Lost,
    conversionTenths: closed ? Math.round((1000 * counts.Won) / closed) : null,
    askingValueSen: state.listings.reduce(
      (sum, item) =>
        sum +
        (item.status === "Available" && linked.has(item.id)
          ? item.priceSen
          : 0),
      0,
    ),
    upcomingViewings: upcoming.length,
    overdueReminders: state.reminders.filter(
      (item) => item.status === "Pending" && Date.parse(item.dueAt) <= now,
    ).length,
    agentWorkload: includeAgents
      ? state.agents
          .filter((agent) => agent.active)
          .map((agent) => ({
            agentId: agent.id,
            name: agent.name,
            openLeads: openLeads.filter((lead) => lead.agentId === agent.id)
              .length,
            upcomingViewings: upcoming.filter(
              (item) => item.agentId === agent.id,
            ).length,
          }))
      : [],
    unassignedLeads: openLeads.filter((lead) => lead.agentId === null).length,
  };
}

export function createPropertyModule(
  clock: () => number = Date.now,
): ProductModule<PropertyState> {
  return {
    id: "property-crm",
    seed: () => seedProperty(clock()),
    reduce(previous, action, actor) {
      assertRole(actor.role, ["manager"]);
      const next = structuredClone(previous);
      const now = clock();
      const event = apply(next, action, now);
      next.history.unshift({
        id: randomUUID(),
        at: new Date(now).toISOString(),
        event: action.type,
        subjectId: event.id,
        detail: event.detail,
      });
      next.history.length = Math.min(next.history.length, limits.history);
      return next;
    },
    project(state, actor): PropertyView {
      const now = clock(),
        asOf = new Date(now).toISOString();
      const manager = actor.role === "manager";
      return {
        asOf,
        listings: manager
          ? state.listings
          : actor.role === "customer"
            ? state.listings.filter((item) => item.status === "Available")
            : [],
        contacts: manager ? state.contacts : [],
        agents: manager ? state.agents : [],
        leads: manager ? state.leads : [],
        appointments: manager ? state.appointments : [],
        reminders: manager
          ? state.reminders.map((item) => ({
              ...item,
              timing:
                item.status !== "Pending"
                  ? item.status
                  : Date.parse(item.dueAt) <= now
                    ? "Overdue"
                    : "Upcoming",
            }))
          : [],
        history: manager ? state.history : [],
        analytics:
          manager || actor.role === "viewer"
            ? analytics(state, now, manager)
            : null,
      };
    },
  };
}

export const propertyModule = createPropertyModule();
