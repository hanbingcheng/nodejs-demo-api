import { prisma } from "../src/lib/prisma.js";

const users = [
  { email: "taro@example.com", name: "山田 太郎", role: "USER" },
  { email: "hanako@example.com", name: "山田 花子", role: "USER" },
  { email: "admin@example.com", name: "管理者", role: "ADMIN" },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: user,
    });
  }
  console.log(`Seeded ${users.length} users`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
