import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { z } from "zod";

interface ValidateSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

/**
 * Parses body/params/query with zod. On success req.body and req.params are
 * replaced by the parsed data (unknown keys stripped). `req.query` is
 * writable in Express 4 but a read-only getter in Express 5, so the parsed
 * query goes to `res.locals.query` (read it with `validatedQuery`) to keep a
 * future upgrade painless. On failure responds 400 with
 * `{ error: <first problem> }`, the same shape the app and the existing tests
 * expect (no extra `details` field: existing tests deepEqual the whole body).
 */
export function validate(schemas: ValidateSchemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const details: { field: string; message: string }[] = [];

    const run = (schema: z.ZodType | undefined, input: unknown): unknown => {
      if (!schema) return undefined;
      const result = schema.safeParse(input);
      if (result.success) return result.data;
      for (const issue of result.error.issues) {
        details.push({ field: issue.path.join("."), message: issue.message });
      }
      return undefined;
    };

    // Order: params, query, body -> the first reported problem is deterministic.
    const params = run(schemas.params, req.params);
    const query = run(schemas.query, req.query);
    const body = run(schemas.body, req.body);

    if (details.length > 0) {
      res.status(400).json({ error: details[0].message });
      return;
    }

    if (schemas.params) req.params = params as Request["params"];
    if (schemas.body) req.body = body;
    if (schemas.query) res.locals.query = query;
    next();
  };
}

/**
 * The body parsed by `validate({ body: schema })`, typed from the schema.
 * Re-parsing the already-clean body is cheap and idempotent for our schemas;
 * it avoids a cast and throws (-> 500) if the middleware was forgotten.
 */
export function validatedBody<S extends z.ZodType>(req: Request, schema: S): z.infer<S> {
  return schema.parse(req.body);
}

/** The query parsed by `validate({ query: schema })`, typed from the schema. */
export function validatedQuery<S extends z.ZodType>(res: Response, schema: S): z.infer<S> {
  return schema.parse(res.locals.query);
}
