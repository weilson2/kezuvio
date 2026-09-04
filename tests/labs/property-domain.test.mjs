import assert from "node:assert/strict";
import test from "node:test";
import {
  createPropertyModule,
  limits,
  stages,
} from "../../packages/property/index.ts";

const baseline = Date.parse("2026-11-11T04:00:00.000Z");
const fixture = () => {
  let now = baseline;
  const crm = createPropertyModule(() => now);
  return {
    crm,
    state: crm.seed(),
    clock: (time) => {
      now = Date.parse(time);
    },
  };
};
const manager = { role: "manager", customerId: "demo-manager" };
const act = (crm, state, type, args, actor = manager) =>
  crm.reduce(
    state,
    { type, args, requestId: "test", generation: 1, csrf: "test" },
    actor,
  );
const get = (items, id) => items.find((item) => item.id === id);
const ref = ({ id, version }) => ({ id, version });
const fails = (status, text) => (error) =>
  error.status === status && (!text || text.test(error.message));
const move = (crm, state, id, stage, reason = "") =>
  act(crm, state, "lead.move", { ...ref(get(state.leads, id)), stage, reason });
const schedule = (crm, state, leadId, startAt, endAt) =>
  act(crm, state, "appointment.schedule", { leadId, startAt, endAt });
const listingInput = ({ id: _id, version: _version, ...values }) => values;

test("fictional Malaysian fixture has stable records and relative upcoming and overdue dates", () => {
  const { crm, state } = fixture();
  assert.deepEqual(crm.seed(), state);
  assert.equal(state.listings.length, 8);
  assert.equal(state.agents.length, 3);
  assert.equal(state.contacts.length, 8);
  assert.equal(state.leads.length, 10);
  assert.match(state.listings[0].area, /Kuala Lumpur/);
  assert.equal(state.listings[0].priceSen, 45_000_000);
  assert.ok(state.contacts.every((row) => row.email.endsWith(".test")));
  const view = crm.project(state, manager);
  assert.equal(view.analytics.upcomingViewings, 3);
  assert.equal(view.analytics.overdueReminders, 1);
  assert.equal(get(view.reminders, "reminder-1").timing, "Overdue");
  assert.equal(get(view.reminders, "reminder-4").timing, "Completed");
});

test("role projections expose only available properties to Customer and aggregates to Viewer", () => {
  const { crm, state } = fixture();
  const customer = crm.project(state, { ...manager, role: "customer" });
  const viewer = crm.project(state, { ...manager, role: "viewer" });
  assert.equal(customer.listings.length, 7);
  assert.equal(customer.analytics, null);
  assert.equal(viewer.listings.length, 0);
  assert.deepEqual(viewer.analytics.agentWorkload, []);
  assert.equal(viewer.analytics.openLeads, 8);
  for (const packet of [customer, viewer]) {
    for (const key of [
      "contacts",
      "leads",
      "agents",
      "appointments",
      "reminders",
      "history",
    ])
      assert.deepEqual(packet[key], [], key);
  }
  assert.equal(crm.project(state, manager).analytics.agentWorkload.length, 3);
});

test("every non-manager role is denied mutations before processing parameters", () => {
  const { crm, state } = fixture();
  for (const role of ["customer", "viewer", "cashier", "kitchen"]) {
    for (const type of [
      "listing.create",
      "listing.restore",
      "contact.archive",
      "lead.assign",
      "lead.move",
      "appointment.cancel",
      "reminder.complete",
    ])
      assert.throws(
        () => act(crm, state, type, {}, { ...manager, role }),
        fails(403),
      );
  }
});

test("listing edits validate prices and reject unexpected identity or status fields", () => {
  const { crm, state } = fixture();
  const listing = listingInput(state.listings[0]);
  assert.throws(
    () => act(crm, state, "listing.create", { ...listing, priceSen: 5.25 }),
    fails(400),
  );
  assert.throws(
    () =>
      act(crm, state, "listing.create", {
        ...listing,
        priceSen: limits.priceSen + 1,
      }),
    fails(400),
  );
  assert.throws(
    () => act(crm, state, "listing.create", { ...listing, status: "Archived" }),
    fails(400),
  );
  assert.throws(
    () =>
      act(crm, state, "listing.create", {
        ...listing,
        workspaceId: "injected",
      }),
    fails(400),
  );
  const made = act(crm, state, "listing.create", {
    ...listing,
    title: "Fictional Lake House",
  });
  const newListing = made.listings.at(-1);
  assert.equal(newListing.version, 1);
  const edited = act(crm, made, "listing.update", {
    ...ref(newListing),
    ...listing,
    title: "Fictional Revised House",
  });
  assert.equal(edited.listings.at(-1).version, 2);
  assert.equal(made.listings.at(-1).title, "Fictional Lake House");
  assert.throws(
    () =>
      act(crm, edited, "listing.update", { ...ref(newListing), ...listing }),
    fails(409, /changed/),
  );
  assert.equal(edited.history[0].subjectId, newListing.id);
  assert.equal(state.listings.length, 8);
});

