import {
  test,
  expect,
  type Page,
  type APIRequestContext,
  type Locator,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { PropertyView } from "../../packages/property/model";

const origin = "http://127.0.0.1:3100";
const product = "property-crm";
const url = "/demo/property-crm";
const title = "Sample Taman Melati Residence";
const contactName = "Sample Farah Melati";

type Packet<State = PropertyView> = {
  csrf: string;
  generation: number;
  role: string;
  state: State;
};
function payload(
  packet: Packet<unknown>,
  type: string,
  args: Record<string, unknown> = {},
) {
  return {
    type,
    args,
    csrf: packet.csrf,
    generation: packet.generation,
    requestId: crypto.randomUUID(),
  };
}
function required<T>(value: T | null | undefined, name: string): T {
  if (value == null) throw new Error(`Missing ${name}.`);
  return value;
}
const post = (request: APIRequestContext, data: unknown, name = product) =>
  request.post(`/api/labs/${name}/action`, {
    headers: { Origin: origin },
    data,
  });
async function session<State = PropertyView>(
  request: APIRequestContext,
  name = product,
): Promise<Packet<State>> {
  const response = await request.get(`/api/labs/${name}/session`);
  expect(response.status()).toBe(200);
  return response.json();
}
async function mutate<State>(
  request: APIRequestContext,
  packet: Packet<State>,
  type: string,
  args: Record<string, unknown> = {},
  name = product,
): Promise<Packet<State>> {
  const response = await post(request, payload(packet, type, args), name);
  if (!response.ok())
    throw new Error(
      `${type} failed (${response.status()}): ${await response.text()}`,
    );
  return response.json();
}
const manager = async (request: APIRequestContext) =>
  mutate(request, await session(request), "role", { role: "manager" });
const button = (container: Page | Locator, name: string) =>
  container.getByRole("button", { name, exact: true });
const field = (container: Page | Locator, name: string) =>
  container.getByLabel(name, { exact: true });
const future = (minutes = 0) =>
  new Date(
    Math.ceil(Date.now() / 60000) * 60000 + (10 * 1440 + minutes) * 60000,
  );
const myt = (instant: Date) =>
  new Date(instant.getTime() + 8 * 3600000).toISOString().slice(0, 16);

async function role(page: Page, value: string) {
  const selector = field(page, "Demo role");
  await selector.selectOption(value);
  await expect(selector).toBeEnabled();
  await expect(selector).toHaveValue(value);
}
async function saved(page: Page) {
  await expect(page.locator(".labs-status")).not.toContainText(
    "Syncing workspace",
  );
  await expect(page.locator(".labs-error")).toHaveCount(0);
}
async function refresh(page: Page) {
  await button(page, "Refresh workspace").click();
  await saved(page);
}
async function listingForm(page: Page, name = title) {
  await button(page, "Add listing").click();
  await field(page, "Listing title").fill(name);
  await field(page, "Area").fill("Taman Melati, Kuala Lumpur");
  await field(page, "Asking price (RM)").fill("625000");
  await field(page, "Bedrooms").fill("3");
  await field(page, "Bathrooms").fill("2");
  await field(page, "Floor area (sq ft)").fill("1080");
  await field(page, "Description").fill(
    "Fictional three-bedroom residence for the local CRM demonstration.",
  );
}

test("manager creates a listing, contact and lead, assigns it, and uses the keyboard pipeline and viewing workflows", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/demo");
  const link = page.locator(`a[href="${url}"]`);
  await expect(link).toHaveCount(1);
  await link.click();
  await role(page, "manager");
  await button(page, "Listings").click();
  await listingForm(page);
  await button(page, "Save listing").click();
  await saved(page);
  const listing = required(
    (await session(page.request)).state.listings.find((x) => x.title === title),
    "created listing",
  );
  const listingCard = page.getByTestId(`property-listing-${listing.id}`);
  await field(page, "Search listings").fill("Taman Melati");
  await expect(listingCard).toBeVisible();
  await field(page, "Maximum price (RM)").fill("624999");
  await expect(listingCard).toHaveCount(0);
  await field(page, "Maximum price (RM)").fill("625000");
  await expect(listingCard).toBeVisible();

  await button(page, "Contacts").click();
  await button(page, "Add contact").click();
  await field(page, "Contact name").fill(contactName);
  await field(page, "Fictional email").fill("farah-melati@example.test");
  await button(page, "Save contact").click();
  await saved(page);
  const contact = required(
    (await session(page.request)).state.contacts.find(
      (x) => x.name === contactName,
    ),
    "created contact",
  );

  await button(page, "Pipeline").click();
  await button(page, "Add lead").click();
  await field(page, "Contact").selectOption(contact.id);
  await field(page, "Listing").selectOption(listing.id);
  await field(page, "Source").fill("Sample referral");
  await field(page, "Notes").fill(
    "Fictional buyer requests a weekend viewing.",
  );
  await button(page, "Save lead").click();
  await saved(page);
  let packet = await session(page.request);
  const lead = required(
    packet.state.leads.find((x) => x.contactId === contact.id),
    "created lead",
  );
  const card = page.getByTestId(`property-lead-${lead.id}`);
  await button(card, "Assign agent").click();
  await field(card, "Assigned agent").selectOption(
    required(
      packet.state.agents.find((x) => x.active),
      "active agent",
    ).id,
  );
  await button(card, "Save assignment").click();
  await saved(page);

  const move = async (stage: string, id = lead.id) => {
    const currentCard = page.getByTestId(`property-lead-${id}`);
    await field(currentCard, "Move to stage").selectOption({ label: stage });
    await button(currentCard, "Move lead").focus();
    await page.keyboard.press("Enter");
    await saved(page);
    await expect
      .poll(
        async () =>
          (await session(page.request)).state.leads.find((x) => x.id === id)
            ?.stage,
      )
      .toBe(stage);
    await expect(page.locator(`#property-lead-heading-${id}`)).toBeFocused();
  };
  await move("Qualified");

  await button(page, "Viewings").click();
  await button(page, "Schedule viewing").click();
  await field(page, "Lead").selectOption(lead.id);
  await field(page, "Starts (MYT)").fill(myt(future()));
  await field(page, "Duration (minutes)").fill("30");
  await button(page, "Save viewing").click();
  await saved(page);
  packet = await session(page.request);
  const viewing = required(
    packet.state.appointments.find((x) => x.leadId === lead.id),
    "saved viewing",
  );
  await button(page, "Schedule viewing").click();
  await field(page, "Lead").selectOption(lead.id);
  await field(page, "Starts (MYT)").fill(myt(new Date(viewing.startAt)));
  await field(page, "Duration (minutes)").fill("30");
  await button(page, "Save viewing").click();
  await expect(page.locator(".labs-error")).toContainText(
    /overlap|conflict|already/i,
  );
  expect((await session(page.request)).state.appointments).toEqual(
    packet.state.appointments,
  );
  await refresh(page);
  await button(page, "Pipeline").click();
  await move("Viewing");

  await button(page, "Follow-ups").click();
  await button(page, "Add reminder").click();
  await field(page, "Lead").selectOption(lead.id);
  await field(page, "Due (MYT)").fill(myt(future(60)));
  await field(page, "Reason").fill("Fictional reminder to review the viewing.");
  await button(page, "Save reminder").click();
  await saved(page);
  const reminder = required(
    (await session(page.request)).state.reminders.find(
      (x) => x.leadId === lead.id,
    ),
    "saved reminder",
  );
  await button(
    page.getByTestId(`property-reminder-${reminder.id}`),
    "Complete reminder",
  ).click();
  await saved(page);

  await page.reload();
  await expect(field(page, "Demo role")).toHaveValue("manager");
  await button(page, "Pipeline").click();
  await expect(card).toContainText(contactName);
  packet = await session(page.request);
  expect(packet.state.leads.find((x) => x.id === lead.id)?.stage).toBe(
    "Viewing",
  );
  expect(packet.state.appointments.some((x) => x.id === viewing.id)).toBe(true);
  expect(packet.state.reminders.find((x) => x.id === reminder.id)?.status).toBe(
    "Completed",
  );
  const previous = required(packet.state.analytics, "manager analytics");
  // This seeded lead has already attended a viewing, so it can be closed now.
  await move("Offer", "lead-4");
  await move("Won", "lead-4");
  await button(page, "Overview").click();
  packet = await session(page.request);
  const analytics = required(packet.state.analytics, "manager analytics");
  expect(analytics.won).toBe(previous.won + 1);
  expect(analytics.lost).toBe(previous.lost);
  expect(analytics.openLeads).toBe(previous.openLeads - 1);
  expect(analytics.conversionTenths).toBe(667);
  await expect(page.getByTestId("property-conversion")).toHaveText("66.7%");
  const distinctListings = new Set(
    packet.state.leads
      .filter((l) => !l.archived && !["Won", "Lost"].includes(l.stage))
      .map((l) => l.listingId),
  );
  const askingValue = packet.state.listings
    .filter((l) => l.status === "Available" && distinctListings.has(l.id))
    .reduce((sum, l) => sum + l.priceSen, 0);
  expect(analytics.askingValueSen).toBe(askingValue);
  await button(page, "Activity").click();
  await expect(page.getByText("Offer → Won.", { exact: true })).toBeVisible();
  const assignmentEvent = page
    .getByRole("listitem")
    .filter({
      has: page.getByRole("heading", { name: "lead.assign", exact: true }),
    })
    .filter({ hasText: lead.id });
  await expect(assignmentEvent).toContainText("Lead for " + contactName);
});

