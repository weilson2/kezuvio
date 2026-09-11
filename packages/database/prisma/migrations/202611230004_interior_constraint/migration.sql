-- Qualify the JSON input positionally to avoid set-returning value-column ambiguity.
CREATE OR REPLACE FUNCTION interior.valid_state(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE bucket text; dimension text; design jsonb; item jsonb; catalog jsonb; amount numeric; width numeric; depth numeric;
BEGIN
  IF jsonb_typeof($1) IS DISTINCT FROM 'object' OR octet_length($1::text)>256000
    OR NOT($1 ?& ARRAY['catalog','pricingVersion','presets','designs','selectedDesignId','history'])
    OR jsonb_typeof($1->'pricingVersion') IS DISTINCT FROM 'number' OR ($1->>'pricingVersion')::numeric<1
    OR trunc(($1->>'pricingVersion')::numeric)<>($1->>'pricingVersion')::numeric THEN RETURN false; END IF;
  FOREACH bucket IN ARRAY ARRAY['catalog','presets','designs','history'] LOOP
    IF jsonb_typeof($1->bucket) IS DISTINCT FROM 'array'
      OR jsonb_array_length($1->bucket)>(CASE WHEN bucket='designs' THEN 10 WHEN bucket='history' THEN 100 ELSE 20 END)
      OR EXISTS(SELECT 1 FROM jsonb_array_elements($1->bucket) e WHERE coalesce(length(e->>'id'),0) NOT BETWEEN 1 AND 80)
      OR (SELECT count(*)<>count(DISTINCT e->>'id') FROM jsonb_array_elements($1->bucket) e) THEN RETURN false; END IF;
  END LOOP;
  IF jsonb_array_length($1->'designs')<1 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements($1->'designs') d WHERE d->>'id'=$1->>'selectedDesignId') THEN RETURN false; END IF;
  FOR catalog IN SELECT * FROM jsonb_array_elements($1->'catalog') LOOP
    FOREACH dimension IN ARRAY ARRAY['widthCm','depthCm','heightCm','unitPriceSen'] LOOP
      IF jsonb_typeof(catalog->dimension) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
      amount:=(catalog->>dimension)::numeric;
      IF amount<1 OR amount>(CASE WHEN dimension='unitPriceSen' THEN 10000000 ELSE 1500 END) OR trunc(amount)<>amount THEN RETURN false; END IF;
    END LOOP;
  END LOOP;
  FOR design IN SELECT * FROM jsonb_array_elements($1->'designs') LOOP
    IF jsonb_typeof(design->'version') IS DISTINCT FROM 'number' OR (design->>'version')::numeric<1
      OR trunc((design->>'version')::numeric)<>(design->>'version')::numeric
      OR coalesce(length(design->>'name'),0) NOT BETWEEN 1 AND 80
      OR design->>'wallColor' IS NULL OR design->>'wallColor' NOT IN ('Linen','Sage','Clay','Midnight')
      OR design->>'floorMaterial' IS NULL OR design->>'floorMaterial' NOT IN ('Oak','Terrazzo','Concrete')
      OR jsonb_typeof(design->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(design->'items')>30
      OR (SELECT count(*)<>count(DISTINCT e->>'id') FROM jsonb_array_elements(design->'items') e) THEN RETURN false; END IF;
    FOREACH dimension IN ARRAY ARRAY['widthCm','depthCm','heightCm'] LOOP
      IF jsonb_typeof(design->dimension) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
      amount:=(design->>dimension)::numeric;
      IF amount<200 OR amount>(CASE WHEN dimension='heightCm' THEN 500 ELSE 1500 END) OR trunc(amount)<>amount THEN RETURN false; END IF;
    END LOOP;
    FOR item IN SELECT * FROM jsonb_array_elements(design->'items') LOOP
      SELECT c INTO catalog FROM jsonb_array_elements($1->'catalog') c WHERE c->>'id'=item->>'catalogId';
      IF catalog IS NULL OR coalesce(length(item->>'id'),0) NOT BETWEEN 1 AND 80
        OR item->>'finish' IS NULL OR item->>'finish' NOT IN ('Oak','Walnut','White')
        OR jsonb_typeof(item->'rotationDeg') IS DISTINCT FROM 'number' OR (item->>'rotationDeg')::numeric NOT IN (0,90,180,270) THEN RETURN false; END IF;
      FOREACH dimension IN ARRAY ARRAY['widthCm','depthCm','heightCm','xCm','zCm'] LOOP
        IF jsonb_typeof(item->dimension) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
        amount:=(item->>dimension)::numeric;
        IF trunc(amount)<>amount OR amount<0 OR amount>3000 THEN RETURN false; END IF;
        IF dimension IN ('widthCm','depthCm','heightCm') AND (amount<(catalog->>dimension)::numeric/2 OR amount>(catalog->>dimension)::numeric*2) THEN RETURN false; END IF;
      END LOOP;
      width:=CASE WHEN (item->>'rotationDeg')::int IN (90,270) THEN (item->>'depthCm')::numeric ELSE (item->>'widthCm')::numeric END;
      depth:=CASE WHEN (item->>'rotationDeg')::int IN (90,270) THEN (item->>'widthCm')::numeric ELSE (item->>'depthCm')::numeric END;
      IF (item->>'xCm')::numeric+width>(design->>'widthCm')::numeric OR (item->>'zCm')::numeric+depth>(design->>'depthCm')::numeric
        OR (item->>'heightCm')::numeric>(design->>'heightCm')::numeric THEN RETURN false; END IF;
    END LOOP;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(design->'items') a CROSS JOIN jsonb_array_elements(design->'items') b
      WHERE a->>'id'<b->>'id'
      AND (a->>'xCm')::numeric < (b->>'xCm')::numeric+(CASE WHEN (b->>'rotationDeg')::int IN (90,270) THEN (b->>'depthCm')::numeric ELSE (b->>'widthCm')::numeric END)
      AND (b->>'xCm')::numeric < (a->>'xCm')::numeric+(CASE WHEN (a->>'rotationDeg')::int IN (90,270) THEN (a->>'depthCm')::numeric ELSE (a->>'widthCm')::numeric END)
      AND (a->>'zCm')::numeric < (b->>'zCm')::numeric+(CASE WHEN (b->>'rotationDeg')::int IN (90,270) THEN (b->>'widthCm')::numeric ELSE (b->>'depthCm')::numeric END)
      AND (b->>'zCm')::numeric < (a->>'zCm')::numeric+(CASE WHEN (a->>'rotationDeg')::int IN (90,270) THEN (a->>'widthCm')::numeric ELSE (a->>'depthCm')::numeric END)) THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
