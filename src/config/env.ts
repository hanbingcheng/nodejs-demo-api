import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL は必須です"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "環境変数の設定に誤りがあります:\n" + z.prettifyError(result.error),
  );
  process.exit(1);
}

export const env = result.data;