test("manager restores an archived listing as unavailable, preserves history and returns editor keyboard focus", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto(url);
  await role(page, "manager");
  await button(page, "Listings").click();

  const add = button(page, "Add listing");
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(field(page, "Listing title")).toBeFocused();
  const { violations } = await new AxeBuilder({ page })
    .include(".property-editor")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(violations).toEqual([]);
  await button(page, "Close form").focus();
  await page.keyboard.press("Enter");
  await expect(add).toBeFocused();

  const before = await session(page.request);
  const listing = required(
    before.state.listings.find((item) => item.id === "listing-7"),
    "historical listing",
  );
  const historicalLead = required(
    before.state.leads.find((item) => item.id === "lead-9"),
    "closed lead linked to listing",
  );
  const historicalViewing = required(
    before.state.appointments.find((item) => item.id === "appointment-5"),
    "completed historical viewing",
  );
  const card = page.getByTestId(`property-listing-${listing.id}`);
  await button(card, "Archive listing").click();
  await saved(page);
  await expect(button(card, "Restore listing")).toBeVisible();
  await role(page, "customer");
  await expect(card).toHaveCount(0);

  await role(page, "manager");
  await button(page, "Listings").click();
  await button(card, "Restore listing").click();
  await saved(page);
  await expect(card.locator(".badge")).toHaveText("Unavailable");
  await expect(page.locator(".labs-status")).toContainText(
    "restored as unavailable",
  );
  const restored = await session(page.request);
  expect(
    restored.state.leads.find((item) => item.id === historicalLead.id),
  ).toEqual(historicalLead);
  expect(
    restored.state.appointments.find(
      (item) => item.id === historicalViewing.id,
    ),
  ).toEqual(historicalViewing);
  await role(page, "customer");
  await expect(card).toHaveCount(0);

  await role(page, "manager");
  await button(page, "Listings").click();
  const edit = button(card, "Edit listing");
  await edit.focus();
  await page.keyboard.press("Enter");
  await expect(field(page, "Listing title")).toBeFocused();
  const restoredTitle = "Sample Restored Mutiara Terrace";
  await field(page, "Listing title").fill(restoredTitle);
  await field(page, "Availability").selectOption("Available");
  await button(page, "Save listing").focus();
  await page.keyboard.press("Enter");
  await saved(page);
  await expect(edit).toBeFocused();
  await expect(card).toContainText(restoredTitle);

  await button(page, "Activity").click();
  const restorationEvent = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "listing.restore", exact: true }),
  });
  await expect(restorationEvent).toContainText(restoredTitle);
  await expect(restorationEvent).toContainText(listing.id);
  await role(page, "customer");
  await expect(card).toContainText(restoredTitle);
  await page.reload();
  await expect(card).toContainText(restoredTitle);
});

