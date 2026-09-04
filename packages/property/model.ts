export const stages = [
  "New",
  "Qualified",
  "Viewing",
  "Offer",
  "Won",
  "Lost",
] as const;
export type Stage = (typeof stages)[number];
export const listingTypes = [
  "Condo",
  "Terrace",
  "Apartment",
  "Semi-detached",
] as const;
export type ListingType = (typeof listingTypes)[number];

export const nextStage: Partial<Record<Stage, Stage>> = {
  New: "Qualified",
  Qualified: "Viewing",
  Viewing: "Offer",
  Offer: "Won",
};

export const limits = {
  listings: 50,
  contacts: 50,
  agents: 3,
  leads: 100,
  appointments: 100,
  reminders: 100,
  history: 150,
  priceSen: 10_000_000_000,
} as const;

export type Versioned = { id: string; version: number };
export type Listing = Versioned & {
  title: string;
  area: string;
  type: ListingType;
  priceSen: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqft: number;
  description: string;
  status: "Available" | "Unavailable" | "Archived";
};
export type Contact = Versioned & {
  name: string;
  email: string;
  notes: string;
  archived: boolean;
};
export type Agent = Versioned & { name: string; active: boolean };
export type Lead = Versioned & {
  contactId: string;
  listingId: string | null;
  agentId: string | null;
  source: string;
  notes: string;
  stage: Stage;
  lossReason: string | null;
  closedAt: string | null;
  archived: boolean;
};
export type Appointment = Versioned & {
  leadId: string;
  listingId: string;
  agentId: string;
  startAt: string;
  endAt: string;
  status: "Scheduled" | "Completed" | "Cancelled";
};
export type Reminder = Versioned & {
  leadId: string;
  dueAt: string;
  reason: string;
  status: "Pending" | "Completed" | "Cancelled";
};
export type HistoryEvent = {
  id: string;
  at: string;
  event: string;
  subjectId: string;
  detail: string;
};
export type PropertyState = {
  listings: Listing[];
  contacts: Contact[];
  agents: Agent[];
  leads: Lead[];
  appointments: Appointment[];
  reminders: Reminder[];
  history: HistoryEvent[];
};
export type PropertyAnalytics = {
  stages: Record<Stage, number>;
  openLeads: number;
  won: number;
  lost: number;
  conversionTenths: number | null;
  askingValueSen: number;
  upcomingViewings: number;
  overdueReminders: number;
  agentWorkload: {
    agentId: string;
    name: string;
    openLeads: number;
    upcomingViewings: number;
  }[];
  unassignedLeads: number;
};
export type PropertyView = Omit<PropertyState, "reminders"> & {
  reminders: (Reminder & {
    timing: "Upcoming" | "Overdue" | "Completed" | "Cancelled";
  })[];
  analytics: PropertyAnalytics | null;
  asOf: string;
};