test("listing availability and archive protect scheduled appointments and open leads", () => {
  const { crm, state } = fixture();
  const one = get(state.listings, "listing-1");
  assert.throws(
    () => act(crm, state, "listing.update", { ...one, status: "Unavailable" }),
    fails(409, /scheduled/),
  );
  const cancelled = act(
    crm,
    state,
    "appointment.cancel",
    ref(get(state.appointments, "appointment-1")),
  );
  const paused = act(crm, cancelled, "listing.update", {
    ...one,
    status: "Unavailable",
  });
  assert.throws(
    () =>
      act(crm, paused, "listing.archive", ref(get(paused.listings, one.id))),
    fails(409, /open leads/),
  );
  const closedListing = get(paused.listings, "listing-8");
  const archived = act(crm, paused, "listing.archive", ref(closedListing));
  assert.equal(get(archived.listings, closedListing.id).status, "Archived");
  assert.equal(get(archived.leads, "lead-10").listingId, closedListing.id);
});

test("listing restoration preserves historical links, requires an archived current record and keeps it unavailable", () => {
  const { crm, state } = fixture();
  const original = get(state.listings, "listing-8");
  assert.throws(
    () => act(crm, state, "listing.restore", ref(original)),
    fails(409, /archived/),
  );
  assert.throws(
    () =>
      act(crm, state, "listing.restore", { id: "foreign-listing", version: 1 }),
    fails(404),
  );
  const archived = act(crm, state, "listing.archive", ref(original));
  const row = get(archived.listings, original.id);
  assert.throws(
    () => act(crm, archived, "listing.restore", ref(original)),
    fails(409, /changed/),
  );
  assert.throws(
    () =>
      act(crm, archived, "listing.restore", {
        ...ref(row),
        status: "Available",
      }),
    fails(400),
  );
  const restored = act(crm, archived, "listing.restore", ref(row));
  assert.deepEqual(get(restored.listings, row.id), {
    ...original,
    version: 3,
    status: "Unavailable",
  });
  assert.deepEqual(restored.leads, archived.leads);
  assert.deepEqual(restored.appointments, archived.appointments);
  assert.equal(get(archived.listings, row.id).status, "Archived");
  assert.equal(restored.history[0].event, "listing.restore");
  assert.equal(restored.history[0].subjectId, row.id);
  assert.ok(
    !crm
      .project(restored, { ...manager, role: "customer" })
      .listings.some((item) => item.id === row.id),
  );
  assert.throws(
    () =>
      act(
        crm,
        restored,
        "listing.restore",
        ref(get(restored.listings, row.id)),
      ),
    fails(409, /archived/),
  );
  const published = act(crm, restored, "listing.update", {
    ...get(restored.listings, row.id),
    status: "Available",
  });
  assert.ok(
    crm
      .project(published, { ...manager, role: "customer" })
      .listings.some((item) => item.id === row.id),
  );
});

test("agent workload excludes deactivated agents and includes them again after reactivation", () => {
  const { crm, state } = fixture();
  let next = move(crm, state, "lead-5", "Lost", "Fictional inquiry withdrawn.");
  next = move(crm, next, "lead-7", "Lost", "Fictional inquiry withdrawn.");
  const inactive = act(crm, next, "agent.set-active", {
    ...ref(get(next.agents, "agent-3")),
    active: false,
  });
  const projected = crm.project(inactive, manager);
  assert.equal(projected.analytics.agentWorkload.length, 2);
  assert.ok(
    !projected.analytics.agentWorkload.some(
      (item) => item.agentId === "agent-3",
    ),
  );
  assert.equal(get(projected.agents, "agent-3").active, false);
  const reactivated = act(crm, inactive, "agent.set-active", {
    ...ref(get(inactive.agents, "agent-3")),
    active: true,
  });
  assert.deepEqual(
    crm
      .project(reactivated, manager)
      .analytics.agentWorkload.find((item) => item.agentId === "agent-3"),
    {
      agentId: "agent-3",
      name: "Ravi Pillai",
      openLeads: 0,
      upcomingViewings: 0,
    },
  );
});

