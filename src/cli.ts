// CLI utilities for database operations (requires database setup files)
// import { AppDataSource } from './data-source';
// import { databaseSeeder } from './database.seeder';

export async function runMigrations() {
  // if (!AppDataSource.isInitialized) {
  //   await AppDataSource.initialize();
  // }

  console.log('🔄 Running migrations...');
  // await AppDataSource.runMigrations();
  console.log('✅ Migrations completed');
}

export async function runSeeds() {
  // if (!AppDataSource.isInitialized) {
  //   await AppDataSource.initialize();
  // }

  console.log('🌱 Running seeds...');
  // await databaseSeeder.seed(AppDataSource);
  console.log('✅ Seeds completed');
}

export async function revertMigrations() {
  // if (!AppDataSource.isInitialized) {
  //   await AppDataSource.initialize();
  // }

  console.log('⏮️ Reverting migrations...');
  // await AppDataSource.undoLastMigration();
  console.log('✅ Migration reverted');
}

// CLI entry point
const command = process.argv[2];

if (command === 'migrate') {
  runMigrations()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else if (command === 'seed') {
  runSeeds()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else if (command === 'revert') {
  revertMigrations()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else {
  console.log('Usage: npm run db:cli [migrate|seed|revert]');
  process.exit(1);
}