test("a lost listing-save response refreshes the saved result without repeating the write", async ({
  page,
}) => {
  await page.goto(url);
  await role(page, "manager");
  await button(page, "Listings").click();
  const name = "Fictional Lost Response Suite";
  await listingForm(page, name);
  await page.route(
    "**/api/labs/property-crm/action",
    async (route) => {
      await route.fetch();
      await route.abort();
    },
    { times: 1 },
  );
  await button(page, "Save listing").click();
  await expect(page.locator(".labs-error")).toContainText(
    "connection was interrupted",
  );
  await expect(button(page, "Save listing")).toBeDisabled();
  await refresh(page);
  const records = (await session(page.request)).state.listings;
  expect(records.filter((x) => x.title === name)).toHaveLength(1);
});

type Collection = Exclude<keyof PropertyView, "asOf" | "analytics">;
function records<K extends Collection>(
  packet: Packet,
  collection: K,
): PropertyView[K][number][] {
  return packet.state[collection];
}
function getRecord<K extends Collection>(
  packet: Packet,
  collection: K,
  id: string,
) {
  return required(
    records(packet, collection).find((x) => x.id === id),
    `${collection} record ${id}`,
  );
}
function newRecord<K extends Collection>(
  previous: Packet,
  current: Packet,
  collection: K,
) {
  const ids = new Set(records(previous, collection).map((x) => x.id));
  const additions = records(current, collection).filter((x) => !ids.has(x.id));
  expect(additions).toHaveLength(1);
  return additions[0];
}
async function qualified(
  request: APIRequestContext,
  packet: Packet,
  listingId: string,
  agentId: string,
) {
  const created = await mutate(request, packet, "lead.create", {
    contactId: required(
      packet.state.contacts.find((x) => !x.archived),
      "active contact",
    ).id,
    listingId,
    agentId,
    source: "Referral",
    notes: "Fictional viewing test",
  });
  const lead = newRecord(packet, created, "leads");
  return {
    id: lead.id as string,
    packet: await mutate(request, created, "lead.move", {
      id: lead.id,
      version: lead.version,
      stage: "Qualified",
      reason: "",
    }),
  };
}
const slot = (leadId: string, start: Date, minutes = 30) => ({
  leadId,
  startAt: start.toISOString(),
  endAt: new Date(start.getTime() + minutes * 60000).toISOString(),
});
function available(packet: Packet): string[] {
  return packet.state.listings
    .filter((x) => x.status === "Available")
    .map((x) => x.id);
}
function agents(packet: Packet): string[] {
  return packet.state.agents.filter((x) => x.active).map((x) => x.id);
}

