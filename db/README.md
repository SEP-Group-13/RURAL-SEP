These are just helper srcipts to help populate the database for now.
Later on we will do it through the frontend functionality as we decided for the URD.


## How to run

Run these from the repository root in PowerShell, with the containers running (`docker compose up --build --wait`).

```powershell
# 1. Copy the CSVs and the SQL files into the postgres container
docker compose cp csv_data/. postgres:/data
docker compose cp db/. postgres:/sql

# 2. Create the tables (wipes existing tables first)
docker compose exec postgres psql -U rural_dev -d rural_dev -v ON_ERROR_STOP=1 -f /sql/schema.sql

# 3. Load the data, prints the row count per table at the end
docker compose exec postgres psql -U rural_dev -d rural_dev -f /sql/load.sql
```

- `schema.sql` creates the 24 tables. `load.sql` fills them from the CSVs.
- After editing either SQL file, repeat the `db/.` copy and steps 2 and 3.
- Use the user and database from your `.env` if you changed them.
- To look around: `docker compose exec postgres psql -U rural_dev -d rural_dev`, then `\dt` to list tables, `\d participant` to see one, `\q` to quit.
