import { expect, test } from "@playwright/test";
test("local operations rate-limits repeated failed keys before another login", async ({
  request,
}) => {
  const headers = { Origin: "http://127.0.0.1:3100" };
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await request.post("/api/operations", {
      headers,
      data: { action: "login", key: "wrong-rate-limit-fixture" },
    });
    expect([401, 429]).toContain(response.status());
  }
  const blocked = await request.post("/api/operations", {
    headers,
    data: {
      action: "login",
      key:
        process.env.OPERATIONS_TEST_KEY ||
        "kezuvio-ephemeral-operations-preview-only",
    },
  });
  expect(blocked.status()).toBe(429);
  expect((await request.get("/api/operations")).status()).toBe(401);
});
