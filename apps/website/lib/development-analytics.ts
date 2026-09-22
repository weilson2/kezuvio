export const developmentEventNames = [
  "demo_visit",
  "try_demo_click",
  "pricing_view",
  "whatsapp_click",
  "contact_submission",
  "quotation_inquiry",
] as const;
export type DevelopmentEventName = (typeof developmentEventNames)[number];
export type DevelopmentEvent = {
  name: DevelopmentEventName;
  path: string;
  at: string;
};
export const developmentAnalyticsKey = "kezuvio-development-events-v1";
export const developmentAnalyticsLimit = 200;
const demos = [
  "cafe-pos",
  "commerce-studio",
  "automation-hub",
  "property-crm",
  "accounting-cloud",
  "interior-3d",
  "business-website",
  "e-commerce",
  "pos",
  "booking",
  "sme-management",
];
const paths = new Set([
  "/",
  "/about",
  "/services",
  "/portfolio",
  "/pricing",
  "/faq",
  "/contact",
  "/request-quotation",
  "/inquiry-workflow",
  "/demo",
  ...demos.map((slug) => "/demo/" + slug),
  ...[
    "web-development",
    "custom-software",
    "pos-systems",
    "ai-automation",
    "qr-ordering",
    "mobile-apps",
    "saas",
  ].map((slug) => "/services/" + slug),
]);
export function isDevelopmentHost(hostname: string) {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
}
export function createDevelopmentEvent(
  name: unknown,
  href: unknown,
  now = Date.now(),
): DevelopmentEvent | null {
  if (
    typeof name !== "string" ||
    !developmentEventNames.includes(name as DevelopmentEventName) ||
    typeof href !== "string" ||
    !Number.isFinite(now)
  )
    return null;
  try {
    const url = new URL(href, "http://localhost");
    if (!isDevelopmentHost(url.hostname) || !paths.has(url.pathname))
      return null;
    return {
      name: name as DevelopmentEventName,
      path: url.pathname,
      at: new Date(now).toISOString(),
    };
  } catch {
    return null;
  }
}
function validated(value: unknown): DevelopmentEvent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (
    Object.keys(item).sort().join(",") !== "at,name,path" ||
    typeof item.at !== "string"
  )
    return null;
  return createDevelopmentEvent(item.name, item.path, Date.parse(item.at));
}
export function readDevelopmentEvents(
  storage: Pick<Storage, "getItem">,
): DevelopmentEvent[] {
  try {
    const raw = storage.getItem(developmentAnalyticsKey);
    if (!raw || raw.length > 100000) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .flatMap((item) => {
            const safe = validated(item);
            return safe ? [safe] : [];
          })
          .slice(-developmentAnalyticsLimit)
      : [];
  } catch {
    return [];
  }
}
export function recordDevelopmentEvent(
  storage: Pick<Storage, "getItem" | "setItem">,
  hostname: string,
  name: unknown,
  href: unknown,
  now = Date.now(),
): DevelopmentEvent[] {
  if (!isDevelopmentHost(hostname)) return [];
  const event = createDevelopmentEvent(name, href, now);
  if (!event) return [];
  try {
    const events = [...readDevelopmentEvents(storage), event].slice(
      -developmentAnalyticsLimit,
    );
    storage.setItem(developmentAnalyticsKey, JSON.stringify(events));
    return events;
  } catch {
    return [];
  }
}
