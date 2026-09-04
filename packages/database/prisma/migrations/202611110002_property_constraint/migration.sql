BEGIN;

-- Alias both JSON set columns to avoid ambiguity with the function argument.
CREATE OR REPLACE FUNCTION property.valid_state(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE bucket text; entry jsonb; number_value numeric;
BEGIN
  IF jsonb_typeof(value) IS DISTINCT FROM 'object' OR octet_length(value::text)>256000
    OR NOT (value ?& ARRAY['listings','contacts','agents','leads','appointments','reminders','history'])
    THEN RETURN false; END IF;
  FOREACH bucket IN ARRAY ARRAY['listings','contacts','agents','leads','appointments','reminders','history'] LOOP
    IF jsonb_typeof(value->bucket) IS DISTINCT FROM 'array' THEN RETURN false; END IF;
    IF jsonb_array_length(value->bucket) > (CASE bucket
      WHEN 'agents' THEN 3 WHEN 'listings' THEN 50 WHEN 'contacts' THEN 50
      WHEN 'history' THEN 150 ELSE 100 END) THEN RETURN false; END IF;
    IF (SELECT count(*)<>count(DISTINCT item->>'id') FROM jsonb_array_elements(value->bucket) item)
      THEN RETURN false; END IF;
    FOR entry IN SELECT * FROM jsonb_array_elements(value->bucket) LOOP
      IF jsonb_typeof(entry->'id') IS DISTINCT FROM 'string' OR length(entry->>'id') NOT BETWEEN 1 AND 80
        THEN RETURN false; END IF;
      IF bucket<>'history' THEN
        IF jsonb_typeof(entry->'version') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
        number_value := (entry->>'version')::numeric;
        IF number_value<1 OR trunc(number_value)<>number_value THEN RETURN false; END IF;
      END IF;
    END LOOP;
  END LOOP;
  FOR entry IN SELECT * FROM jsonb_array_elements(value->'listings') LOOP
    IF jsonb_typeof(entry->'priceSen') IS DISTINCT FROM 'number'
      OR coalesce(entry->>'status','') NOT IN ('Available','Unavailable','Archived')
      THEN RETURN false; END IF;
    number_value := (entry->>'priceSen')::numeric;
    IF number_value NOT BETWEEN 1 AND 10000000000 OR trunc(number_value)<>number_value THEN RETURN false; END IF;
  END LOOP;
  FOR entry IN SELECT * FROM jsonb_array_elements(value->'appointments') LOOP
    IF coalesce(entry->>'status','') NOT IN ('Scheduled','Completed','Cancelled')
      OR jsonb_typeof(entry->'listingId') IS DISTINCT FROM 'string'
      OR jsonb_typeof(entry->'agentId') IS DISTINCT FROM 'string'
      OR coalesce(entry->>'startAt','') !~ '^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$'
      OR coalesce(entry->>'endAt','') !~ '^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$'
      OR (entry->>'endAt')::timestamptz <= (entry->>'startAt')::timestamptz
      THEN RETURN false; END IF;
  END LOOP;
  -- ISO timestamps have a uniform UTC representation. The application does
  -- the same check under the workspace lock to return a friendly conflict.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(value->'appointments') AS a(item)
    JOIN jsonb_array_elements(value->'appointments') AS b(item)
      ON a.item->>'id' < b.item->>'id'
      AND (a.item->>'agentId'=b.item->>'agentId' OR a.item->>'listingId'=b.item->>'listingId')
    WHERE a.item->>'status'='Scheduled' AND b.item->>'status'='Scheduled'
      AND (a.item->>'startAt')::timestamptz < (b.item->>'endAt')::timestamptz
      AND (b.item->>'startAt')::timestamptz < (a.item->>'endAt')::timestamptz
  ) THEN RETURN false; END IF;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

COMMIT;
