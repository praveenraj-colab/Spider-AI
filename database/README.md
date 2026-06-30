# Spider AI Database

This directory contains PostgreSQL runtime configuration for the Phase 1 Docker environment.

- `postgres/postgresql.conf` applies conservative local defaults.
- `postgres/init/01-init.sql` creates optional extensions during first database initialization.

Application tables are managed through Alembic migrations in `backend/alembic`.
