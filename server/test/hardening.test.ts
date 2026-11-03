// Unit-level checks that do not need the DB/app: validate helpers, env parse,
// authenticate without JWT_SECRET, userRateLimit key. No helpers.js import.
import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import type { AddressInfo } from "node:net";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { validate, validatedBody, validatedQuery } from "../src/middlewares/validate.js";
import { parseBoundedIntEnv, userRateLimit } from "../src/middlewares/userRateLimit.js";
import { authenticate } from "../src/middlewares/auth.js";
import { errorHandler } from "../src/middlewares/errorHandler.js";

async function withApp(
  build: (app: express.Express) => void,
  run: (base: string) => Promise<void>
): Promise<void> {
  const app = express();
  app.use(express.json());
  build(app);
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const origErr = console.error;
  console.error = () => {};
  try {
    await run(base);
  } finally {
    console.error = origErr;
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}

test("validated helpers: parse runs once, route without validate -> 500", async () => {
  let transformCalls = 0;
  const body = z.object({ n: z.string().transform((s) => (transformCalls++, s.trim())) });
  const query = z.object({ q: z.string().default("x") });
  await withApp(
    (app) => {
      app.post("/ok", validate({ body, query }), (req, res) => {
        res.json({ b: validatedBody(req, body), q: validatedQuery(res, query) });
      });
      app.post("/nov", (req, res) => {
        res.json(validatedBody(req, body));
      });
      app.post("/noq", validate({ body }), (_req, res) => {
        res.json(validatedQuery(res, query));
      });
    },
    async (base) => {
      const post = (path: string) =>
        fetch(base + path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ n: "  a " }),
        });
      const ok = await post("/ok");
      assert.equal(ok.status, 200);
      assert.deepEqual(await ok.json(), { b: { n: "a" }, q: { q: "x" } });
      assert.equal(transformCalls, 1);
      for (const path of ["/nov", "/noq"]) {
        const r = await post(path);
        assert.equal(r.status, 500, path);
        assert.deepEqual(await r.json(), { error: "Internal server error" });
      }
    }
  );
});

test("validated helpers: divergent schema -> 500; two validate() merge keys", async () => {
  const body = z.object({ n: z.string() });
  const other = z.object({ n: z.string() }); // structurally equal, different instance
  const query = z.object({ q: z.string().default("x") });
  await withApp(
    (app) => {
      app.post("/div", validate({ body }), (req, res) => {
        res.json(validatedBody(req, other));
      });
      app.post("/merge", validate({ body }), validate({ query }), (req, res) => {
        res.json({ b: validatedBody(req, body), q: validatedQuery(res, query) });
      });
    },
    async (base) => {
      const post = (path: string) =>
        fetch(base + path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ n: "a" }),
        });
      const d = await post("/div");
      assert.equal(d.status, 500);
      assert.deepEqual(await d.json(), { error: "Internal server error" });
      const m = await post("/merge");
      assert.equal(m.status, 200);
      assert.deepEqual(await m.json(), { b: { n: "a" }, q: { q: "x" } });
    }
  );
});

test("parseBoundedIntEnv: invalid values fall back to default with one warn", () => {
  const warns: string[] = [];
  const orig = console.warn;
  console.warn = (m: string) => void warns.push(m);
  try {
    assert.equal(parseBoundedIntEnv("X", undefined, 300, 100_000), 300);
    assert.equal(parseBoundedIntEnv("X", "", 300, 100_000), 300);
    assert.equal(warns.length, 0);
    assert.equal(parseBoundedIntEnv("X", "42", 300, 100_000), 42);
    assert.equal(parseBoundedIntEnv("X", "100000", 300, 100_000), 100_000);
    const bad = [
      "abc", "12abc", "1.5", "0", "-3", "100001", "1e3x", " ", "9007199254740993", "Infinity",
      "0x10", "1e3", "+5", " 42 ", "42\n",
    ];
    for (const v of bad) assert.equal(parseBoundedIntEnv("X", v, 300, 100_000), 300, v);
    assert.equal(warns.length, bad.length);
    assert.match(warns[0], /using default 300/);
    assert.match(warns[0], /Invalid X /);
    assert.ok(warns.every((w) => !w.includes("abc") && !w.includes("0x10")), "raw value leaked");
    assert.equal(parseBoundedIntEnv("W", "86400001", 60_000, 86_400_000), 60_000);
  } finally {
    console.warn = orig;
  }
});

test("authenticate: missing JWT_SECRET -> 500 generic; bad token -> 401", async () => {
  const saved = process.env.JWT_SECRET;
  try {
    await withApp(
      (app) => app.get("/p", authenticate, (_req, res) => void res.json({ ok: true })),
      async (base) => {
        const token = jwt.sign({ userId: "u1" }, "s".repeat(40), { algorithm: "HS256" });
        const headers = { authorization: `Bearer ${token}` };

        delete process.env.JWT_SECRET;
        const r500 = await fetch(base + "/p", { headers });
        assert.equal(r500.status, 500);
        assert.deepEqual(await r500.json(), { error: "Internal server error" });

        process.env.JWT_SECRET = "s".repeat(40);
        assert.equal((await fetch(base + "/p", { headers })).status, 200);
        const bad = await fetch(base + "/p", { headers: { authorization: "Bearer junk" } });
        assert.equal(bad.status, 401);
        assert.deepEqual(await bad.json(), { error: "Invalid or expired token" });
      }
    );
  } finally {
    if (saved === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = saved;
  }
});

test("userRateLimit without authenticate -> 500, no shared bucket", async () => {
  await withApp(
    (app) => app.get("/u", userRateLimit, (_req, res) => void res.json({ ok: true })),
    async (base) => {
      const r = await fetch(base + "/u");
      assert.equal(r.status, 500);
      assert.deepEqual(await r.json(), { error: "Internal server error" });
    }
  );
});

test("errorHandler: exposed 4xx statuses get coherent fixed messages", async () => {
  const expected: Record<number, string> = {
    401: "Unauthorized", 403: "Forbidden", 404: "Not found",
    413: "Payload too large", 415: "Unsupported media type",
    429: "Too many requests", 418: "Bad request",
  };
  await withApp(
    (app) =>
      app.get("/e/:s", (req: Request, _res: Response, next: NextFunction) =>
        next(Object.assign(new Error("secret detail"), { expose: true, status: Number(req.params.s) }))
      ),
    async (base) => {
      for (const [s, msg] of Object.entries(expected)) {
        const r = await fetch(`${base}/e/${s}`);
        assert.equal(r.status, Number(s));
        assert.deepEqual(await r.json(), { error: msg });
      }
    }
  );
});
