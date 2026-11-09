param([ValidateSet('setup','provision','start','stop','status')][string]$Action = 'status')
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$root = Join-Path $repo '.local/postgresql'
$bin = Join-Path $root 'runtime/pgsql/bin'
$data = Join-Path $root 'data'
$port = 55432
function Invoke-Pg([string]$Name, [string[]]$PgArgs) {
    & (Join-Path $bin "$Name.exe") @PgArgs
    if ($LASTEXITCODE -ne 0) { throw "$Name failed (exit $LASTEXITCODE)" }
}
function Write-New([string]$Path, [string]$Content) {
    $stream = [IO.File]::Open($Path, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write)
    try { $bytes = [Text.Encoding]::UTF8.GetBytes($Content); $stream.Write($bytes,0,$bytes.Length) } finally { $stream.Dispose() }
}
function Secret { [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant() }
if (!(Test-Path (Join-Path $bin 'pg_ctl.exe'))) { throw 'Verified PostgreSQL binaries are required under .local/postgresql/runtime/pgsql.' }
if ($Action -eq 'setup') {
    if (Test-Path $data) { throw 'Data directory exists. Setup will never overwrite or reinitialize it.' }
    if (Test-Path (Join-Path $root '.env.bootstrap')) { throw 'Bootstrap credentials already exist. Inspect previous setup before proceeding.' }
    $hash = (Get-FileHash (Join-Path $root 'postgresql-18.6-5-windows-x64-binaries.zip') -Algorithm SHA256).Hash
    if ($hash -ne 'e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2') { throw 'Archive integrity verification failed.' }
    $probe = [Net.Sockets.TcpClient]::new()
    try { $attempt=$probe.ConnectAsync('127.0.0.1',$port); $occupied=$attempt.Wait(500) -and $probe.Connected } catch { $occupied=$false } finally { $probe.Dispose() }
    if ($occupied) { throw "Port $port is already occupied; refusing to reuse an unknown server." }
    # Restrict credentials and database files to this Windows user and SYSTEM.
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl = [Security.AccessControl.DirectorySecurity]::new()
    $acl.SetAccessRuleProtection($true,$false)
    foreach ($sid in @($identity, [Security.Principal.SecurityIdentifier]::new('S-1-5-18'))) {
        $rule=[Security.AccessControl.FileSystemAccessRule]::new($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
        $acl.AddAccessRule($rule)
    }
    Set-Acl -LiteralPath $root -AclObject $acl
    $adminPassword=Secret
    Write-New (Join-Path $root '.env.bootstrap') "PGPASSWORD=$adminPassword`n"
    $passwordFile=Join-Path $root '.init-password'
    Write-New $passwordFile "$adminPassword`n"
    try { Invoke-Pg 'initdb' @('-D',$data,'-U','kezuvio_bootstrap',"--pwfile=$passwordFile",'--auth=scram-sha-256','--encoding=UTF8','--locale=C') }
    finally { if (Test-Path $passwordFile) { Remove-Item -LiteralPath $passwordFile } }
    Add-Content -LiteralPath (Join-Path $data 'postgresql.conf') -Value "`nlisten_addresses = '127.0.0.1'`nport = $port`npassword_encryption = 'scram-sha-256'`nlogging_collector = off`nlog_statement = 'none'`nlog_min_error_statement = 'panic'`n"
    Invoke-Pg 'pg_ctl' @('start','-D',$data,'-l',(Join-Path $root 'server.log'),'-w','-t','30')
}
if ($Action -in @('setup','provision')) {
    $adminPassword=(Get-Content -LiteralPath (Join-Path $root '.env.bootstrap') -Raw).Trim().Substring('PGPASSWORD='.Length)
    $env:PGPASSWORD=$adminPassword
    try {
        foreach ($mode in @('dev','test')) {
            if (Test-Path (Join-Path $root ".env.$mode")) { throw "Credentials for $mode already exist; refusing overwrite." }
        }
        $existing = "SELECT count(*) FROM pg_database WHERE datname IN ('kezuvio_labs_dev','kezuvio_labs_test');" | & (Join-Path $bin 'psql.exe') -h 127.0.0.1 -p $port -U kezuvio_bootstrap -d postgres -v ON_ERROR_STOP=1 -At
        if ($LASTEXITCODE -ne 0 -or $existing.Trim() -ne '0') { throw 'Cannot safely provision: connection failed or a target database already exists.' }
        foreach ($mode in @('dev','test')) {
            $db="kezuvio_labs_$mode"; $owner="labs_${mode}_owner"; $runtime="labs_${mode}_runtime"
            $ownerPassword=Secret; $runtimePassword=Secret
            $sql="CREATE ROLE $owner LOGIN PASSWORD '$ownerPassword' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;`nCREATE ROLE $runtime LOGIN PASSWORD '$runtimePassword' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;`nCREATE DATABASE $db OWNER $owner;`nREVOKE ALL ON DATABASE $db FROM PUBLIC;`nGRANT CONNECT ON DATABASE $db TO $owner, $runtime;"
            $sql | & (Join-Path $bin 'psql.exe') -h 127.0.0.1 -p $port -U kezuvio_bootstrap -d postgres -v ON_ERROR_STOP=1 -q
            if ($LASTEXITCODE -ne 0) { throw "Database creation failed for $mode" }
            Write-New (Join-Path $root ".env.$mode") "DATABASE_URL=postgresql://${runtime}:${runtimePassword}@127.0.0.1:${port}/${db}`nMIGRATION_DATABASE_URL=postgresql://${owner}:${ownerPassword}@127.0.0.1:${port}/${db}`nDATABASE_RUNTIME_ROLE=$runtime`nLABS_ORIGIN=http://127.0.0.1:3000`n"
            Write-New (Join-Path $root ".env.$mode.runtime") "DATABASE_URL=postgresql://${runtime}:${runtimePassword}@127.0.0.1:${port}/${db}`nLABS_ORIGIN=http://127.0.0.1:3000`n"
        }
        'SELECT version(); SHOW listen_addresses; SHOW port;' | & (Join-Path $bin 'psql.exe') -h 127.0.0.1 -p $port -U kezuvio_bootstrap -d postgres -v ON_ERROR_STOP=1
        if ($LASTEXITCODE -ne 0) { throw 'Connection verification failed.' }
    } finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
    Write-Output 'Local PostgreSQL setup complete. Credentials are in protected, Git-ignored environment files. No Windows service or global PATH changes.'
} elseif ($Action -eq 'start') {
    Invoke-Pg 'pg_ctl' @('start','-D',$data,'-l',(Join-Path $root 'server.log'),'-w','-t','30')
} elseif ($Action -eq 'stop') {
    Invoke-Pg 'pg_ctl' @('stop','-D',$data,'-m','smart','-w','-t','30')
} else {
    Invoke-Pg 'pg_ctl' @('status','-D',$data)
    Invoke-Pg 'pg_isready' @('-h','127.0.0.1','-p',"$port")
}
