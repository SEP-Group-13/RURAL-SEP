# Database setup and CSV imports

Run the commands from the repository root with the Compose PostgreSQL service
running. Use the database and user from your `.env` if you changed the defaults.

## Initialize and seed the database

```sh
docker compose cp db/. postgres:/sql
docker compose cp csv_data/. postgres:/data

docker compose exec postgres psql -X -U rural_dev -d rural_dev -f /sql/schema.sql
docker compose exec postgres psql -X -U rural_dev -d rural_dev -f /sql/load.sql
```

`schema.sql` creates missing tables and indexes and preserves existing ones.
Changes to existing table definitions require a separate migration.
`load.sql` imports the fixture files in dependency order in one transaction and
prints the resulting table totals. Both scripts can be rerun against a populated
database. If a fixture participant's identifier or UUID belongs to a different
participant, `load.sql` rolls back before importing dependent rows.

To look around: `docker compose exec postgres psql -U rural_dev -d rural_dev`, then `\dt` to list tables, `\d participant` to see one, `\q` to quit.

## Append another CSV

Copy the file into the container, then specify its path and the destination table.
For example, to append participants:

```sh
docker compose cp "new participants.csv" "postgres:/data/new participants.csv"
docker compose exec postgres psql -X -U rural_dev -d rural_dev --single-transaction -v target_table=participant -v "csv_file=/data/new participants.csv" -f /sql/import.sql
```

The import expects a header followed by data in the destination table's column
order. Import parent records before files that reference them.

Rows that conflict with an existing primary or unique key are skipped and counted
in the output. The existing row keeps its values. Invalid field values or foreign
keys on rows being inserted cause the transaction to roll back.
