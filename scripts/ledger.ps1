param([Parameter(ValueFromRemainingArguments = $true)][string[]]$FlutterArgs)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$localFlutter = Join-Path $repoRoot 'tmp/toolchains/flutter/bin/flutter.bat'
$flutterCommand = if (Test-Path $localFlutter) { $localFlutter } else { (Get-Command flutter -ErrorAction Stop).Source }
$env:PUB_CACHE = Join-Path $repoRoot 'tmp/toolchains/pub-cache'
$env:GRADLE_USER_HOME = Join-Path $repoRoot 'tmp/toolchains/gradle-cache'
$env:ANDROID_USER_HOME = Join-Path $repoRoot 'tmp/toolchains/android-user'
$localSdk = Join-Path $repoRoot 'tmp/toolchains/android'
if (Test-Path "$localSdk/platform-tools") { $env:ANDROID_HOME = $localSdk; $env:ANDROID_SDK_ROOT = $localSdk }
$jdkFolder = Get-ChildItem (Join-Path $repoRoot 'tmp/toolchains/java') -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
if ($jdkFolder) { $env:JAVA_HOME = $jdkFolder.FullName; $env:Path = "$env:JAVA_HOME\bin;$env:Path" }
$env:CI = 'true'
Push-Location (Join-Path $repoRoot 'apps/ledger_lite')
try {
    if ($FlutterArgs[0] -eq 'dart') {
        $dartCommand = Join-Path (Split-Path $flutterCommand -Parent) 'dart.bat'
        & $dartCommand @($FlutterArgs | Select-Object -Skip 1)
    } else { & $flutterCommand --suppress-analytics @FlutterArgs }
    $result = $LASTEXITCODE
} finally { Pop-Location }
exit $result
