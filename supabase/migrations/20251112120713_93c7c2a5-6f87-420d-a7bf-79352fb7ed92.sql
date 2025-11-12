-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule daily reset job to run at midnight UTC every day
SELECT cron.schedule(
  'daily-analysis-reset',
  '0 0 * * *', -- At 00:00 (midnight) UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://iccxtssdximiuarmnbmx.supabase.co/functions/v1/daily-reset',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljY3h0c3NkeGltaXVhcm1uYm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDg1NjEsImV4cCI6MjA3NDAyNDU2MX0.2ZHIK2WVMsPgLirwDxYzR0AEqiIO6P7PfhoMlVXL7ec"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);