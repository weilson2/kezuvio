$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if ($repository -ne 'D:\WORKKK\kezuvio') { throw 'This activation is scoped to D:\WORKKK\kezuvio.' }
$source = Join-Path $repository 'docs\six-products\tooling'
$destinations = @{
  'agents' = Join-Path $repository '.codex\agents'
  'skills' = Join-Path $repository '.agents\skills'
}
foreach ($kind in @('agents', 'skills')) {
  $origin = Join-Path $source $kind
  foreach ($file in Get-ChildItem -LiteralPath $origin -Recurse -File) {
    $relative = $file.FullName.Substring($origin.Length).TrimStart('\')
    $target = Join-Path $destinations[$kind] $relative
    if (-not $target.StartsWith($repository + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Target escaped repository.' }
    if (Test-Path -LiteralPath $target) {
      if ((Get-FileHash -LiteralPath $file.FullName).Hash -ne (Get-FileHash -LiteralPath $target).Hash) { throw "Existing project definition differs: $relative. No replacement allowed." }
    } else {
      New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
      Copy-Item -LiteralPath $file.FullName -Destination $target
    }
  }
}
$configuration = Join-Path $repository '.codex\config.toml'
if (Test-Path -LiteralPath $configuration) {
  if ((Get-FileHash -LiteralPath $configuration).Hash -ne (Get-FileHash -LiteralPath (Join-Path $source 'config.example.toml')).Hash) { throw 'Existing configuration differs; merge manually instead of replacing.' }
} else { Copy-Item -LiteralPath (Join-Path $source 'config.example.toml') -Destination $configuration }
Write-Output 'Activated project-only role and skill files and public documentation MCP configuration. No existing definitions, global settings or permissions changed.'
