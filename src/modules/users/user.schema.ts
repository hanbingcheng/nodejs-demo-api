import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "メールアドレスは必須です")
  .max(255, "メールアドレスは255文字以内で入力してください")
  .email("メールアドレスの形式が不正です");

const nameSchema = z
  .string()
  .trim()
  .min(1, "名前は必須です")
  .max(100, "名前は100文字以内で入力してください");

const roleSchema = z.enum(["USER", "ADMIN"], {
  message: "ロールは USER または ADMIN を指定してください",
});

const baseUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  role: roleSchema,
});

export const createUserSchema = baseUserSchema.extend({
  role: roleSchema.default("USER"),
});

export const updateUserSchema = baseUserSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "更新する項目を1つ以上指定してください",
  });

export const listUsersQuerySchema = z.object({
  page: z.coerce
    .number({ message: "page は数値で指定してください" })
    .int("page は整数で指定してください")
    .min(1, "page は1以上で指定してください")
    .default(1),
  limit: z.coerce
    .number({ message: "limit は数値で指定してください" })
    .int("limit は整数で指定してください")
    .min(1, "limit は1以上で指定してください")
    .max(100, "limit は100以下で指定してください")
    .default(20),
  q: z
    .string()
    .trim()
    .max(100, "検索キーワードは100文字以内で入力してください")
    .optional(),
});

export const userIdParamSchema = z.object({
  id: z.uuid("ユーザーIDの形式が不正です"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;