for (const conflict of ["agent", "property"] as const) {
  test(`concurrent viewing requests for the same ${conflict} admit one booking and preserve it on invalid reschedule`, async ({
    request,
  }) => {
    let packet = await manager(request);
    const [listing, otherListing] = available(packet);
    const [agent, otherAgent] = agents(packet);
    const first = await qualified(request, packet, listing, agent);
    const second = await qualified(
      request,
      first.packet,
      conflict === "agent" ? otherListing : listing,
      conflict === "agent" ? agent : otherAgent,
    );
    packet = second.packet;
    const start = future();
    const firstRequest = payload(
      packet,
      "appointment.schedule",
      slot(first.id, start),
    );
    const secondRequest = payload(
      packet,
      "appointment.schedule",
      slot(second.id, start),
    );
    const replies = await Promise.all([
      post(request, firstRequest),
      post(request, secondRequest),
    ]);
    expect(replies.map((x) => x.status()).sort()).toEqual([200, 409]);
    let stored = await session(request);
    const created = newRecord(packet, stored, "appointments");
    const loser = created.leadId === first.id ? second.id : first.id;
    const winnerRequest = replies[0].ok() ? firstRequest : secondRequest;
    const duplicate = await post(request, winnerRequest);
    expect(duplicate.status()).toBe(200);
    expect((await duplicate.json()).state.appointments).toEqual(
      stored.state.appointments,
    );

    const adjacent = new Date(start.getTime() + 30 * 60000);
    const withAdjacent = await mutate(
      request,
      stored,
      "appointment.schedule",
      slot(loser, adjacent),
    );
    const adjacentRecord = newRecord(stored, withAdjacent, "appointments");
    const rejected = await post(
      request,
      payload(withAdjacent, "appointment.reschedule", {
        id: adjacentRecord.id,
        version: adjacentRecord.version,
        startAt: start.toISOString(),
        endAt: adjacent.toISOString(),
      }),
    );
    expect(rejected.status()).toBe(409);
    stored = await session(request);
    expect(stored.state.appointments).toEqual(withAdjacent.state.appointments);
    expect(stored.state.history).toEqual(withAdjacent.state.history);

    stored = await mutate(request, stored, "appointment.cancel", {
      id: created.id,
      version: created.version,
    });
    expect(getRecord(stored, "appointments", created.id).status).toBe(
      "Cancelled",
    );
    stored = await mutate(request, stored, "appointment.reschedule", {
      id: adjacentRecord.id,
      version: adjacentRecord.version,
      startAt: start.toISOString(),
      endAt: adjacent.toISOString(),
    });
    expect(getRecord(stored, "appointments", adjacentRecord.id)).toMatchObject({
      status: "Scheduled",
      startAt: start.toISOString(),
      endAt: adjacent.toISOString(),
    });
    expect(getRecord(stored, "appointments", created.id).status).toBe(
      "Cancelled",
    );
  });
}

