\set ON_ERROR_STOP on
-- Initialize missing schema objects while preserving existing tables and rows.
BEGIN;
CREATE SCHEMA IF NOT EXISTS public;
SET LOCAL search_path = public;

-- 1. Participant
CREATE TABLE IF NOT EXISTS participant (
    participant_identifier TEXT PRIMARY KEY CHECK (participant_identifier ~ '^P[0-9]{4}$'),
    participant_id         UUID NOT NULL UNIQUE,
    enrollment_date        DATE NOT NULL,
    final_study_status     TEXT NOT NULL CHECK (final_study_status IN ('Active', 'Completed', 'Dropped Out')),
    dropout_date           DATE,
    dropout_reason         TEXT CHECK (dropout_reason IN ('Lost to follow-up', 'No longer eligible', 'Participant withdrew consent', 'Technology barrier', 'Too busy / time burden', 'Unable to contact')),
    age                    SMALLINT NOT NULL CHECK (age BETWEEN 0 AND 120),
    education_level        TEXT NOT NULL CHECK (education_level IN ('Less than high school', 'High school or GED', 'Some college', 'Associate degree', 'Bachelor''s degree', 'Graduate degree')),
    employment_status      TEXT NOT NULL CHECK (employment_status IN ('Employed full-time', 'Employed part-time', 'Unemployed', 'Student', 'Retired', 'Unable to work')),
    gender_sex             TEXT NOT NULL CHECK (gender_sex IN ('Female', 'Male', 'Non-binary', 'Prefer not to answer')),
    CHECK ((final_study_status = 'Dropped Out') = (dropout_date IS NOT NULL)),
    CHECK ((dropout_date IS NULL) = (dropout_reason IS NULL))
);

-- 2. In-person exams
CREATE TABLE IF NOT EXISTS inperson_burden_events (
    event_id               INTEGER PRIMARY KEY,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    procedure_name         TEXT NOT NULL CHECK (procedure_name IN ('Body Measures', 'Blood Pressure', 'DEXA Scan', 'Liver Ultrasound')),
    location_type          TEXT NOT NULL,
    start_datetime         TIMESTAMP NOT NULL,
    end_datetime           TIMESTAMP,
    duration_minutes       NUMERIC(5,1),
    completion_status      TEXT NOT NULL CHECK (completion_status IN ('Completed', 'Not Completed')),
    UNIQUE (participant_identifier, procedure_name),
    CHECK ((completion_status = 'Completed') = (end_datetime IS NOT NULL)),
    CHECK ((end_datetime IS NULL) = (duration_minutes IS NULL))
);

CREATE TABLE IF NOT EXISTS bmx_j (
    participant_identifier TEXT PRIMARY KEY REFERENCES participant,
    bmdstats SMALLINT NOT NULL CHECK (bmdstats BETWEEN 1 AND 4),
    bmxwt    NUMERIC, bmiwt    SMALLINT,
    bmxrecum NUMERIC, bmirecum SMALLINT,
    bmxhead  NUMERIC, bmihead  SMALLINT,
    bmxht    NUMERIC, bmiht    SMALLINT,
    bmxbmi   NUMERIC,
    bmxleg   NUMERIC, bmileg   SMALLINT,
    bmxarml  NUMERIC, bmiarml  SMALLINT,
    bmxarmc  NUMERIC, bmiarmc  SMALLINT,
    bmxwaist NUMERIC, bmiwaist SMALLINT,
    bmxhip   NUMERIC, bmihip   SMALLINT
);

CREATE TABLE IF NOT EXISTS bpx_j (
    participant_identifier TEXT PRIMARY KEY REFERENCES participant,
    peascct1 SMALLINT, bpxchr SMALLINT, bpaarm SMALLINT, bpacsz SMALLINT,
    bpxpls   SMALLINT, bpxpuls SMALLINT, bpxpty SMALLINT, bpxml1 SMALLINT,
    bpxsy1 SMALLINT, bpxdi1 SMALLINT, bpaen1 SMALLINT,
    bpxsy2 SMALLINT, bpxdi2 SMALLINT, bpaen2 SMALLINT,
    bpxsy3 SMALLINT, bpxdi3 SMALLINT, bpaen3 SMALLINT,
    bpxsy4 SMALLINT, bpxdi4 SMALLINT, bpaen4 SMALLINT
);

