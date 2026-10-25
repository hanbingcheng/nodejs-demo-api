import type { ErrorRequestHandler } from "express";
import { ZodError, z } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

type PrismaLikeError = { code: string; meta?: unknown };

function isPrismaKnownError(err: unknown): err is PrismaLikeError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string" &&
    /^P\d{4}$/.test((err as { code: string }).code)
  );
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が不正です",
        details: z.flattenError(err),
      },
    });
    return;
  }

  // Prisma の既知エラーを HTTP ステータスへ変換
  if (isPrismaKnownError(err)) {
    const map: Record<
      string,
      { status: number; code: string; message: string }
    > = {
      P2002: {
        status: 409,
        code: "DUPLICATE_ENTRY",
        message: "すでに登録されている値です",
      },
      P2025: {
        status: 404,
        code: "NOT_FOUND",
        message: "対象のデータが見つかりません",
      },
    };
    const mapped = map[err.code];
    if (mapped) {
      res.status(mapped.status).json({
        error: {
          code: mapped.code,
          message: mapped.message,
          details: err.meta,
        },
      });
      return;
    }
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "サーバー内部でエラーが発生しました"
          : err instanceof Error
            ? err.message
            : "unknown error",
    },
  });
};