test("contact CRUD accepts only fictional email and retains historical links on archive", () => {
  const { crm, state } = fixture();
  assert.throws(
    () =>
      act(crm, state, "contact.create", {
        name: "Sample",
        email: "sample@example.com",
        notes: "",
      }),
    fails(400),
  );
  const made = act(crm, state, "contact.create", {
    name: "Sample",
    email: "SAMPLE@EXAMPLE.TEST",
    notes: "Sample",
  });
  assert.equal(made.contacts.at(-1).email, "sample@example.test");
  const next = act(crm, made, "contact.update", {
    ...ref(made.contacts.at(-1)),
    name: "Updated",
    email: "",
    notes: "",
  });
  assert.equal(next.contacts.at(-1).name, "Updated");
  assert.equal(next.contacts.at(-1).version, 2);
  assert.throws(
    () => act(crm, state, "contact.archive", ref(state.contacts[0])),
    fails(409, /open leads/),
  );
  const archived = act(
    crm,
    next,
    "contact.archive",
    ref(get(next.contacts, "contact-8")),
  );
  assert.equal(get(archived.contacts, "contact-8").archived, true);
  assert.equal(get(archived.leads, "lead-10").contactId, "contact-8");
  assert.throws(
    () =>
      act(crm, archived, "lead.create", {
        contactId: "contact-8",
        listingId: null,
        agentId: null,
        source: "Portal",
        notes: "",
      }),
    fails(409),
  );
});

test("lead association edits validate references, assignment availability and outstanding viewings", () => {
  const { crm, state } = fixture();
  const one = get(state.leads, "lead-1");
  const two = get(state.leads, "lead-2");
  const six = get(state.leads, "lead-6");
  assert.throws(
    () => act(crm, state, "lead.assign", { ...ref(one), agentId: "agent-3" }),
    fails(409, /viewing/),
  );
  assert.throws(
    () =>
      act(crm, state, "lead.update", {
        ...ref(one),
        contactId: "contact-1",
        listingId: "listing-3",
        source: "Portal",
        notes: "",
      }),
    fails(409, /viewing/),
  );
  assert.throws(
    () =>
      act(crm, state, "agent.set-active", {
        ...ref(state.agents[0]),
        active: false,
      }),
    fails(409, /open assignments/),
  );
  assert.throws(
    () =>
      act(crm, state, "lead.assign", { ...ref(six), agentId: "unknown-agent" }),
    fails(404),
  );
  assert.throws(
    () =>
      act(crm, state, "lead.update", {
        ...ref(six),
        contactId: "contact-6",
        listingId: "listing-8",
        source: "Portal",
        notes: "",
      }),
    fails(409, /available listing/),
  );
  const cancelled = act(
    crm,
    state,
    "appointment.cancel",
    ref(get(state.appointments, "appointment-2")),
  );
  assert.throws(
    () => act(crm, cancelled, "lead.assign", { ...ref(two), agentId: null }),
    fails(409, /assigned agent/),
  );
  const next = act(crm, cancelled, "lead.assign", {
    ...ref(two),
    agentId: "agent-3",
  });
  assert.equal(get(next.leads, two.id).agentId, "agent-3");
  assert.equal(get(next.appointments, "appointment-2").agentId, "agent-1");
  assert.match(next.history[0].detail, /Assigned/);
});

test("permitted transition matrix is adjacent progression plus Lost from open stages", () => {
  const allowed = {
    New: ["Qualified", "Lost"],
    Qualified: ["Viewing", "Lost"],
    Viewing: ["Offer", "Lost"],
    Offer: ["Won", "Lost"],
    Won: [],
    Lost: [],
  };
  for (const from of stages) {
    for (const to of stages) {
      const { crm, state } = fixture();
      get(state.leads, "lead-4").stage = from;
      const attempt = () =>
        move(crm, state, "lead-4", to, to === "Lost" ? "Search paused" : "");
      if (allowed[from].includes(to)) {
        const result = attempt();
        const changed = get(result.leads, "lead-4");
        assert.equal(changed.stage, to);
        assert.equal(changed.version, 2);
        assert.equal(changed.closedAt !== null, to === "Won" || to === "Lost");
        assert.equal(
          changed.lossReason,
          to === "Lost" ? "Search paused" : null,
        );
        assert.equal(get(state.leads, "lead-4").stage, from);
      } else assert.throws(attempt, fails(409), `${from} → ${to}`);
    }
  }
});

