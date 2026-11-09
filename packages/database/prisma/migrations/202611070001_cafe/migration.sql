CREATE SCHEMA cafe;
-- A workspace-sized aggregate gives one atomic order/payment/inventory transaction.
-- Check core stock and identity invariants again at the persistence boundary.
CREATE FUNCTION cafe.valid_state(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE item jsonb; amount numeric; reserved numeric;
BEGIN
  IF jsonb_typeof(value) <> 'object' OR octet_length(value::text)>256000 THEN RETURN false; END IF;
  IF jsonb_typeof(value->'menu')<>'array' OR jsonb_typeof(value->'orders')<>'array'
    OR jsonb_typeof(value->'shifts')<>'array' OR jsonb_typeof(value->'movements')<>'array' THEN RETURN false; END IF;
  IF jsonb_array_length(value->'menu') NOT BETWEEN 1 AND 100 OR jsonb_array_length(value->'orders')>50
    OR jsonb_array_length(value->'shifts')>100 OR jsonb_array_length(value->'movements')>2000 THEN RETURN false; END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(value->'menu') LOOP
    IF jsonb_typeof(item->'onHand') IS DISTINCT FROM 'number' OR jsonb_typeof(item->'reserved') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
    amount=(item->>'onHand')::numeric; reserved=(item->>'reserved')::numeric;
    IF amount<0 OR amount>10000 OR reserved<0 OR reserved>amount OR trunc(amount)<>amount OR trunc(reserved)<>reserved THEN RETURN false; END IF;
  END LOOP;
  IF (SELECT count(*)<>count(DISTINCT x->>'id') FROM jsonb_array_elements(value->'menu') x) THEN RETURN false; END IF;
  IF (SELECT count(*)<>count(DISTINCT x->>'id') FROM jsonb_array_elements(value->'orders') x) THEN RETURN false; END IF;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE TABLE cafe.documents (
  workspace_id uuid NOT NULL, product text NOT NULL CHECK(product='cafe-pos'), generation integer NOT NULL CHECK(generation>0),
  state jsonb NOT NULL CHECK(cafe.valid_state(state)),
  PRIMARY KEY(workspace_id,product,generation),
  FOREIGN KEY(workspace_id,product) REFERENCES platform.workspaces(id,product) ON DELETE CASCADE
);
ALTER TABLE cafe.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe.documents FORCE ROW LEVEL SECURITY;
CREATE POLICY scoped_rows ON cafe.documents USING (
  workspace_id::text=current_setting('labs.workspace',true) AND product=current_setting('labs.product',true)
  AND generation::text=current_setting('labs.generation',true)
) WITH CHECK (
  workspace_id::text=current_setting('labs.workspace',true) AND product=current_setting('labs.product',true)
  AND generation::text=current_setting('labs.generation',true)
);
DO $$ BEGIN
  EXECUTE format('CREATE POLICY migration_owner ON cafe.documents TO %I USING (true) WITH CHECK (true)',current_user);
END $$;
