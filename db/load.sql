\set ON_ERROR_STOP on
-- Load the fixture CSVs atomically after running schema.sql.
-- Parents are loaded before children so the foreign keys are satisfied.
BEGIN;
SET LOCAL search_path = public;

\set target_table participant
\set csv_file /data/dummy_participant_master_file.csv
\set verify_participant_identities
\ir import.sql
\unset verify_participant_identities

\set target_table inperson_burden_events
\set csv_file /data/inperson_burden_events.csv
\ir import.sql

\set target_table bmx_j
\set csv_file /data/BMX_J.csv
\ir import.sql

\set target_table bpx_j
\set csv_file /data/BPX_J.csv
\ir import.sql

\set target_table lux_j
\set csv_file /data/LUX_J.csv
\ir import.sql

\set target_table dxx_j
\set csv_file /data/DXX_J_radiation.csv
\ir import.sql

\set target_table test_data_surveys
\set csv_file /data/test_data_surveys.csv
\ir import.sql

\set target_table survey_results
\set csv_file /data/SurveyResults.csv
\ir import.sql

\set target_table survey_step_results
\set csv_file /data/SurveyStepResults.csv
\ir import.sql

\set target_table survey_step_viewed
\set csv_file /data/SurveyStepViewed.csv
\ir import.sql

\set target_table notification_sent
\set csv_file /data/NotificationSent.csv
\ir import.sql

\set target_table email_send
\set csv_file /data/EmailSend.csv
\ir import.sql

\set target_table email_delivery
\set csv_file /data/EmailDelivery.csv
\ir import.sql

\set target_table email_open
\set csv_file /data/EmailOpen.csv
\ir import.sql

\set target_table email_click
\set csv_file /data/EmailClick.csv
\ir import.sql

\set target_table email_bounce
\set csv_file /data/EmailBounce.csv
\ir import.sql

\set target_table email_complaint
\set csv_file /data/EmailComplaint.csv
\ir import.sql

\set target_table sms_send
\set csv_file /data/SmsSend.csv
\ir import.sql

\set target_table sms_delivery
\set csv_file /data/SmsDelivery.csv
\ir import.sql

\set target_table sms_failure
\set csv_file /data/SmsFailure.csv
\ir import.sql

\set target_table sms_link_clicked
\set csv_file /data/SmsLinkClicked.csv
\ir import.sql

\set target_table sms_opt_out
\set csv_file /data/SmsOptOut.csv
\ir import.sql

\set target_table push_notification_sent
\set csv_file /data/PushNotificationSent.csv
\ir import.sql

\set target_table push_notification_opened
\set csv_file /data/PushNotificationOpened.csv
\ir import.sql

-- Report the total rows now present in each table.
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

COMMIT;