test("stage gates require current listing and agent, then a viewing and its completion", () => {
  const { crm, state } = fixture();
  assert.throws(
    () => move(crm, state, "lead-6", "Qualified"),
    fails(409, /assign/),
  );
  assert.throws(
    () => move(crm, state, "lead-7", "Viewing"),
    fails(409, /Record a viewing/),
  );
  assert.throws(
    () => move(crm, state, "lead-3", "Offer"),
    fails(409, /Complete a viewing/),
  );
  assert.throws(() => move(crm, state, "lead-4", "Lost", ""), fails(400));
  const reassigned = act(crm, state, "lead.assign", {
    ...ref(get(state.leads, "lead-4")),
    agentId: "agent-3",
  });
  assert.throws(
    () => move(crm, reassigned, "lead-4", "Offer"),
    fails(409, /assigned agent/),
  );
  const paused = act(crm, state, "listing.update", {
    ...get(state.listings, "listing-4"),
    status: "Unavailable",
  });
  assert.throws(
    () => move(crm, paused, "lead-4", "Offer"),
    fails(409, /available listing/),
  );
  assert.equal(
    get(move(crm, paused, "lead-4", "Lost", "Listing paused").leads, "lead-4")
      .stage,
    "Lost",
  );
});

test("terminal moves and archival require resolved work and preserve completed records", () => {
  const { crm, state } = fixture();
  assert.throws(
    () => move(crm, state, "lead-1", "Lost", "Declined"),
    fails(409, /viewings/),
  );
  const cancelled = act(
    crm,
    state,
    "appointment.cancel",
    ref(state.appointments[0]),
  );
  assert.throws(
    () => move(crm, cancelled, "lead-1", "Lost", "Declined"),
    fails(409, /reminders/),
  );
  const resolved = act(
    crm,
    cancelled,
    "reminder.complete",
    ref(state.reminders[0]),
  );
  assert.throws(
    () => act(crm, resolved, "lead.archive", ref(state.leads[0])),
    fails(409),
  );
  const closed = move(crm, resolved, "lead-1", "Lost", "Declined");
  const archived = act(
    crm,
    closed,
    "lead.archive",
    ref(get(closed.leads, "lead-1")),
  );
  assert.equal(get(archived.leads, "lead-1").archived, true);
  assert.equal(archived.appointments[0].status, "Cancelled");
  assert.equal(archived.reminders[0].status, "Completed");
  assert.throws(
    () =>
      schedule(
        crm,
        archived,
        "lead-1",
        state.appointments[0].startAt,
        state.appointments[0].endAt,
      ),
    fails(409, /closed/),
  );
});

test("viewing conflicts independently enforce agent and listing with half-open boundaries", () => {
  const { crm, state } = fixture();
  const { startAt, endAt } = state.appointments[0];
  assert.throws(
    () => schedule(crm, state, "lead-2", startAt, endAt),
    fails(409, /already has a viewing/),
  );
  assert.throws(
    () => schedule(crm, state, "lead-7", startAt, endAt),
    fails(409, /already has a viewing/),
  );
  const independent = schedule(crm, state, "lead-5", startAt, endAt);
  assert.equal(independent.appointments.at(-1).status, "Scheduled");
  const adjacentEnd = new Date(Date.parse(endAt) + 30 * 60_000).toISOString();
  const adjacent = schedule(crm, independent, "lead-2", endAt, adjacentEnd);
  assert.equal(adjacent.appointments.at(-1).startAt, endAt);
});

test("rescheduling excludes itself and rejected attempts and cancellation preserve original times", () => {
  const { crm, state } = fixture();
  const [first, second] = state.appointments;
  const before = structuredClone(state);
  assert.throws(
    () =>
      act(crm, state, "appointment.reschedule", {
        ...ref(second),
        startAt: first.startAt,
        endAt: first.endAt,
      }),
    fails(409),
  );
  assert.deepEqual(state, before);
  const same = act(crm, state, "appointment.reschedule", {
    ...ref(first),
    startAt: first.startAt,
    endAt: first.endAt,
  });
  assert.throws(
    () => act(crm, same, "appointment.cancel", ref(first)),
    fails(409, /changed/),
  );
  const cancelled = act(
    crm,
    same,
    "appointment.cancel",
    ref(same.appointments[0]),
  );
  assert.deepEqual(cancelled.appointments[0], {
    ...first,
    version: 3,
    status: "Cancelled",
  });
  assert.throws(
    () =>
      act(crm, cancelled, "appointment.reschedule", {
        ...ref(cancelled.appointments[0]),
        startAt: first.startAt,
        endAt: first.endAt,
      }),
    fails(409),
  );
  const rebooked = schedule(
    crm,
    cancelled,
    "lead-7",
    first.startAt,
    first.endAt,
  );
  assert.equal(rebooked.appointments.at(-1).listingId, first.listingId);
  assert.equal(rebooked.appointments.at(-1).agentId, "agent-3");
});

