"use client";
import { useState } from "react";
import { Button } from "@kezuvio/ui";
import {
  bookingDates,
  bookingTimes,
  bookingServices,
  money,
} from "@/lib/demo/engine";
import { Empty, Select, Stats, type DemoProps } from "./shared";
export function BookingDemo({ state, act, busy }: DemoProps) {
  const [service, setService] = useState("consultation"),
    [date, setDate] = useState(bookingDates[0]),
    [time, setTime] = useState("09:00"),
    [customer, setCustomer] = useState("Sample Customer B"),
    [editing, setEditing] = useState(""),
    [tab, setTab] = useState("customer"),
    [notification, setNotification] = useState("");
  const chosen = bookingServices.find((s) => s.id === service)!;
  const unavailable = (slot: string) =>
    state.bookings.some(
      (b) =>
        b.id !== editing &&
        b.service === service &&
        b.date === date &&
        b.time === slot &&
        b.status === "Confirmed",
    );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = await act(
      editing ? "booking.reschedule" : "booking.create",
      { id: editing, service, date, time, customer },
      editing
        ? "Booking rescheduled. No notification was sent."
        : "Booking confirmed. No notification was sent.",
    );
    if (next) {
      setNotification(
        `${editing ? "Rescheduled" : "Confirmed"}: ${chosen.name}, ${date} at ${time}. Sample customer only. No email or SMS was sent.`,
      );
      setEditing("");
    }
  }
  return (
    <>
      <div className="demo-tablist" role="group" aria-label="Booking views">
        <Button
          variant={tab === "customer" ? "primary" : "secondary"}
          onClick={() => setTab("customer")}
        >
          Book a session
        </Button>
        <Button
          variant={tab === "admin" ? "primary" : "secondary"}
          onClick={() => setTab("admin")}
        >
          Appointment overview
        </Button>
      </div>
      <Stats
        items={[
          {
            label: "Confirmed bookings",
            value: state.bookings.filter((b) => b.status === "Confirmed")
              .length,
          },
          {
            label: "Cancelled",
            value: state.bookings.filter((b) => b.status === "Cancelled")
              .length,
          },
          {
            label: "Schedule",
            value: "2–6 Nov 2026",
            detail: "Fixed fictional demo week",
          },
        ]}
      />
      {tab === "customer" && (
        <div className="booking-layout">
          <form className="demo-panel booking-form" onSubmit={submit}>
            <div>
              <span className="eyebrow">A little space for your next step</span>
              <h2>
                {editing
                  ? "Reschedule your session"
                  : "Find a time that works."}
              </h2>
              <p>
                Every booking uses a fictional customer and a sample schedule.
              </p>
            </div>
            <Select
              id="booking-service"
              label="Service"
              value={service}
              onChange={setService}
            >
              {bookingServices.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name} · {money(s.price)}
                </option>
              ))}
            </Select>
            <Select
              id="booking-date"
              label="Date (fictional demo week)"
              value={date}
              onChange={setDate}
            >
              {bookingDates.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
            <fieldset className="slot-fieldset">
              <legend>Available time · {chosen.duration}</legend>
              <div className="time-slots">
                {bookingTimes.map((t) => (
                  <label
                    key={t}
                    className={unavailable(t) ? "unavailable" : ""}
                  >
                    <input
                      type="radio"
                      name="booking-time"
                      value={t}
                      checked={time === t}
                      onChange={() => setTime(t)}
                      disabled={unavailable(t)}
                      required
                    />
                    <span>
                      {t}
                      {unavailable(t) ? " · Reserved" : ""}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Select
              id="booking-customer"
              label="Fictional customer"
              value={customer}
              onChange={setCustomer}
            >
              {[
                "Sample Customer A",
                "Sample Customer B",
                "Sample Customer C",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <Button type="submit" disabled={busy || unavailable(time)}>
              {editing ? "Save rescheduled booking" : "Confirm sample booking"}
            </Button>
            {editing && (
              <Button variant="secondary" onClick={() => setEditing("")}>
                Cancel reschedule
              </Button>
            )}
          </form>
          <aside className="demo-panel booking-summary">
            <div className="booking-artwork" aria-hidden="true">
              <span>ruang.</span>
              <strong>
                Make
                <br />
                room.
              </strong>
              <div />
            </div>
            <h3>{chosen.name}</h3>
            <p>
              {chosen.duration} · {money(chosen.price)} · No charge
            </p>
            <p className="notice">
              Reservations for the same service and time are checked on the
              server. Different visitors have separate fictional schedules.
            </p>
          </aside>
        </div>
      )}
      {notification && (
        <div className="notice" role="status">
          <strong>Simulated notification preview</strong>
          <p>{notification}</p>
        </div>
      )}
      <section className="demo-panel">
        <div className="panel-heading">
          <h2>
            {tab === "admin" ? "Appointment overview" : "Your sample bookings"}
          </h2>
          <span className="badge">{state.bookings.length} records</span>
        </div>
        {state.bookings.length ? (
          <div className="record-list">
            {state.bookings.map((b) => (
              <article key={b.id}>
                <div>
                  <strong>
                    {bookingServices.find((s) => s.id === b.service)?.name}
                  </strong>
                  <p>
                    {b.date} · {b.time} · {b.customer}
                  </p>
                  <small>{b.id}</small>
                </div>
                <span className="status-tag">{b.status}</span>
                <div className="button-row">
                  <Button
                    variant="secondary"
                    disabled={busy || b.status === "Cancelled"}
                    onClick={() => {
                      setEditing(b.id);
                      setService(b.service);
                      setDate(b.date);
                      setTime(b.time);
                      setCustomer(b.customer);
                      setTab("customer");
                      setNotification("");
                    }}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy || b.status === "Cancelled"}
                    onClick={async () => {
                      const next = await act(
                        "booking.cancel",
                        { id: b.id },
                        "Booking cancelled. The time slot is available again.",
                      );
                      if (next) {
                        setNotification(
                          `Cancelled ${b.id}. No email or SMS was sent.`,
                        );
                        if (editing === b.id) setEditing("");
                      }
                    }}
                  >
                    Cancel booking
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty>No bookings in this workspace.</Empty>
        )}
      </section>
    </>
  );
}
