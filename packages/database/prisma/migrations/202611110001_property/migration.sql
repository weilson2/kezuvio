BEGIN;

CREATE SCHEMA property;

CREATE FUNCTION property.valid_state(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE bucket text; entry jsonb; number_value numeric;
BEGIN
  IF jsonb_typeof(value) IS DISTINCT FROM 'object' OR octet_length(value::text)>256000
    OR NOT (value ?& ARRAY['listings','contacts','agents','leads','appointments','reminders','history'])
    THEN RETURN false; END IF;
  FOREACH bucket IN ARRAY ARRAY['listings','contacts','agents','leads','appointments','reminders','history'] LOOP
    IF jsonb_typeof(value->bucket) IS DISTINCT FROM 'array' THEN RETURN false; END IF;
    IF jsonb_array_length(value->bucket)>500 THEN RETURN false; END IF;
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
    IF number_value NOT BETWEEN 1 AND 9007199254740991 OR trunc(number_value)<>number_value THEN RETURN false; END IF;
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
    SELECT 1 FROM jsonb_array_elements(value->'appointments') a
    JOIN jsonb_array_elements(value->'appointments') b
      ON a->>'id' < b->>'id'
      AND (a->>'agentId'=b->>'agentId' OR a->>'listingId'=b->>'listingId')
    WHERE a->>'status'='Scheduled' AND b->>'status'='Scheduled'
      AND (a->>'startAt')::timestamptz < (b->>'endAt')::timestamptz
      AND (b->>'startAt')::timestamptz < (a->>'endAt')::timestamptz
  ) THEN RETURN false; END IF;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE TABLE property.documents (
  workspace_id uuid NOT NULL,
  product text NOT NULL CHECK(product='property-crm'),
  generation integer NOT NULL CHECK(generation>0),
  state jsonb NOT NULL CHECK(property.valid_state(state)),
  PRIMARY KEY(workspace_id,product,generation),
  FOREIGN KEY(workspace_id,product) REFERENCES platform.workspaces(id,product) ON DELETE CASCADE
);
ALTER TABLE property.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property.documents FORCE ROW LEVEL SECURITY;
CREATE POLICY scoped_rows ON property.documents USING (
  workspace_id::text=current_setting('labs.workspace',true)
  AND product=current_setting('labs.product',true)
  AND generation::text=current_setting('labs.generation',true)
) WITH CHECK (
  workspace_id::text=current_setting('labs.workspace',true)
  AND product=current_setting('labs.product',true)
  AND generation::text=current_setting('labs.generation',true)
);
DO $$ BEGIN
  EXECUTE format('CREATE POLICY migration_owner ON property.documents TO %I USING (true) WITH CHECK (true)',current_user);
END $$;

COMMIT;
