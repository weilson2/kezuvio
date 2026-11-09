CREATE SCHEMA commerce;

-- Product-owned bounded aggregate; workspace locking serializes stock, cart,
-- checkout and refunds. Validate core inventory invariants at rest as well.
CREATE FUNCTION commerce.valid_state(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE item jsonb; amount numeric;
BEGIN
  IF jsonb_typeof(value) IS DISTINCT FROM 'object' OR octet_length(value::text)>256000
    OR NOT (value ?& ARRAY['products','carts','orders','movements','nextOrder','catalogVersion']) THEN RETURN false; END IF;
  IF jsonb_typeof(value->'products') IS DISTINCT FROM 'array'
    OR jsonb_typeof(value->'carts') IS DISTINCT FROM 'array'
    OR jsonb_typeof(value->'orders') IS DISTINCT FROM 'array'
    OR jsonb_typeof(value->'movements') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
  IF jsonb_array_length(value->'products') NOT BETWEEN 1 AND 100
    OR jsonb_array_length(value->'carts')>100 OR jsonb_array_length(value->'orders')>100
    OR jsonb_array_length(value->'movements')>2000 THEN RETURN false; END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(value->'products') LOOP
    IF jsonb_typeof(item->'id') IS DISTINCT FROM 'string'
      OR jsonb_typeof(item->'onHand') IS DISTINCT FROM 'number'
      OR jsonb_typeof(item->'priceSen') IS DISTINCT FROM 'number'
      OR jsonb_typeof(item->'active') IS DISTINCT FROM 'boolean' THEN RETURN false; END IF;
    amount=(item->>'onHand')::numeric;
    IF amount<0 OR amount>10000 OR trunc(amount)<>amount THEN RETURN false; END IF;
    amount=(item->>'priceSen')::numeric;
    IF amount<1 OR amount>1000000 OR trunc(amount)<>amount THEN RETURN false; END IF;
  END LOOP;
  IF (SELECT count(*)<>count(DISTINCT x->>'id') FROM jsonb_array_elements(value->'products') x) THEN RETURN false; END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(value->'orders') LOOP
    IF jsonb_typeof(item->'id') IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  END LOOP;
  IF (SELECT count(*)<>count(DISTINCT x->>'id') FROM jsonb_array_elements(value->'orders') x) THEN RETURN false; END IF;
  FOREACH item IN ARRAY ARRAY[value->'nextOrder',value->'catalogVersion'] LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
    amount=item::text::numeric;
    IF amount<1 OR amount>1000000 OR trunc(amount)<>amount THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE TABLE commerce.documents (
  workspace_id uuid NOT NULL,
  product text NOT NULL CHECK(product='commerce-studio'),
  generation integer NOT NULL CHECK(generation>0),
  state jsonb NOT NULL CHECK(commerce.valid_state(state)),
  PRIMARY KEY(workspace_id,product,generation),
  FOREIGN KEY(workspace_id,product) REFERENCES platform.workspaces(id,product) ON DELETE CASCADE
);
ALTER TABLE commerce.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.documents FORCE ROW LEVEL SECURITY;
CREATE POLICY scoped_rows ON commerce.documents USING (
  workspace_id::text=current_setting('labs.workspace',true)
  AND product=current_setting('labs.product',true)
  AND generation::text=current_setting('labs.generation',true)
) WITH CHECK (
  workspace_id::text=current_setting('labs.workspace',true)
  AND product=current_setting('labs.product',true)
  AND generation::text=current_setting('labs.generation',true)
);
DO $$ BEGIN
  EXECUTE format('CREATE POLICY migration_owner ON commerce.documents TO %I USING (true) WITH CHECK (true)',current_user);
END $$;
