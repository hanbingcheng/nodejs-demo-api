import { existsSync } from "node:fs";
import { config } from "dotenv";
import { afterAll, beforeAll } from "vitest";

// 1. .env.test があれば読み込む（CI では環境変数を直接使う）
if (existsSync(".env.test")) {
  config({ path: ".env.test", override: true, quiet: true });
}

// 2. 開発用 DB を消さないための安全装置
const databaseUrl = process.env.DATABASE_URL ?? "";
if (!databaseUrl.includes("demo_test")) {
  throw new Error(
    `テスト用 DB (demo_test) を指していません: ${databaseUrl}\n` +
      ".env.test の DATABASE_URL を確認してください。",
  );
}

// 3. テスト全体の最初に接続し、最後に切断する
beforeAll(async () => {
  const { prisma } = await import("../src/lib/prisma.js");
  await prisma.$connect();
});

afterAll(async () => {
  const { prisma } = await import("../src/lib/prisma.js");
  await prisma.$disconnect();
});
