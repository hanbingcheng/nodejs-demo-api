import { prisma } from "../../src/lib/prisma.js";

/** 各テストの前に呼び、前のテストが残したデータを消す */
export async function resetDb() {
  await prisma.user.deleteMany();
}
