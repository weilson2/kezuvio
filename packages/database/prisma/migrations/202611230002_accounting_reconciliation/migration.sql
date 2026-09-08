CREATE FUNCTION accounting.reconciled_state(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE document jsonb; ledger numeric; cached numeric; inventory numeric;
BEGIN
  IF NOT accounting.valid_state(value) THEN RETURN false; END IF;
  SELECT coalesce(sum((line->>'debitSen')::numeric-(line->>'creditSen')::numeric),0) INTO ledger
    FROM jsonb_array_elements(value->'journals') j CROSS JOIN LATERAL jsonb_array_elements(j->'lines') line
    WHERE line->>'accountId'='inventory';
  SELECT coalesce(sum((item->>'valueSen')::numeric),0) INTO inventory FROM jsonb_array_elements(value->'inventory') item;
  IF ledger<>inventory THEN RETURN false; END IF;
  FOR document IN SELECT * FROM jsonb_array_elements(value->'documents') LOOP
    SELECT coalesce(sum((line->>'debitSen')::numeric-(line->>'creditSen')::numeric),0) INTO ledger
      FROM jsonb_array_elements(value->'journals') j CROSS JOIN LATERAL jsonb_array_elements(j->'lines') line
      WHERE j->>'sourceId'=document->>'id' AND line->>'accountId'=(CASE WHEN document->>'kind'='Invoice' THEN 'receivable' ELSE 'payable' END);
    IF document->>'kind'='Bill' THEN ledger:=-ledger; END IF;
    cached:=CASE WHEN (document->>'voided')::boolean THEN 0 ELSE
      (document->>'amountSen')::numeric-(document->>'settledSen')::numeric-(document->>'creditedSen')::numeric END;
    IF ledger<>cached THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
ALTER TABLE accounting.documents ADD CONSTRAINT accounting_control_reconciliation CHECK(accounting.reconciled_state(state));
