import { createHash, randomBytes } from "node:crypto";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashIp(ip: string, salt: string) {
  return sha256(`${salt}:${ip}`);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

type Where = {
  field: string;
  value: unknown;
  operator?: string;
  connector?: string;
};

type AdapterArgs = {
  model: string;
  data?: Record<string, unknown>;
  where?: Where[];
  update?: Record<string, unknown>;
  join?: unknown;
};

type Adapter = {
  create: (args: AdapterArgs) => Promise<Record<string, unknown> | null>;
  findOne: (args: AdapterArgs) => Promise<Record<string, unknown> | null>;
  findMany: (args: AdapterArgs) => Promise<Record<string, unknown>[]>;
  update: (args: AdapterArgs) => Promise<Record<string, unknown> | null>;
  updateMany: (args: AdapterArgs) => Promise<number>;
  delete: (args: AdapterArgs) => Promise<void>;
  deleteMany: (args: AdapterArgs) => Promise<number>;
  count: (args: AdapterArgs) => Promise<number>;
};

function hashTokenValue(value: unknown, rawByHash: Map<string, string>) {
  if (typeof value === "string") {
    const hashed = sha256(value);
    rawByHash.set(hashed, value);
    return hashed;
  }
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item !== "string") return item;
      const hashed = sha256(item);
      rawByHash.set(hashed, item);
      return hashed;
    });
  }
  return value;
}

function rewriteWhere(
  where: Where[] | undefined,
  rawByHash: Map<string, string>,
) {
  if (!where) return where;
  return where.map((clause) => {
    if (clause.field !== "token") return clause;
    return { ...clause, value: hashTokenValue(clause.value, rawByHash) };
  });
}

function withWhere(args: AdapterArgs, where: Where[] | undefined): AdapterArgs {
  if (!where) {
    const { where: omitted, ...rest } = args;
    void omitted;
    return rest;
  }
  return { ...args, where };
}
function restoreToken(
  row: Record<string, unknown> | null,
  rawByHash: Map<string, string>,
) {
  if (!row || typeof row.token !== "string") return row;
  const raw = rawByHash.get(row.token);
  if (!raw) return row;
  return { ...row, token: raw };
}

/**
 * Stores only the SHA-256 of the session token. Better Auth still receives the
 * raw token so the cookie and lookups stay aligned.
 */
export function withHashedSessionTokens<T extends (options: never) => object>(
  factory: T,
): T {
  return ((options: never) => {
    const adapter = factory(options) as Adapter;
    return {
      ...adapter,
      async create(args: AdapterArgs) {
        if (
          args.model !== "session" ||
          !args.data ||
          typeof args.data.token !== "string"
        ) {
          return adapter.create(args);
        }
        const raw = args.data.token;
        const created = await adapter.create({
          ...args,
          data: { ...args.data, token: sha256(raw) },
        });
        if (!created) return created;
        return { ...created, token: raw };
      },
      async findOne(args: AdapterArgs) {
        const rawByHash = new Map<string, string>();
        const found = await adapter.findOne(
          withWhere(args, rewriteWhere(args.where, rawByHash)),
        );
        return args.model === "session"
          ? restoreToken(found, rawByHash)
          : found;
      },
      async findMany(args: AdapterArgs) {
        const rawByHash = new Map<string, string>();
        const rows = await adapter.findMany(
          withWhere(args, rewriteWhere(args.where, rawByHash)),
        );
        if (args.model !== "session") return rows;
        return rows.map((row) => restoreToken(row, rawByHash) ?? row);
      },
      async update(args: AdapterArgs) {
        const rawByHash = new Map<string, string>();
        const updated = await adapter.update(
          withWhere(args, rewriteWhere(args.where, rawByHash)),
        );
        return args.model === "session"
          ? restoreToken(updated, rawByHash)
          : updated;
      },
      async updateMany(args: AdapterArgs) {
        const rawByHash = new Map<string, string>();
        return adapter.updateMany(
          withWhere(args, rewriteWhere(args.where, rawByHash)),
        );
      },
      async delete(args: AdapterArgs) {
        const rawByHash = new Map<string, string>();
        await adapter.delete(
          withWhere(args, rewriteWhere(args.where, rawByHash)),
        );
      },
      async deleteMany(args: AdapterArgs) {
        const rawByHash = new Map<string, string>();
        return adapter.deleteMany(
          withWhere(args, rewriteWhere(args.where, rawByHash)),
        );
      },
    };
  }) as T;
}
