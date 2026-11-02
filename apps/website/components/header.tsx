"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo, Icon } from "@kezuvio/ui";
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = (() => {
      try {
        return localStorage.getItem("kezuvio-theme");
      } catch {
        return null;
      }
    })();
    const value = saved
      ? saved === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(value);
    document.documentElement.dataset.theme = value ? "dark" : "light";
  }, []);
  function toggle() {
    const value = !dark;
    setDark(value);
    document.documentElement.dataset.theme = value ? "dark" : "light";
    try {
      localStorage.setItem("kezuvio-theme", value ? "dark" : "light");
    } catch {}
  }
  return (
    <button
      className="icon-button"
      onClick={toggle}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
    >
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}
export function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" aria-label="Kezuvio Labs home">
          <BrandLogo />
        </Link>
        <nav
          className={`main-nav ${open ? "is-open" : ""}`}
          aria-label="Main navigation"
          id="main-navigation"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              menuButton.current?.focus();
            }
          }}
        >
          {[
            ["/services", "Services"],
            ["/portfolio", "Concepts"],
            ["/about", "About"],
            ["/demo", "Demos"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              {label}
              {href === "/demo" && <span className="nav-dot" />}
            </Link>
          ))}
          <Link href="/contact" className="button small mobile-contact">
            Let’s talk <Icon name="arrow" />
          </Link>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <Link href="/contact" className="button small desktop-contact">
            Let’s talk <Icon name="arrow" />
          </Link>
          <button
            ref={menuButton}
            className="icon-button menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}