CREATE TABLE IF NOT EXISTS lux_j (
    participant_identifier TEXT PRIMARY KEY REFERENCES participant,
    luaxstat SMALLINT NOT NULL CHECK (luaxstat BETWEEN 1 AND 4),
    luarxnc  SMALLINT, luarxnd SMALLINT, luarxin SMALLINT,
    luapnme  TEXT CHECK (luapnme IN ('M', 'XL')),
    luanmvgp SMALLINT, luanmtgp SMALLINT,
    luatech  TEXT,
    luxsmed  NUMERIC, luxsiqr NUMERIC, luxsiqrm NUMERIC,
    luxcapm  SMALLINT, luxcpiqr SMALLINT
);

CREATE TABLE IF NOT EXISTS dxx_j (
    participant_identifier TEXT PRIMARY KEY REFERENCES participant,
    dxaexsts SMALLINT NOT NULL CHECK (dxaexsts BETWEEN 1 AND 6),
    radiation_msv NUMERIC(5,2) NOT NULL CHECK (radiation_msv >= 0 AND radiation_msv < 20),
    dxahebv SMALLINT, dxxhea NUMERIC, dxxhebmc NUMERIC, dxxhebmd NUMERIC, dxahetv SMALLINT,
    dxxhefat NUMERIC, dxdhele NUMERIC, dxxheli NUMERIC, dxdhetot NUMERIC, dxdhepf NUMERIC,
    dxalabv SMALLINT, dxxlaa NUMERIC, dxxlabmc NUMERIC, dxxlabmd NUMERIC, dxalatv SMALLINT,
    dxxlafat NUMERIC, dxdlale NUMERIC, dxxlali NUMERIC, dxdlatot NUMERIC, dxdlapf NUMERIC,
    dxallbv SMALLINT, dxxlla NUMERIC, dxxllbmc NUMERIC, dxxllbmd NUMERIC, dxalltv SMALLINT,
    dxxllfat NUMERIC, dxdllle NUMERIC, dxxllli NUMERIC, dxdlltot NUMERIC, dxdllpf NUMERIC,
    dxarabv SMALLINT, dxxraa NUMERIC, dxxrabmc NUMERIC, dxxrabmd NUMERIC, dxaratv SMALLINT,
    dxxrafat NUMERIC, dxdrale NUMERIC, dxxrali NUMERIC, dxdratot NUMERIC, dxdrapf NUMERIC,
    dxarlbv SMALLINT, dxxrla NUMERIC, dxxrlbmc NUMERIC, dxxrlbmd NUMERIC, dxarltv SMALLINT,
    dxxrlfat NUMERIC, dxdrlle NUMERIC, dxxrlli NUMERIC, dxdrltot NUMERIC, dxdrlpf NUMERIC,
    dxxlra NUMERIC, dxxlrbmc NUMERIC, dxxlrbmd NUMERIC,
    dxxrra NUMERIC, dxxrrbmc NUMERIC, dxxrrbmd NUMERIC,
    dxxtsa NUMERIC, dxxtsbmc NUMERIC, dxxtsbmd NUMERIC,
    dxxlsa NUMERIC, dxxlsbmc NUMERIC, dxxlsbmd NUMERIC,
    dxxpea NUMERIC, dxxpebmc NUMERIC, dxxpebmd NUMERIC,
    dxatrbv SMALLINT, dxdtra NUMERIC, dxdtrbmc NUMERIC, dxdtrbmd NUMERIC, dxatrtv SMALLINT,
    dxxtrfat NUMERIC, dxdtrle NUMERIC, dxxtrli NUMERIC, dxdtrtot NUMERIC, dxdtrpf NUMERIC,
    dxdsta NUMERIC, dxdstbmc NUMERIC, dxdstbmd NUMERIC,
    dxdstfat NUMERIC, dxdstle NUMERIC, dxdstli NUMERIC, dxdsttot NUMERIC, dxdstpf NUMERIC,
    dxdtoa NUMERIC, dxdtobmc NUMERIC, dxdtobmd NUMERIC,
    dxdtofat NUMERIC, dxdtole NUMERIC, dxdtoli NUMERIC, dxdtotot NUMERIC, dxdtopf NUMERIC
);

-- 3. On-site surveys
CREATE TABLE IF NOT EXISTS test_data_surveys (
    participant_identifier TEXT NOT NULL REFERENCES participant,
    start_tm        TIMESTAMP NOT NULL,
    first_submit_tm TIMESTAMP NOT NULL,
    complete_tm     TIMESTAMP NOT NULL,
    elapsed_tm      INTEGER NOT NULL CHECK (elapsed_tm >= 0),
    survey_id       INTEGER NOT NULL,
    survey          TEXT,
    woman           BOOLEAN NOT NULL,
    age             NUMERIC NOT NULL,
    white           BOOLEAN NOT NULL,
    county          SMALLINT NOT NULL,
    phone           TEXT NOT NULL,
    PRIMARY KEY (participant_identifier, survey_id)
);