test("stage and terminal guards reject skipped steps, stale versions and unresolved follow-up work", async ({
  request,
}) => {
  let packet = await manager(request);
  const qualifiedLead = await qualified(
    request,
    packet,
    available(packet)[0],
    agents(packet)[0],
  );
  packet = qualifiedLead.packet;
  const current = getRecord(packet, "leads", qualifiedLead.id);
  for (const stage of ["Viewing", "Won"]) {
    const reject = await post(
      request,
      payload(packet, "lead.move", {
        id: current.id,
        version: current.version,
        stage,
        reason: "",
      }),
    );
    expect(reject.status()).toBe(409);
  }
  const reminderPacket = await mutate(request, packet, "reminder.create", {
    leadId: current.id,
    dueAt: future(90).toISOString(),
    reason: "Fictional next action",
  });
  const reminder = newRecord(packet, reminderPacket, "reminders");
  packet = reminderPacket;
  const loss = {
    id: current.id,
    version: getRecord(packet, "leads", current.id).version,
    stage: "Lost",
    reason: "Fictional client withdrew",
  };
  expect(
    (await post(request, payload(packet, "lead.move", loss))).status(),
  ).toBe(409);
  expect(getRecord(await session(request), "leads", current.id).stage).toBe(
    "Qualified",
  );
  packet = await mutate(request, packet, "reminder.cancel", {
    id: reminder.id,
    version: reminder.version,
  });
  packet = await mutate(request, packet, "lead.move", {
    ...loss,
    version: getRecord(packet, "leads", current.id).version,
  });
  const lost = getRecord(packet, "leads", current.id);
  expect(lost).toMatchObject({ stage: "Lost", lossReason: loss.reason });
  for (const version of [lost.version, current.version]) {
    expect(
      (
        await post(
          request,
          payload(packet, "lead.move", {
            id: lost.id,
            version,
            stage: "Qualified",
            reason: "",
          }),
        )
      ).status(),
    ).toBe(409);
  }
});

