import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: tursoUrl
    ? {
        adapter: () => new PrismaLibSql({ url: tursoUrl, authToken: tursoToken }),
      }
    : {
        url: process.env["DATABASE_URL"],
      },
});
