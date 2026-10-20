\set ON_ERROR_STOP on
-- Loads every CSV from /data into the tables. Run schema.sql first.
-- Parents are loaded before children so the foreign keys are satisfied.
\copy participant FROM '/data/dummy_participant_master_file.csv' CSV HEADER
\copy inperson_burden_events FROM '/data/inperson_burden_events.csv' CSV HEADER
\copy bmx_j FROM '/data/BMX_J.csv' CSV HEADER
\copy bpx_j FROM '/data/BPX_J.csv' CSV HEADER
\copy lux_j FROM '/data/LUX_J.csv' CSV HEADER
\copy dxx_j FROM '/data/DXX_J_radiation.csv' CSV HEADER
CREATE TEMP TABLE onsite_raw (participant_identifier TEXT, start_tm TEXT, first_submit_tm TEXT, complete_tm TEXT, elapsed_tm TEXT, survey_id TEXT, survey TEXT, woman TEXT, age TEXT, white TEXT, county TEXT, phone TEXT);
\copy onsite_raw FROM '/data/test_data_surveys.csv' CSV HEADER
INSERT INTO test_data_surveys
SELECT participant_identifier,
       to_timestamp(start_tm, 'DDMONYY:HH24:MI:SS')::timestamp,
       to_timestamp(first_submit_tm, 'DDMONYY:HH24:MI:SS')::timestamp,
       to_timestamp(complete_tm, 'DDMONYY:HH24:MI:SS')::timestamp,
       elapsed_tm::integer, survey_id::integer, survey,
       woman::boolean, age::numeric, white::boolean, county::smallint, phone
FROM onsite_raw;
\copy survey_results FROM '/data/SurveyResults.csv' CSV HEADER
\copy survey_step_results FROM '/data/SurveyStepResults.csv' CSV HEADER
\copy survey_step_viewed FROM '/data/SurveyStepViewed.csv' CSV HEADER
\copy notification_sent FROM '/data/NotificationSent.csv' CSV HEADER
\copy email_send FROM '/data/EmailSend.csv' CSV HEADER
\copy email_delivery FROM '/data/EmailDelivery.csv' CSV HEADER
\copy email_open FROM '/data/EmailOpen.csv' CSV HEADER
\copy email_click FROM '/data/EmailClick.csv' CSV HEADER
\copy email_bounce FROM '/data/EmailBounce.csv' CSV HEADER
\copy email_complaint FROM '/data/EmailComplaint.csv' CSV HEADER
\copy sms_send FROM '/data/SmsSend.csv' CSV HEADER
\copy sms_delivery FROM '/data/SmsDelivery.csv' CSV HEADER
\copy sms_failure FROM '/data/SmsFailure.csv' CSV HEADER
\copy sms_link_clicked FROM '/data/SmsLinkClicked.csv' CSV HEADER
\copy sms_opt_out FROM '/data/SmsOptOut.csv' CSV HEADER
\copy push_notification_sent FROM '/data/PushNotificationSent.csv' CSV HEADER
\copy push_notification_opened FROM '/data/PushNotificationOpened.csv' CSV HEADER

-- Row counts, compare with the schema note
SELECT 'participant' AS table_name, count(*) FROM participant
UNION ALL SELECT 'inperson_burden_events', count(*) FROM inperson_burden_events
UNION ALL SELECT 'bmx_j', count(*) FROM bmx_j
UNION ALL SELECT 'bpx_j', count(*) FROM bpx_j
UNION ALL SELECT 'lux_j', count(*) FROM lux_j
UNION ALL SELECT 'dxx_j', count(*) FROM dxx_j
UNION ALL SELECT 'test_data_surveys', count(*) FROM test_data_surveys
UNION ALL SELECT 'survey_results', count(*) FROM survey_results
UNION ALL SELECT 'survey_step_results', count(*) FROM survey_step_results
UNION ALL SELECT 'survey_step_viewed', count(*) FROM survey_step_viewed
UNION ALL SELECT 'notification_sent', count(*) FROM notification_sent
UNION ALL SELECT 'email_send', count(*) FROM email_send
UNION ALL SELECT 'email_delivery', count(*) FROM email_delivery
UNION ALL SELECT 'email_open', count(*) FROM email_open
UNION ALL SELECT 'email_click', count(*) FROM email_click
UNION ALL SELECT 'email_bounce', count(*) FROM email_bounce
UNION ALL SELECT 'email_complaint', count(*) FROM email_complaint
UNION ALL SELECT 'sms_send', count(*) FROM sms_send
UNION ALL SELECT 'sms_delivery', count(*) FROM sms_delivery
UNION ALL SELECT 'sms_failure', count(*) FROM sms_failure
UNION ALL SELECT 'sms_link_clicked', count(*) FROM sms_link_clicked
UNION ALL SELECT 'sms_opt_out', count(*) FROM sms_opt_out
UNION ALL SELECT 'push_notification_sent', count(*) FROM push_notification_sent
UNION ALL SELECT 'push_notification_opened', count(*) FROM push_notification_opened;
