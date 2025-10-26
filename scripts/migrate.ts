import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { readdir } from "fs/promises";
import { join } from "path";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function runMigrations() {
  console.log("🔄 Starting database migrations...");

  try {
    // Create database connection
    const connectionString = process.env.DATABASE_URL!;
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client);

    // Check if migrations folder exists and has files
    const migrationsDir = join(process.cwd(), "migrations");
    const migrationFiles = await readdir(migrationsDir);
    const sqlFiles = migrationFiles.filter((file) => file.endsWith(".sql"));

    if (sqlFiles.length === 0) {
      console.log("ℹ️  No migration files found, skipping migrations");
      await client.end();
      return;
    }

    console.log(`📁 Found ${sqlFiles.length} migration files`);

    // Run migrations
    await migrate(db, { migrationsFolder: migrationsDir });

    console.log("✅ Database migrations completed successfully");

    // Close connection
    await client.end();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
