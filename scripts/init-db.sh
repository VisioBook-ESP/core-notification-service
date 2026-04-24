#!/bin/bash

# Database initialization script
# This script sets up the database schema and seeds initial data

set -e

echo "🚀 Initializing database for core-notification-service..."

# Check if DATABASE_HOST is set
if [ -z "$DATABASE_HOST" ]; then
  echo "❌ DATABASE_HOST environment variable not set"
  exit 1
fi

# Create database if it doesn't exist
echo "📦 Creating database..."
PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DATABASE_NAME'" | grep -q 1 || PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -c "CREATE DATABASE $DATABASE_NAME"

echo "✅ Database initialized successfully"
echo ""
echo "🗄️  Database Details:"
echo "  Host: $DATABASE_HOST"
echo "  Port: $DATABASE_PORT"
echo "  Database: $DATABASE_NAME"
echo "  User: $DATABASE_USER"
echo ""
echo "📝 Run migrations with: npm run migration:run"
echo "🌱 Run seeds with: npm run seed"