test("appointment validation rejects calendar overflow, non-UTC data, past starts and invalid duration", () => {
  const { crm, state } = fixture();
  const { startAt, endAt } = state.appointments[0];
  for (const invalid of [
    "2026-11-31T00:00:00.000Z",
    "2026-11-17T10:00:00+08:00",
    "2026-11-10T02:00:00.000Z",
    "2028-01-01T02:00:00.000Z",
  ])
    assert.throws(
      () => schedule(crm, state, "lead-5", invalid, endAt),
      fails(400),
    );
  assert.throws(
    () => schedule(crm, state, "lead-5", startAt, startAt),
    fails(400, /duration/),
  );
  assert.throws(
    () =>
      schedule(
        crm,
        state,
        "lead-5",
        startAt,
        new Date(Date.parse(startAt) + 900001).toISOString(),
      ),
    fails(400, /duration/),
  );
});

test("a viewing can be completed only at or after its scheduled end", () => {
  const { crm, state, clock } = fixture();
  const appointment = get(state.appointments, "appointment-3");
  assert.throws(
    () => act(crm, state, "appointment.complete", ref(appointment)),
    fails(409, /ended/),
  );
  clock(appointment.endAt);
  const completed = act(crm, state, "appointment.complete", ref(appointment));
  assert.equal(get(completed.appointments, appointment.id).status, "Completed");
  assert.equal(
    get(move(crm, completed, "lead-3", "Offer").leads, "lead-3").stage,
    "Offer",
  );
});

test("reminders become overdue at the due instant, complete or cancel once and stay in audit", () => {
  const { crm, state, clock } = fixture();
  const dueAt = "2026-11-11T04:30:00.000Z";
  const pending = act(crm, state, "reminder.create", {
    leadId: "lead-4",
    dueAt,
    reason: "Send no message. Review notes internally.",
  });
  const reminder = pending.reminders.at(-1);
  assert.equal(
    crm.project(pending, manager).reminders.at(-1).timing,
    "Upcoming",
  );
  clock(dueAt);
  assert.equal(
    crm.project(pending, manager).reminders.at(-1).timing,
    "Overdue",
  );
  const completed = act(crm, pending, "reminder.complete", ref(reminder));
  assert.equal(
    crm.project(completed, manager).reminders.at(-1).timing,
    "Completed",
  );
  assert.throws(
    () =>
      act(crm, completed, "reminder.cancel", ref(completed.reminders.at(-1))),
    fails(409, /resolved/),
  );
  const cancelled = act(crm, pending, "reminder.cancel", ref(reminder));
  assert.equal(
    crm.project(cancelled, manager).reminders.at(-1).timing,
    "Cancelled",
  );
  assert.equal(cancelled.history[0].event, "reminder.cancel");
});

test("analytics reconcile closed-lead conversion and distinct available asking prices", () => {
  const { crm, state } = fixture();
  const wanted = new Set(["lead-1", "lead-2", "lead-7", "lead-9", "lead-10"]);
  state.leads = state.leads.filter((lead) => wanted.has(lead.id));
  const result = crm.project(state, manager).analytics;
  assert.equal(result.openLeads, 3);
  assert.equal(result.won, 1);
  assert.equal(result.lost, 1);
  assert.equal(result.conversionTenths, 500);
  assert.equal(result.askingValueSen, 105_000_000);
  assert.equal(
    result.agentWorkload.find((item) => item.agentId === "agent-1").openLeads,
    2,
  );
  for (const id of ["lead-9", "lead-10"]) get(state.leads, id).archived = true;
  assert.equal(crm.project(state, manager).analytics.conversionTenths, null);
});

test("record limits and rolling product audit preserve previous state", () => {
  const { crm, state } = fixture();
  const listing = state.listings[0];
  state.listings = Array.from({ length: limits.listings }, (_, index) => ({
    ...listing,
    id: `cap-${index}`,
  }));
  assert.throws(
    () => act(crm, state, "listing.create", listingInput(listing)),
    fails(429),
  );
  state.history = Array.from({ length: limits.history }, (_, index) => ({
    id: `event-${index}`,
    at: new Date(baseline).toISOString(),
    event: "demo",
    subjectId: "demo",
    detail: "",
  }));
  const next = act(crm, state, "listing.update", {
    ...state.listings[0],
    title: "Updated",
  });
  assert.equal(next.history.length, limits.history);
  assert.equal(next.history[0].event, "listing.update");
  assert.equal(next.history.at(-1).id, "event-148");
  assert.equal(state.history.at(-1).id, "event-149");
});
