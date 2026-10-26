import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

describe("POST /api/users", () => {
  it("不正な email は 400 を返す（DB へは到達しない）", async () => {
    const res = await request(createApp())
      .post("/api/users")
      .send({ email: "not-an-email", name: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.fieldErrors.email).toBeDefined();
  });

  it("未知のパスは 404 を返す", async () => {
    const res = await request(createApp()).get("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