test("session projections, scoped reset and stale requests preserve every existing Labs product", async ({
  request,
  playwright,
}) => {
  let packet = await manager(request);
  const other = await playwright.request.newContext({ baseURL: origin });
  try {
    const own = await qualified(
      request,
      packet,
      available(packet)[0],
      agents(packet)[0],
    );
    packet = own.packet;
    const independent = await manager(other);
    const separate = await qualified(
      other,
      independent,
      available(independent)[0],
      agents(independent)[0],
    );
    const commonStart = future();
    expect(
      (
        await post(
          request,
          payload(
            packet,
            "appointment.schedule",
            slot(separate.id, commonStart),
          ),
        )
      ).status(),
    ).toBe(404);
    packet = await mutate(
      request,
      packet,
      "appointment.schedule",
      slot(own.id, commonStart),
    );
    separate.packet = await mutate(
      other,
      separate.packet,
      "appointment.schedule",
      slot(separate.id, commonStart),
    );
    const privateKeys = [
      "contacts",
      "agents",
      "leads",
      "appointments",
      "reminders",
      "history",
    ] as const;
    const customer = await mutate(request, packet, "role", {
      role: "customer",
    });
    expect(customer.state.listings.length).toBeGreaterThan(0);
    expect(customer.state.listings.every((x) => x.status === "Available")).toBe(
      true,
    );
    expect(customer.state.analytics ?? null).toBeNull();
    for (const key of privateKeys)
      expect(customer.state[key] ?? []).toEqual([]);
    const viewer = await mutate(request, customer, "role", { role: "viewer" });
    expect(viewer.state.analytics).toBeTruthy();
    expect(viewer.state.analytics?.agentWorkload).toEqual([]);
    for (const key of ["listings", ...privateKeys] as const)
      expect(viewer.state[key] ?? []).toEqual([]);
    expect(
      (
        await post(
          request,
          payload(viewer, "appointment.schedule", slot(own.id, future())),
        )
      ).status(),
    ).toBe(403);
    packet = await mutate(request, viewer, "role", { role: "manager" });

    const cafe = await mutate(
      request,
      await session(request, "cafe-pos"),
      "order.submit",
      { table: 1, lines: [{ itemId: "kopi-iced", qty: 1 }] },
      "cafe-pos",
    );
    let commerce = await session<{ cart: { version: number } }>(
      request,
      "commerce-studio",
    );
    commerce = await mutate(
      request,
      commerce,
      "cart.set",
      { productId: "notebook", qty: 1, version: commerce.state.cart.version },
      "commerce-studio",
    );
    const automation = await mutate(
      request,
      await session(request, "automation-hub"),
      "inquiry.submit",
      {
        businessName: "Fictional Orchid Properties",
        contactName: "Sample Hana",
        email: "hana@example.test",
        brief: "A fictional website for the demo studio.",
        budgetSen: 350000,
        timelineWeeks: 5,
      },
      "automation-hub",
    );
    const stale = payload(
      packet,
      "appointment.schedule",
      slot(own.id, future()),
    );
    const reset = await mutate(request, packet, "reset");
    expect(reset.generation).toBe(packet.generation + 1);
    expect(reset.state.leads.some((x) => x.id === own.id)).toBe(false);
    expect((await post(request, stale)).status()).toBe(409);
    expect(
      (
        await post(request, {
          ...stale,
          csrf: separate.packet.csrf,
          generation: separate.packet.generation,
        })
      ).status(),
    ).toBe(403);
    expect((await session(other)).state.leads).toEqual(
      separate.packet.state.leads,
    );
    expect((await session(other)).state.appointments).toEqual(
      separate.packet.state.appointments,
    );
    expect((await session(request, "cafe-pos")).state).toEqual(cafe.state);
    expect((await session(request, "commerce-studio")).state).toEqual(
      commerce.state,
    );
    expect((await session(request, "automation-hub")).state).toEqual(
      automation.state,
    );
  } finally {
    await other.dispose();
  }
});

test("keyboard reset confirmation keeps focus and restores the Property fixture", async ({
  page,
}) => {
  await page.goto(url);
  await role(page, "manager");
  await button(page, "Listings").click();
  await listingForm(page);
  await button(page, "Save listing").click();
  await saved(page);
  const original = await session(page.request);
  const trigger = button(page, "Reset demo");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(button(page, "Keep my data")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  expect((await session(page.request)).generation).toBe(original.generation);
  await page.keyboard.press("Enter");
  await button(page, "Confirm reset").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".labs-status")).toContainText("Workspace reset");
  await expect(trigger).toBeFocused();
  const reset = await session(page.request);
  expect(reset.generation).toBe(original.generation + 1);
  expect(reset.state.listings.some((x) => x.title === title)).toBe(false);
});

for (const width of [375, 768, 1440])
  for (const theme of ["light", "dark"]) {
    test(`Property views are accessible without page overflow at ${width}px in ${theme}`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: 950 });
      await page.addInitScript(
        (value) => localStorage.setItem("kezuvio-theme", value),
        theme,
      );
      await manager(page.request);
      await page.goto(url);
      await expect(field(page, "Demo role")).toHaveValue("manager");
      const inspect = async (name: string) => {
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          name,
        ).toBe(true);
        const { violations } = await new AxeBuilder({ page })
          .include(".labs-workspace")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(violations, name).toEqual([]);
      };
      for (const name of [
        "Overview",
        "Listings",
        "Contacts",
        "Pipeline",
        "Agents",
        "Viewings",
        "Follow-ups",
        "Activity",
      ]) {
        await button(page, name).click();
        await inspect(name);
        if (name === "Overview" || name === "Pipeline") {
          await page.screenshot({
            path: testInfo.outputPath(`${name.toLowerCase()}.png`),
            fullPage: true,
          });
        }
      }
      await role(page, "customer");
      await inspect("Customer catalogue");
      await role(page, "viewer");
      await inspect("Viewer analytics");
    });
  }
