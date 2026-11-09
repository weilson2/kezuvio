import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "packages/database/prisma/schema.prisma",
  migrations: { path: "packages/database/prisma/migrations" },
  datasource: {
    url:
      process.env.MIGRATION_DATABASE_URL ||
      "postgresql://unused:unused@127.0.0.1:55432/unused",
  },
});