-- 4. Remote surveys (MDH)
CREATE TABLE IF NOT EXISTS survey_results (
    survey_result_key      UUID PRIMARY KEY,
    survey_key             UUID NOT NULL,
    survey_name            TEXT NOT NULL,
    survey_version         SMALLINT,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    survey_task_key        UUID NOT NULL,
    type                   TEXT,
    start_date             TIMESTAMPTZ NOT NULL,
    end_date               TIMESTAMPTZ NOT NULL,
    device_platform        TEXT CHECK (device_platform IN ('iOS', 'Android', 'WebClient')),
    device_name            TEXT,
    device_os_version      TEXT,
    inserted_date          TIMESTAMPTZ,
    participant_id         UUID NOT NULL,
    schedule_id            UUID,
    schedule_interval      SMALLINT,
    schedule_interval_type TEXT,
    schedule_name          TEXT,
    schedule_category      TEXT,
    user_type              TEXT,
    mdh_user               TEXT,
    locale                 TEXT,
    event                  TEXT,
    CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS survey_step_results (
    survey_step_result_key UUID PRIMARY KEY,
    survey_result_key      UUID NOT NULL REFERENCES survey_results ON DELETE CASCADE,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    participant_id         UUID NOT NULL,
    step_identifier        TEXT NOT NULL CHECK (step_identifier IN ('INTRO', 'Q1_MOOD', 'Q2_BURDEN', 'END')),
    start_date             TIMESTAMPTZ,
    end_date               TIMESTAMPTZ,
    UNIQUE (survey_result_key, step_identifier)
);

CREATE TABLE IF NOT EXISTS survey_step_viewed (
    participant_identifier TEXT NOT NULL REFERENCES participant,
    timestamp              TIMESTAMPTZ NOT NULL,
    participant_id         UUID NOT NULL,
    client_local_timestamp TIMESTAMP,
    event_id               UUID PRIMARY KEY,
    previous_event_id      UUID REFERENCES survey_step_viewed (event_id),
    step_identifier        TEXT CHECK (step_identifier IN ('INTRO', 'Q1_MOOD', 'Q2_BURDEN', 'END')),
    sub_step_identifier    TEXT,
    sub_step_index         TEXT,
    survey_id              UUID NOT NULL,
    survey_session_id      UUID NOT NULL,
    survey_version         SMALLINT,
    task_id                UUID,
    task_run_uuid          UUID,
    utm_campaign           TEXT,
    utm_content            TEXT,
    utm_medium             TEXT,
    utm_source             TEXT,
    utm_term               TEXT,
    fbclid                 TEXT,
    gclid                  TEXT,
    ndclid                 TEXT
);

-- 5. Communication (MDH)
CREATE TABLE IF NOT EXISTS notification_sent (
    participant_id          UUID NOT NULL,
    participant_identifier  TEXT NOT NULL REFERENCES participant,
    timestamp               TIMESTAMPTZ NOT NULL,
    content_version         SMALLINT,
    notification_identifier TEXT NOT NULL,
    notification_type       TEXT NOT NULL CHECK (notification_type IN ('Email', 'SMS', 'Push')),
    recipients              TEXT,
    status_code             TEXT,
    target_custom_field     TEXT,
    recipient_override      TEXT,
    PRIMARY KEY (participant_identifier, timestamp, notification_identifier)
);

CREATE TABLE IF NOT EXISTS email_send (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    message_id             UUID PRIMARY KEY,
    email_type             TEXT CHECK (email_type IN ('Invitation', 'Reminder', 'SurveyAvailable')),
    template_name          TEXT,
    to_email_address       TEXT,
    sender_email_address   TEXT,
    content_version        SMALLINT,
    subject                TEXT
);

CREATE TABLE IF NOT EXISTS email_delivery (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    message_id             UUID PRIMARY KEY REFERENCES email_send,
    email_type             TEXT,
    template_name          TEXT,
    to_email_address       TEXT,
    sender_email_address   TEXT,
    content_version        SMALLINT,
    subject                TEXT,
    delivery_recipient     TEXT,
    delivery_timestamp     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS email_open (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    message_id             UUID PRIMARY KEY REFERENCES email_send,
    email_type             TEXT,
    template_name          TEXT,
    to_email_address       TEXT,
    sender_email_address   TEXT,
    content_version        SMALLINT,
    subject                TEXT,
    open_timestamp         TIMESTAMPTZ,
    open_user_agent        TEXT,
    open_ip_address        INET
);

CREATE TABLE IF NOT EXISTS email_click (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    message_id             UUID PRIMARY KEY REFERENCES email_send,
    email_type             TEXT,
    template_name          TEXT,
    to_email_address       TEXT,
    sender_email_address   TEXT,
    content_version        SMALLINT,
    subject                TEXT,
    click_timestamp        TIMESTAMPTZ,
    click_user_agent       TEXT,
    click_ip_address       INET,
    click_link             TEXT,
    click_link_tags        TEXT
);

CREATE TABLE IF NOT EXISTS email_bounce (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    message_id             UUID PRIMARY KEY REFERENCES email_send,
    email_type             TEXT,
    template_name          TEXT,
    to_email_address       TEXT,
    sender_email_address   TEXT,
    content_version        SMALLINT,
    subject                TEXT,
    bounce_type            TEXT,
    bounce_sub_type        TEXT
);

CREATE TABLE IF NOT EXISTS email_complaint (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    message_id             UUID PRIMARY KEY REFERENCES email_send,
    email_type             TEXT,
    template_name          TEXT,
    to_email_address       TEXT,
    sender_email_address   TEXT,
    content_version        SMALLINT,
    subject                TEXT,
    complaint_type         TEXT,
    complaint_user_agent   TEXT
);

CREATE TABLE IF NOT EXISTS sms_send (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    message_id             UUID PRIMARY KEY,
    phone_number           TEXT,
    message_type           TEXT CHECK (message_type IN ('Reminder', 'SurveyLink')),
    timestamp              TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS sms_delivery (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    message_id             UUID PRIMARY KEY REFERENCES sms_send,
    phone_number           TEXT,
    message_type           TEXT,
    status                 TEXT,
    timestamp              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sms_failure (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    message_id             UUID PRIMARY KEY REFERENCES sms_send,
    phone_number           TEXT,
    message_type           TEXT,
    failure_code           INTEGER,
    failure_message        TEXT,
    timestamp              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sms_link_clicked (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT NOT NULL REFERENCES participant,
    message_id             UUID PRIMARY KEY REFERENCES sms_send,
    phone_number           TEXT,
    message_type           TEXT,
    original_link          TEXT,
    shortened_link         TEXT,
    timestamp              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sms_opt_out (
    participant_id         UUID NOT NULL,
    participant_identifier TEXT PRIMARY KEY REFERENCES participant,
    phone_number           TEXT,
    timestamp              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS push_notification_sent (
    participant_id               UUID NOT NULL,
    participant_identifier       TEXT NOT NULL REFERENCES participant,
    timestamp                    TIMESTAMPTZ NOT NULL,
    push_notification_identifier UUID NOT NULL,
    status_code                  TEXT,
    PRIMARY KEY (push_notification_identifier, timestamp)
);

CREATE TABLE IF NOT EXISTS push_notification_opened (
    participant_id               UUID NOT NULL,
    participant_identifier       TEXT NOT NULL REFERENCES participant,
    timestamp                    TIMESTAMPTZ,
    push_notification_identifier UUID PRIMARY KEY
);

-- Indexes on FK columns (Postgres does not create these on its own)
CREATE INDEX IF NOT EXISTS survey_results_participant_identifier_idx ON survey_results (participant_identifier);
CREATE INDEX IF NOT EXISTS survey_step_results_participant_identifier_idx ON survey_step_results (participant_identifier);
CREATE INDEX IF NOT EXISTS survey_step_viewed_participant_identifier_idx ON survey_step_viewed (participant_identifier);
CREATE INDEX IF NOT EXISTS notification_sent_participant_identifier_idx ON notification_sent (participant_identifier);
CREATE INDEX IF NOT EXISTS email_send_participant_identifier_idx ON email_send (participant_identifier);
CREATE INDEX IF NOT EXISTS sms_send_participant_identifier_idx ON sms_send (participant_identifier);
CREATE INDEX IF NOT EXISTS push_notification_sent_participant_identifier_idx ON push_notification_sent (participant_identifier);
CREATE INDEX IF NOT EXISTS push_notification_opened_participant_identifier_idx ON push_notification_opened (participant_identifier);

COMMIT;
