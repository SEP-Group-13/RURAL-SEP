# RURAL-SEP

Open source repository for the RURAL Study Candidate Dashboard.

## Backend development

Requires Docker with Compose v2.20+ running. From the repository root:

```sh
cp .env.example .env
docker compose up --build --wait
docker compose ps
```

Both services should report `healthy`. The backend runs at
[http://localhost:3000](http://localhost:3000). Change `DATA_SERVICE_PORT` in `.env`
if port 3000 is in use. PostgreSQL is accessible only inside the Compose network.

The backend checks database access before accepting requests (URF 5.1).
Source changes reload automatically. Rebuild after changing dependencies or the
Dockerfile with `docker compose up --build --wait`.

Configure the
database through `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` in `.env`.
These settings initialize an empty database, changing them does not update an
existing database.

### Common commands

```sh
# Logs
docker compose logs -f

# Build and typecheck
docker compose exec data-service npm run build:server
docker compose exec data-service npx tsc --project server/tsconfig.json --noEmit

# Stop containers and keep database data
docker compose down
```

Database data is stored in the named `postgres-data` volume and survives restarts
and container recreation. Keep the same Compose project name to reuse it.

To delete all local database data and start fresh:

```sh
docker compose down --volumes
docker compose up --wait
```
