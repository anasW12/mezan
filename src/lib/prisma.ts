import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  basePrisma: PrismaClient | undefined;
};

const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "$queryRaw",
]);

const TRANSIENT_PRISMA_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);

function isTransientConnectionError(
  error: unknown,
  strictPreConnectOnly = false
): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";

  if (strictPreConnectOnly) {
    return (
      code === "P1001" ||
      message.includes("Can't reach database server") ||
      message.includes("Server has closed the connection")
    );
  }

  if (TRANSIENT_PRISMA_CODES.has(code)) {
    return true;
  }

  return (
    message.includes("Can't reach database server") ||
    message.includes("Server has closed the connection") ||
    message.includes("ConnectionReset") ||
    message.includes("10054") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("socket hang up")
  );
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const basePrisma =
  globalForPrisma.basePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.basePrisma = basePrisma;
}

export const prisma = basePrisma.$extends({
  query: {
    async $allOperations({ operation, args, query }) {
      if (!READ_OPERATIONS.has(operation)) {
        return query(args);
      }

      const retryDelaysMs = [200, 500];
      let attempt = 0;

      while (true) {
        try {
          return await query(args);
        } catch (error) {
          if (
            attempt >= retryDelaysMs.length ||
            !isTransientConnectionError(error)
          ) {
            throw error;
          }
          await waitMs(retryDelaysMs[attempt]!);
          await basePrisma.$connect().catch(() => {});
          attempt += 1;
        }
      }
    },
  },
});

export async function runTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  try {
    return await basePrisma.$transaction(fn, {
      maxWait: 10000,
      timeout: 25000,
    });
  } catch (error) {
    if (!isTransientConnectionError(error, true)) {
      throw error;
    }
    await waitMs(300);
    await basePrisma.$connect().catch(() => {});
    return basePrisma.$transaction(fn, {
      maxWait: 10000,
      timeout: 25000,
    });
  }
}

export default prisma;
