import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";
import {
  LabsError,
  tokenHash,
  newToken,
  constantEqual,
  requestHash,
  validRole,
  validateAction,
  type ProductModule,
  type Role,
  type Action,
} from "../demo-platform/index.ts";
export { loadLocalEnvironment } from "./environment.ts";
export function createDatabase(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("Local database is not configured");
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url,
      max: 8,
      connectionTimeoutMillis: 5000,
      application_name: "kezuvio-labs",
      options: "-c timezone=UTC",
    }),
    log: [],
  });
}
type Tx = Prisma.TransactionClient;
type Session = {
  workspace_id: string;
  product: string;
  role: Role;
  customer_id: string;
  expires_at: Date;
};
type Workspace = {
  id: string;
  product: string;
  generation: number;
  expires_at: Date;
};
export type Packet = {
  workspaceId: string;
  product: string;
  generation: number;
  role: Role;
  customerId: string;
  expiresAt: string;
  csrf: string;
  state: unknown;
};
export interface DemoRepository {
  start(): Promise<{ token: string; packet: Packet }>;
  read(token: string): Promise<Packet>;
  act(token: string, input: unknown): Promise<Packet>;
}
async function context(
  tx: Tx,
  product: string,
  hash: string,
  workspace = "",
  generation = 0,
) {
  await tx.$queryRawUnsafe(
    "SELECT set_config('labs.product',$1,true),set_config('labs.token',$2,true),set_config('labs.workspace',$3,true),set_config('labs.generation',$4,true)",
    product,
    hash,
    workspace,
    String(generation),
  );
}
const csrfFor = (token: string) => tokenHash(`csrf:${token}`);
export function createRepository<S>(
  db: PrismaClient,
  module: ProductModule<S>,
): DemoRepository {
  if (!/^[a-z][a-z0-9-]{1,40}$/.test(module.id))
    throw new Error("Invalid product identifier");
  // Fixed mapping only: SQL identifiers never come from request input.
  const table =
    module.id === "cafe-pos"
      ? "cafe.documents"
      : module.id === "commerce-studio"
        ? "commerce.documents"
        : module.id === "automation-hub"
          ? "automation.documents"
          : module.id === "property-crm"
            ? "property.documents"
            : module.id === "accounting-cloud"
              ? "accounting.documents"
              : module.id === "interior-3d"
                ? "interior.documents"
                : "platform.documents";
  const options = { maxWait: 10000, timeout: 15000 };
  async function packet(
    tx: Tx,
    token: string,
    session: Session,
    workspace: Workspace,
  ): Promise<Packet> {
    const documents = await tx.$queryRawUnsafe<{ state: S }[]>(
      `SELECT state FROM ${table} WHERE workspace_id=$1::uuid AND product=$2 AND generation=$3`,
      workspace.id,
      module.id,
      workspace.generation,
    );
    if (!documents[0])
      throw new LabsError(
        409,
        "Workspace data is unavailable. Start a fresh demo.",
      );
    return {
      workspaceId: workspace.id,
      product: module.id,
      generation: workspace.generation,
      role: session.role,
      customerId: session.customer_id,
      expiresAt: workspace.expires_at.toISOString(),
      csrf: csrfFor(token),
      state: module.project(documents[0].state, {
        role: session.role,
        customerId: session.customer_id,
      }),
    };
  }
  async function sessionTransaction<T>(
    token: string,
    fn: (tx: Tx, s: Session, w: Workspace) => Promise<T>,
  ): Promise<T> {
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new LabsError(401, "Start a fresh demo workspace.");
    const hash = tokenHash(token);
    return db.$transaction(async (tx) => {
      await context(tx, module.id, hash);
      const matches = await tx.$queryRawUnsafe<Session[]>(
        "SELECT workspace_id,product,role,customer_id,expires_at FROM platform.sessions WHERE token_hash=$1 AND product=$2",
        hash,
        module.id,
      );
      if (!matches[0])
        throw new LabsError(
          401,
          "Your demo session expired. Start a fresh workspace.",
        );
      await context(tx, module.id, hash, matches[0].workspace_id);
      const rows = await tx.$queryRawUnsafe<Workspace[]>(
        "SELECT id,product,generation,expires_at FROM platform.workspaces WHERE id=$1::uuid AND product=$2 FOR UPDATE",
        matches[0].workspace_id,
        module.id,
      );
      if (!rows[0])
        throw new LabsError(
          401,
          "Your demo session expired. Start a fresh workspace.",
        );
      // Read role and expiry again after waiting for the workspace lock.
      const fresh = await tx.$queryRawUnsafe<Session[]>(
        "SELECT workspace_id,product,role,customer_id,expires_at FROM platform.sessions WHERE token_hash=$1 AND expires_at>clock_timestamp()",
        hash,
      );
      const alive = await tx.$queryRawUnsafe<{ alive: boolean }[]>(
        "SELECT expires_at>clock_timestamp() AS alive FROM platform.workspaces WHERE id=$1::uuid",
        rows[0].id,
      );
      if (!fresh[0] || !alive[0]?.alive)
        throw new LabsError(
          401,
          "Your demo session expired. Start a fresh workspace.",
        );
      await context(tx, module.id, hash, rows[0].id, rows[0].generation);
      // The quota is committed separately from failed actions so invalid attempts also consume it.
      return fn(tx, fresh[0], rows[0]);
    }, options);
  }
  async function consume(token: string) {
    await sessionTransaction(token, async (tx) => {
      const rows = await tx.$queryRawUnsafe<{ requests: number }[]>(
        `UPDATE platform.sessions SET requests=CASE WHEN window_at<clock_timestamp()-interval '1 minute' THEN 1 ELSE requests+1 END,window_at=CASE WHEN window_at<clock_timestamp()-interval '1 minute' THEN clock_timestamp() ELSE window_at END WHERE token_hash=$1 RETURNING requests`,
        tokenHash(token),
      );
      return rows[0]?.requests;
    }).then((count) => {
      if (!count || count > 120)
        throw new LabsError(429, "Too many demo requests. Wait one minute.");
    });
  }
  return {
    async start() {
      const token = newToken(),
        hash = tokenHash(token),
        id = randomUUID(),
        customer = randomUUID();
      const [{ allowed }] = await db.$queryRawUnsafe<{ allowed: boolean }[]>(
        "SELECT platform.admit_creation() AS allowed",
      );
      if (!allowed)
        throw new LabsError(
          429,
          "Too many new demo workspaces. Please wait one minute.",
        );
      const result = await db.$transaction(async (tx) => {
        await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock(946501)::text");
        await tx.$queryRawUnsafe("SELECT platform.prune_expired()");
        const counts = await tx.$queryRawUnsafe<{ count: number }[]>(
          "SELECT platform.active_workspace_count() AS count",
        );
        if (counts[0].count >= 500)
          throw new LabsError(429, "Demo capacity is full. Please try later.");
        const [{ expires }] = await tx.$queryRawUnsafe<{ expires: Date }[]>(
          "SELECT clock_timestamp()+interval '1 hour' AS expires",
        );
        await context(tx, module.id, hash, id, 1);
        await tx.$executeRawUnsafe(
          "INSERT INTO platform.workspaces(id,product,expires_at) VALUES($1::uuid,$2,$3)",
          id,
          module.id,
          expires,
        );
        await tx.$executeRawUnsafe(
          "INSERT INTO platform.sessions(token_hash,workspace_id,product,role,customer_id,expires_at) VALUES($1,$2::uuid,$3,'customer',$4::uuid,$5)",
          hash,
          id,
          module.id,
          customer,
          expires,
        );
        await tx.$executeRawUnsafe(
          `INSERT INTO ${table}(workspace_id,product,generation,state) VALUES($1::uuid,$2,1,$3::jsonb)`,
          id,
          module.id,
          JSON.stringify(module.seed()),
        );
        return packet(
          tx,
          token,
          {
            workspace_id: id,
            product: module.id,
            role: "customer",
            customer_id: customer,
            expires_at: expires,
          },
          { id, product: module.id, generation: 1, expires_at: expires },
        );
      }, options);
      return { token, packet: result };
    },
    async read(token) {
      await consume(token);
      return sessionTransaction(token, (tx, s, w) => packet(tx, token, s, w));
    },
    async act(token, input) {
      await consume(token);
      const action = validateAction(input);
      if (!constantEqual(action.csrf, csrfFor(token)))
        throw new LabsError(403, "Invalid session token. Refresh the demo.");
      return sessionTransaction(token, async (tx, s, w) => {
        if (action.generation !== w.generation)
          throw new LabsError(
            409,
            "Workspace was reset. Refresh before continuing.",
          );
        const hash = requestHash(action);
        const seen = await tx.$queryRawUnsafe<{ input_hash: string }[]>(
          "SELECT input_hash FROM platform.requests WHERE workspace_id=$1::uuid AND product=$2 AND generation=$3 AND request_id=$4::uuid",
          w.id,
          module.id,
          w.generation,
          action.requestId,
        );
        if (seen[0]) {
          if (seen[0].input_hash !== hash)
            throw new LabsError(
              409,
              "Request identifier was already used for a different action.",
            );
          // Never replay an old privileged payload or role mutation; return current authorized projection.
          return packet(tx, token, s, w);
        }
        if (action.type === "reset") {
          if (Object.keys(action.args).length)
            throw new LabsError(400, "Reset takes no arguments.");
          if (w.generation >= 100)
            throw new LabsError(
              429,
              "Reset limit reached. Start a fresh workspace.",
            );
          // Remove only this fictional workspace generation; transaction rollback preserves it if seed fails.
          await tx.$executeRawUnsafe(
            `DELETE FROM ${table} WHERE workspace_id=$1::uuid AND product=$2 AND generation=$3`,
            w.id,
            module.id,
            w.generation,
          );
          for (const name of ["requests", "audit"])
            await tx.$executeRawUnsafe(
              `DELETE FROM platform.${name} WHERE workspace_id=$1::uuid AND product=$2 AND generation=$3`,
              w.id,
              module.id,
              w.generation,
            );
          w.generation++;
          await tx.$executeRawUnsafe(
            "UPDATE platform.workspaces SET generation=$2 WHERE id=$1::uuid",
            w.id,
            w.generation,
          );
          await context(tx, module.id, tokenHash(token), w.id, w.generation);
          await tx.$executeRawUnsafe(
            `INSERT INTO ${table}(workspace_id,product,generation,state) VALUES($1::uuid,$2,$3,$4::jsonb)`,
            w.id,
            module.id,
            w.generation,
            JSON.stringify(module.seed()),
          );
        } else {
          const count = await tx.$queryRawUnsafe<{ count: bigint }[]>(
            "SELECT count(*) FROM platform.requests WHERE workspace_id=$1::uuid",
            w.id,
          );
          if (Number(count[0].count) >= 500)
            throw new LabsError(
              429,
              "Sample action limit reached. Reset this product.",
            );
          if (action.type === "role") {
            if (
              Object.keys(action.args).length !== 1 ||
              !validRole(action.args.role)
            )
              throw new LabsError(400, "Choose a valid simulated role.");
            s.role = action.args.role;
            await tx.$executeRawUnsafe(
              "UPDATE platform.sessions SET role=$2 WHERE token_hash=$1",
              tokenHash(token),
              s.role,
            );
          } else {
            const documents = await tx.$queryRawUnsafe<{ state: S }[]>(
              `SELECT state FROM ${table} WHERE workspace_id=$1::uuid AND product=$2 AND generation=$3`,
              w.id,
              module.id,
              w.generation,
            );
            const next = module.reduce(documents[0].state, action, {
              role: s.role,
              customerId: s.customer_id,
            });
            if (Buffer.byteLength(JSON.stringify(next)) > 256000)
              throw new LabsError(
                429,
                "Demo data limit reached. Reset this product.",
              );
            await tx.$executeRawUnsafe(
              `UPDATE ${table} SET state=$4::jsonb WHERE workspace_id=$1::uuid AND product=$2 AND generation=$3`,
              w.id,
              module.id,
              w.generation,
              JSON.stringify(next),
            );
          }
        }
        await tx.$executeRawUnsafe(
          "INSERT INTO platform.requests(workspace_id,product,generation,request_id,input_hash) VALUES($1::uuid,$2,$3,$4::uuid,$5)",
          w.id,
          module.id,
          w.generation,
          action.requestId,
          hash,
        );
        await tx.$executeRawUnsafe(
          "INSERT INTO platform.audit(workspace_id,product,generation,action,role) VALUES($1::uuid,$2,$3,$4,$5)",
          w.id,
          module.id,
          w.generation,
          action.type,
          s.role,
        );
        return packet(tx, token, s, w);
      });
    },
  };
}
