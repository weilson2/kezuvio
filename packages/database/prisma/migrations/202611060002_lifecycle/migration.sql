-- Only bounded, expired fictional workspaces can be removed by this function.
CREATE FUNCTION platform.prune_expired() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,platform AS $$
DECLARE removed integer;
BEGIN
  WITH expired AS (
    SELECT id FROM platform.workspaces WHERE expires_at < clock_timestamp()
    ORDER BY expires_at LIMIT 50 FOR UPDATE SKIP LOCKED
  ), deleted AS (
    DELETE FROM platform.workspaces w USING expired e WHERE w.id=e.id
    AND w.expires_at < clock_timestamp() RETURNING w.id
  ) SELECT count(*)::integer INTO removed FROM deleted;
  RETURN removed;
END $$;
REVOKE ALL ON FUNCTION platform.prune_expired() FROM PUBLIC;

CREATE TABLE platform.admission (id boolean PRIMARY KEY DEFAULT true CHECK(id), window_at timestamptz NOT NULL, creates integer NOT NULL);
INSERT INTO platform.admission VALUES(true,clock_timestamp(),0);
CREATE FUNCTION platform.admit_creation() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,platform AS $$
DECLARE count integer;
BEGIN
  UPDATE platform.admission SET creates=CASE WHEN window_at < clock_timestamp()-interval '1 minute' THEN 1 ELSE creates+1 END,
    window_at=CASE WHEN window_at < clock_timestamp()-interval '1 minute' THEN clock_timestamp() ELSE window_at END
  WHERE id=true RETURNING creates INTO count;
  RETURN count<=300;
END $$;
REVOKE ALL ON FUNCTION platform.admit_creation() FROM PUBLIC;
