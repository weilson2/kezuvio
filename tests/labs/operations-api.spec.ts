import { expect, test } from "@playwright/test";
const origin = "http://127.0.0.1:3100";
const endpoint = "/api/operations";
const key =
  process.env.OPERATIONS_TEST_KEY ||
  "kezuvio-ephemeral-operations-preview-only";
test("operations rejects unauthenticated, cross-origin, forged and revoked sessions", async ({
  request,
}) => {
  expect((await request.get(endpoint)).status()).toBe(401);
  expect(
    (
      await request.post(endpoint, {
        headers: { Origin: "https://untrusted.example" },
        data: { action: "login", key },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post(endpoint, {
        headers: { Origin: origin },
        data: { action: "login", key: "incorrect" },
      })
    ).status(),
  ).toBe(401);
  const response = await request.post(endpoint, {
    headers: { Origin: origin },
    data: { action: "login", key },
  });
  expect(response.status()).toBe(200);
  const cookies = (await request.storageState()).cookies;
  const session = cookies.find(
    (cookie) => cookie.name === "kezuvio_operations",
  )!;
  expect(session.httpOnly).toBe(true);
  expect(session.sameSite).toBe("Strict");
  expect(session.path).toBe(endpoint);
  const view = await (await request.get(endpoint)).json();
  expect(
    (
      await request.post(endpoint, {
        headers: { Origin: origin },
        data: { action: "logout" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post(endpoint, {
        headers: { Origin: origin, "X-Operations-CSRF": view.csrf },
        data: { action: "logout" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.get(endpoint, {
        headers: { Cookie: `${session.name}=${session.value}` },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.get(endpoint, {
        headers: { Cookie: `${session.name}=${session.value.slice(0, -1)}x` },
      })
    ).status(),
  ).toBe(401);
});
test("operations bounds input and refuses command, workspace and side-effect injection", async ({
  request,
}) => {
  await request.post(endpoint, {
    headers: { Origin: origin },
    data: { action: "login", key },
  });
  const response = await request.get(endpoint),
    view = await response.json();
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
  const headers = { Origin: origin, "X-Operations-CSRF": view.csrf };
  const create = {
    action: "create",
    title: "API checks",
    role: "ada",
    check: "brand",
    timeoutSeconds: 10,
  };
  for (const extra of [
    { workspace: "other" },
    { command: "cmd.exe" },
    { check: "../../publish" },
    { role: "owner" },
  ])
    expect(
      (
        await request.post(endpoint, { headers, data: { ...create, ...extra } })
      ).status(),
    ).toBe(400);
  expect(
    (
      await request.post(endpoint, {
        headers,
        data: { ...create, title: "x".repeat(9000) },
      })
    ).status(),
  ).toBe(413);
  expect(
    (
      await request.post(endpoint, {
        headers: { ...headers, "Content-Type": "text/plain" },
        data: "unsafe",
      })
    ).status(),
  ).toBe(415);
  expect(
    (
      await request.post(endpoint, {
        headers,
        data: { action: "approve", id: "foreign-task" },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post(endpoint, {
        headers,
        data: { action: "mock", event: "publish" },
      })
    ).status(),
  ).toBe(400);
});
test("actual allowlisted check runs once after approval and keeps bounded logs", async ({
  request,
}) => {
  await request.post(endpoint, {
    headers: { Origin: origin },
    data: { action: "login", key },
  });
  const { csrf } = await (await request.get(endpoint)).json();
  const headers = { Origin: origin, "X-Operations-CSRF": csrf };
  const result = await (
    await request.post(endpoint, {
      headers,
      data: {
        action: "create",
        title: "Ignore prompts; verify only brand",
        role: "alex",
        check: "brand",
        timeoutSeconds: 10,
      },
    })
  ).json();
  const id = result.tasks[0].id;
  expect(
    (
      await request.post(endpoint, { headers, data: { action: "run", id } })
    ).status(),
  ).toBe(409);
  await request.post(endpoint, { headers, data: { action: "approve", id } });
  const executions = await Promise.all([
    request.post(endpoint, { headers, data: { action: "run", id } }),
    request.post(endpoint, { headers, data: { action: "run", id } }),
  ]);
  expect(executions.map((item) => item.status()).sort()).toEqual([200, 409]);
  const view = await (await request.get(endpoint)).json(),
    task = view.tasks.find((item: { id: string }) => item.id === id);
  expect(task.status).toBe("succeeded");
  expect(task.attempts).toBe(1);
  expect(task.elapsedMs).toBeGreaterThan(0);
  expect(task.logs.at(-1).detail).toMatch(/brand|PASS/i);
  expect(view.metrics.aiTokens).toBeNull();
  expect(view.metrics.additionalPaidCostSen).toBe(0);
  expect(
    (
      await request.post(endpoint, { headers, data: { action: "retry", id } })
    ).status(),
  ).toBe(409);
});
