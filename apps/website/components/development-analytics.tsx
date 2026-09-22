"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  isDevelopmentHost,
  recordDevelopmentEvent,
  type DevelopmentEventName,
} from "@/lib/development-analytics";
/** Local diagnostic events only. No provider, cookies, form values or network delivery. */
export function DevelopmentAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (!isDevelopmentHost(location.hostname)) return;
    const record = (name: DevelopmentEventName, path = pathname) => {
      try {
        recordDevelopmentEvent(localStorage, location.hostname, name, path);
      } catch {}
    };
    if (pathname === "/pricing") record("pricing_view");
    if (pathname.startsWith("/demo/")) record("demo_visit");
    const click = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      try {
        const url = new URL(link.href);
        if (url.hostname === "wa.me") record("whatsapp_click");
        else if (
          url.origin === location.origin &&
          url.pathname.startsWith("/demo/")
        )
          record("try_demo_click", url.pathname);
      } catch {}
    };
    const prepared = () => {
      record("contact_submission");
      if (pathname === "/request-quotation") record("quotation_inquiry");
    };
    const quotation = () => record("quotation_inquiry");
    document.addEventListener("click", click, true);
    window.addEventListener("kezuvio:contact-prepared", prepared);
    window.addEventListener("kezuvio:quotation-inquiry", quotation);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("kezuvio:contact-prepared", prepared);
      window.removeEventListener("kezuvio:quotation-inquiry", quotation);
    };
  }, [pathname]);
  return null;
}
