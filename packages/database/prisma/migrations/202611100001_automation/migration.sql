CREATE SCHEMA automation;

CREATE FUNCTION automation.valid_state(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE bucket text; entry jsonb; line jsonb; subtotal numeric; discount numeric;
quantity numeric; price numeric; percent numeric;
BEGIN
  IF jsonb_typeof(value) IS DISTINCT FROM 'object' OR octet_length(value::text)>256000
    OR NOT (value ?& ARRAY['inquiries','analyses','quotes','tasks','followups','rules','history','nextInquiry'])
    OR jsonb_typeof(value->'rules') IS DISTINCT FROM 'object'
    OR jsonb_typeof(value->'nextInquiry') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
  FOREACH bucket IN ARRAY ARRAY['inquiries','analyses','quotes','tasks','followups','history'] LOOP
    IF jsonb_typeof(value->bucket) IS DISTINCT FROM 'array' THEN RETURN false; END IF;
    IF jsonb_array_length(value->bucket) > (CASE
      WHEN bucket='history' THEN 500 WHEN bucket IN ('tasks','followups') THEN 100 ELSE 25 END)
      THEN RETURN false; END IF;
    IF (SELECT count(*)<>count(DISTINCT item->>'id') FROM jsonb_array_elements(value->bucket) item)
      THEN RETURN false; END IF;
  END LOOP;
  FOR entry IN SELECT * FROM jsonb_array_elements(value->'quotes') LOOP
    IF NOT (entry ?& ARRAY['revision','approval','status','lines','discountPct','subtotalSen','discountSen','totalSen'])
      OR entry->>'status' IS NULL OR entry->>'status' NOT IN ('Draft','Rejected','Approved','Ready')
      OR jsonb_typeof(entry->'lines') IS DISTINCT FROM 'array'
      OR jsonb_array_length(entry->'lines') NOT BETWEEN 1 AND 12
      OR jsonb_typeof(entry->'revision') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
    IF entry->>'status' IN ('Approved','Ready') THEN
      IF jsonb_typeof(entry->'approval') IS DISTINCT FROM 'object'
        OR entry->'approval'->'revision' IS DISTINCT FROM entry->'revision'
        OR coalesce(length(entry->'approval'->>'note'),0)<3 THEN RETURN false; END IF;
    ELSIF entry->'approval' IS DISTINCT FROM 'null'::jsonb THEN RETURN false;
    END IF;
    subtotal := 0;
    FOR line IN SELECT * FROM jsonb_array_elements(entry->'lines') LOOP
      IF jsonb_typeof(line->'quantity') IS DISTINCT FROM 'number'
        OR jsonb_typeof(line->'unitPriceSen') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
      quantity := (line->>'quantity')::numeric; price := (line->>'unitPriceSen')::numeric;
      IF quantity NOT BETWEEN 1 AND 100 OR price NOT BETWEEN 1 AND 1000000
        OR trunc(quantity)<>quantity OR trunc(price)<>price THEN RETURN false; END IF;
      subtotal := subtotal + quantity*price;
    END LOOP;
    IF jsonb_typeof(entry->'discountPct') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
    percent := (entry->>'discountPct')::numeric;
    IF percent NOT BETWEEN 0 AND 30 OR trunc(percent)<>percent THEN RETURN false; END IF;
    discount := floor((subtotal*percent+50)/100);
    IF entry->'subtotalSen' IS DISTINCT FROM to_jsonb(subtotal)
      OR entry->'discountSen' IS DISTINCT FROM to_jsonb(discount)
      OR entry->'totalSen' IS DISTINCT FROM to_jsonb(subtotal-discount) THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE TABLE automation.documents (
  workspace_id uuid NOT NULL,
  product text NOT NULL CHECK(product='automation-hub'),
  generation integer NOT NULL CHECK(generation>0),
  state jsonb NOT NULL CHECK(automation.valid_state(state)),
  PRIMARY KEY(workspace_id,product,generation),
  FOREIGN KEY(workspace_id,product) REFERENCES platform.workspaces(id,product) ON DELETE CASCADE
);
ALTER TABLE automation.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.documents FORCE ROW LEVEL SECURITY;
CREATE POLICY scoped_rows ON automation.documents USING (
  workspace_id::text=current_setting('labs.workspace',true)
  AND product=current_setting('labs.product',true)
  AND generation::text=current_setting('labs.generation',true)
) WITH CHECK (
  workspace_id::text=current_setting('labs.workspace',true)
  AND product=current_setting('labs.product',true)
  AND generation::text=current_setting('labs.generation',true)
);
DO $$ BEGIN
  EXECUTE format('CREATE POLICY migration_owner ON automation.documents TO %I USING (true) WITH CHECK (true)',current_user);
END $$;
