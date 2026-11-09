CREATE SCHEMA platform;
CREATE TABLE platform.workspaces (
  id uuid PRIMARY KEY, product text NOT NULL, generation integer NOT NULL DEFAULT 1 CHECK(generation>0),
  expires_at timestamptz NOT NULL, UNIQUE(id,product)
);
CREATE TABLE platform.sessions (
  token_hash text PRIMARY KEY CHECK(length(token_hash)=64), workspace_id uuid NOT NULL, product text NOT NULL,
  role text NOT NULL CHECK(role IN ('customer','kitchen','cashier','manager','viewer')),
  customer_id uuid NOT NULL, expires_at timestamptz NOT NULL,
  window_at timestamptz NOT NULL DEFAULT now(), requests integer NOT NULL DEFAULT 0,
  FOREIGN KEY(workspace_id,product) REFERENCES platform.workspaces(id,product) ON DELETE CASCADE
);
CREATE TABLE platform.documents (
  workspace_id uuid NOT NULL, product text NOT NULL, generation integer NOT NULL CHECK(generation>0), state jsonb NOT NULL,
  PRIMARY KEY(workspace_id,product,generation),
  FOREIGN KEY(workspace_id,product) REFERENCES platform.workspaces(id,product) ON DELETE CASCADE
);
CREATE TABLE platform.requests (
  workspace_id uuid NOT NULL, product text NOT NULL, generation integer NOT NULL, request_id uuid NOT NULL,
  input_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(workspace_id,product,generation,request_id),
  FOREIGN KEY(workspace_id,product) REFERENCES platform.workspaces(id,product) ON DELETE CASCADE
);
CREATE TABLE platform.audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, workspace_id uuid NOT NULL, product text NOT NULL,
  generation integer NOT NULL, action text NOT NULL, role text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(workspace_id,product) REFERENCES platform.workspaces(id,product) ON DELETE CASCADE
);
CREATE INDEX sessions_expiry ON platform.sessions(expires_at);
CREATE INDEX workspace_expiry ON platform.workspaces(expires_at);
CREATE INDEX audit_scope ON platform.audit(workspace_id,product,generation);

ALTER TABLE platform.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.workspaces FORCE ROW LEVEL SECURITY;
CREATE POLICY workspace_scope ON platform.workspaces USING (
  id::text=current_setting('labs.workspace',true) AND product=current_setting('labs.product',true)
) WITH CHECK (id::text=current_setting('labs.workspace',true) AND product=current_setting('labs.product',true));
ALTER TABLE platform.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY session_scope ON platform.sessions USING (
  token_hash=current_setting('labs.token',true) AND product=current_setting('labs.product',true)
) WITH CHECK (token_hash=current_setting('labs.token',true) AND product=current_setting('labs.product',true)
  AND workspace_id::text=current_setting('labs.workspace',true));

DO $$ DECLARE name text; BEGIN
  FOREACH name IN ARRAY ARRAY['documents','requests','audit'] LOOP
    EXECUTE format('ALTER TABLE platform.%I ENABLE ROW LEVEL SECURITY',name);
    EXECUTE format('ALTER TABLE platform.%I FORCE ROW LEVEL SECURITY',name);
    EXECUTE format('CREATE POLICY scoped_rows ON platform.%I USING (workspace_id::text=current_setting(''labs.workspace'',true) AND product=current_setting(''labs.product'',true) AND generation::text=current_setting(''labs.generation'',true)) WITH CHECK (workspace_id::text=current_setting(''labs.workspace'',true) AND product=current_setting(''labs.product'',true) AND generation::text=current_setting(''labs.generation'',true))',name);
  END LOOP;
END $$;
CREATE FUNCTION platform.active_workspace_count() RETURNS integer
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,platform AS $$
  SELECT count(*)::integer FROM platform.workspaces WHERE expires_at>clock_timestamp()
$$;
REVOKE ALL ON FUNCTION platform.active_workspace_count() FROM PUBLIC;
-- Administrative/migration access is explicit; runtime roles cannot SET ROLE to the owner.
DO $$ DECLARE name text; BEGIN
  FOREACH name IN ARRAY ARRAY['workspaces','sessions','documents','requests','audit'] LOOP
    EXECUTE format('CREATE POLICY migration_owner ON platform.%I TO %I USING (true) WITH CHECK (true)',name,current_user);
  END LOOP;
END $$;
