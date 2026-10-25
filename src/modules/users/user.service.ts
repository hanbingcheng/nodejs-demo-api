import { prisma } from "../../lib/prisma.js";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from "./user.schema.js";

export const userService = {
  async list({ page, limit, q }: ListUsersQuery) {
    const where = q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, items] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(input: CreateUserInput) {
    return prisma.user.create({ data: input });
  },

  async update(id: string, input: UpdateUserInput) {
    const exists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) return null;

    return prisma.user.update({ where: { id }, data: input });
  },

  async remove(id: string) {
    const exists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) return false;

    await prisma.user.delete({ where: { id } });
    return true;
  },
};
