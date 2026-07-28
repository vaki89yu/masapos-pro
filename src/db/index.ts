import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

let pool: Pool | undefined;
let drizzleDb: any = null;
let isMockMode = false;

function getDb() {
  if (drizzleDb) return drizzleDb;

  if (!databaseUrl) {
    isMockMode = true;
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

// Mock que devuelve resultados vacíos para no romper el build
function createMockDb(): any {
  const mockQuery = () => Promise.resolve([]);
  const mockSelect = () => ({ from: () => ({ where: mockQuery, orderBy: mockQuery, limit: mockQuery, offset: mockQuery }) });
  const mockInsert = () => ({ values: () => ({ returning: () => Promise.resolve([]), onConflictDoNothing: mockQuery }) });
  const mockUpdate = () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) });
  const mockDelete = () => ({ where: mockQuery });
  const mockExecute = () => Promise.resolve({ rows: [] });

  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    execute: mockExecute,
    query: { findMany: mockQuery, findFirst: mockQuery },
  };
}

let mockDbInstance: any = null;

// Proxy que devuelve un mock silencioso si no hay DB
export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getDb();
      if (instance) return (instance as any)[prop];
      
      // Modo offline - devolver mock
      if (!mockDbInstance) {
        mockDbInstance = createMockDb();
      }
      return (mockDbInstance as any)[prop];
    },
  }
) as ReturnType<typeof drizzle<typeof schema>>;

export * from "./schema";
