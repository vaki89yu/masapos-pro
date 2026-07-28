import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

let pool: Pool | undefined;
let drizzleDb: any = null;

function getDb() {
  if (drizzleDb) return drizzleDb;

  if (!databaseUrl) {
    drizzleDb = null;
    return null;
  }

  const globalForDb = globalThis as typeof globalThis & {
    __arenaNextJsPostgresqlPool?: Pool;
  };

  pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 30000,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  drizzleDb = drizzle(pool, { schema });
  return drizzleDb;
}

// Proxy para que db no sea null y los tipos compilen
export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getDb();
      if (!instance) {
        if (prop === "then") return undefined;
        throw new Error(
          "⚠️ La base de datos no está conectada. " +
          "Configura DATABASE_URL en las variables de entorno."
        );
      }
      return (instance as any)[prop];
    },
  }
) as ReturnType<typeof drizzle<typeof schema>>;

export * from "./schema";
