CREATE SCHEMA accounting;

CREATE FUNCTION accounting.valid_state(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE bucket text; entry jsonb; line jsonb; original jsonb; debit numeric; credit numeric; amount numeric;
BEGIN
  IF jsonb_typeof(value) IS DISTINCT FROM 'object' OR octet_length(value::text)>256000
    OR NOT (value ?& ARRAY['today','accounts','periods','parties','journals','documents','bankTransactions','inventory','history'])
    OR jsonb_typeof(value->'today') IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  FOREACH bucket IN ARRAY ARRAY['accounts','periods','parties','journals','documents','bankTransactions','inventory','history'] LOOP
    IF jsonb_typeof(value->bucket) IS DISTINCT FROM 'array' OR jsonb_array_length(value->bucket)>500
      OR (SELECT count(*)<>count(DISTINCT item->>'id') FROM jsonb_array_elements(value->bucket) item)
      OR EXISTS(SELECT 1 FROM jsonb_array_elements(value->bucket) item WHERE coalesce(length(item->>'id'),0) NOT BETWEEN 1 AND 80)
      THEN RETURN false; END IF;
  END LOOP;
  FOR entry IN SELECT * FROM jsonb_array_elements(value->'accounts') LOOP
    IF entry->>'category' IS NULL OR entry->>'category' NOT IN ('Asset','Liability','Equity','Income','Expense') THEN RETURN false; END IF;
  END LOOP;
  FOR entry IN SELECT * FROM jsonb_array_elements(value->'journals') LOOP
    IF jsonb_typeof(entry->'lines') IS DISTINCT FROM 'array' OR jsonb_array_length(entry->'lines') NOT BETWEEN 2 AND 12
      OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(value->'periods') p WHERE p->>'id'=entry->>'periodId'
        AND entry->>'date' BETWEEN p->>'start' AND p->>'end') THEN RETURN false; END IF;
    debit:=0; credit:=0;
    FOR line IN SELECT * FROM jsonb_array_elements(entry->'lines') LOOP
      IF jsonb_typeof(line->'debitSen') IS DISTINCT FROM 'number' OR jsonb_typeof(line->'creditSen') IS DISTINCT FROM 'number'
        OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(value->'accounts') a WHERE a->>'id'=line->>'accountId') THEN RETURN false; END IF;
      IF (line->>'debitSen')::numeric NOT BETWEEN 0 AND 1000000000000 OR (line->>'creditSen')::numeric NOT BETWEEN 0 AND 1000000000000
        OR trunc((line->>'debitSen')::numeric)<>(line->>'debitSen')::numeric OR trunc((line->>'creditSen')::numeric)<>(line->>'creditSen')::numeric
        OR (((line->>'debitSen')::numeric>0)=((line->>'creditSen')::numeric>0)) THEN RETURN false; END IF;
      debit:=debit+(line->>'debitSen')::numeric; credit:=credit+(line->>'creditSen')::numeric;
    END LOOP;
    IF debit<>credit OR debit<=0 THEN RETURN false; END IF;
    IF jsonb_typeof(entry->'reversalOf') IS DISTINCT FROM 'null' THEN
      SELECT j INTO original FROM jsonb_array_elements(value->'journals') j WHERE j->>'id'=entry->>'reversalOf';
      IF original IS NULL OR original->>'kind'='Reversal' OR entry->>'kind'<>'Reversal'
        OR entry->>'date'<original->>'date' OR entry->>'id'=original->>'id'
        OR entry->'lines' IS DISTINCT FROM (SELECT jsonb_agg(jsonb_build_object('accountId',l->>'accountId','debitSen',l->'creditSen','creditSen',l->'debitSen') ORDER BY n)
          FROM jsonb_array_elements(original->'lines') WITH ORDINALITY AS x(l,n)) THEN RETURN false; END IF;
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(value->'journals') j WHERE j->>'reversalOf' IS NOT NULL GROUP BY j->>'reversalOf' HAVING count(*)>1) THEN RETURN false; END IF;
  FOR entry IN SELECT * FROM jsonb_array_elements(value->'documents') LOOP
    IF entry->>'kind' IS NULL OR entry->>'kind' NOT IN ('Invoice','Bill')
      OR jsonb_typeof(entry->'voided') IS DISTINCT FROM 'boolean'
      OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(value->'parties') p WHERE p->>'id'=entry->>'partyId')
      OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(value->'journals') j WHERE j->>'id'=entry->>'journalId') THEN RETURN false; END IF;
    FOREACH bucket IN ARRAY ARRAY['amountSen','settledSen','creditedSen'] LOOP
      IF jsonb_typeof(entry->bucket) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
      amount:=(entry->>bucket)::numeric;
      IF amount<0 OR amount>1000000000000 OR trunc(amount)<>amount THEN RETURN false; END IF;
    END LOOP;
    IF (entry->>'settledSen')::numeric+(entry->>'creditedSen')::numeric>(entry->>'amountSen')::numeric THEN RETURN false; END IF;
  END LOOP;
  FOR entry IN SELECT * FROM jsonb_array_elements(value->'inventory') LOOP
    FOREACH bucket IN ARRAY ARRAY['quantity','valueSen'] LOOP
      IF jsonb_typeof(entry->bucket) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
      amount:=(entry->>bucket)::numeric;
      IF amount<0 OR amount>1000000000000 OR trunc(amount)<>amount THEN RETURN false; END IF;
    END LOOP;
    IF (entry->>'quantity')::numeric=0 AND (entry->>'valueSen')::numeric<>0 THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE TABLE accounting.documents (
  workspace_id uuid NOT NULL,
  product text NOT NULL CHECK(product='accounting-cloud'),
  generation integer NOT NULL CHECK(generation>0),
  state jsonb NOT NULL CHECK(accounting.valid_state(state)),
  PRIMARY KEY(workspace_id,product,generation),
  FOREIGN KEY(workspace_id,product) REFERENCES platform.workspaces(id,product) ON DELETE CASCADE
);
ALTER TABLE accounting.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.documents FORCE ROW LEVEL SECURITY;
CREATE POLICY scoped_rows ON accounting.documents USING (
  workspace_id::text=current_setting('labs.workspace',true) AND product=current_setting('labs.product',true)
  AND generation::text=current_setting('labs.generation',true)
) WITH CHECK (
  workspace_id::text=current_setting('labs.workspace',true) AND product=current_setting('labs.product',true)
  AND generation::text=current_setting('labs.generation',true)
);
DO $$ BEGIN
  EXECUTE format('CREATE POLICY migration_owner ON accounting.documents TO %I USING (true) WITH CHECK (true)',current_user);
END $$;

CREATE FUNCTION accounting.preserve_posted_journals() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(OLD.state->'journals') old_j
    WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.state->'journals') new_j WHERE new_j=old_j)) THEN
    RAISE EXCEPTION 'Posted journals are immutable; append a controlled reversal';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_posted_journals BEFORE UPDATE ON accounting.documents
FOR EACH ROW EXECUTE FUNCTION accounting.preserve_posted_journals();
