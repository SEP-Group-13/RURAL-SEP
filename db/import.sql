\set ON_ERROR_STOP on
-- Run with psql --single-transaction, or include inside the fixture transaction.
CREATE TEMP TABLE import_rows (
    LIKE public.:"target_table" INCLUDING CONSTRAINTS
) ON COMMIT DROP;

-- On-site survey CSVs use DDMonYY times, which need an explicit format.
SELECT :'target_table' = 'test_data_surveys' AS onsite_survey \gset
\if :onsite_survey
    ALTER TABLE pg_temp.import_rows
        ALTER COLUMN start_tm TYPE text,
        ALTER COLUMN first_submit_tm TYPE text,
        ALTER COLUMN complete_tm TYPE text;
\endif

-- psql's \copy does not interpolate variables. Pass the filename as a quoted
-- environment variable to a fixed command so psql reads the file on its side.
\setenv RURAL_IMPORT_CSV :csv_file
\copy pg_temp.import_rows FROM PROGRAM 'exec cat -- "$RURAL_IMPORT_CSV"' CSV HEADER
\setenv RURAL_IMPORT_CSV

\if :onsite_survey
    INSERT INTO public.test_data_surveys
    SELECT participant_identifier,
           to_timestamp(start_tm, 'DDMONYY:HH24:MI:SS')::timestamp,
           to_timestamp(first_submit_tm, 'DDMONYY:HH24:MI:SS')::timestamp,
           to_timestamp(complete_tm, 'DDMONYY:HH24:MI:SS')::timestamp,
           elapsed_tm, survey_id, survey, woman, age, white, county, phone
    FROM pg_temp.import_rows
    ON CONFLICT DO NOTHING;
\else
    INSERT INTO public.:"target_table"
    SELECT * FROM pg_temp.import_rows
    ON CONFLICT DO NOTHING;
\endif

\set inserted_rows :ROW_COUNT

\if :{?verify_participant_identities}
    -- Keep the verified identities stable until the dependent fixtures are loaded.
    DO $$
    DECLARE
        conflicting_identifier text;
    BEGIN
        SELECT incoming.participant_identifier INTO conflicting_identifier
        FROM pg_temp.import_rows AS incoming
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.participant AS stored
            WHERE stored.participant_identifier = incoming.participant_identifier
              AND stored.participant_id = incoming.participant_id
            FOR KEY SHARE
        )
        LIMIT 1;

        IF FOUND THEN
            RAISE EXCEPTION 'Fixture participant % conflicts with an existing participant identifier or UUID',
                conflicting_identifier;
        END IF;
    END;
    $$;
\endif

SELECT count(*) - :inserted_rows AS skipped_rows FROM pg_temp.import_rows \gset
\echo :target_table - inserted :inserted_rows / skipped :skipped_rows due to key conflicts
DROP TABLE pg_temp.import_rows;
