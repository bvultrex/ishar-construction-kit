param(
 [Parameter(Mandatory=$true)][string]$Capture,
 [string]$ToolRoot=(Join-Path $PSScriptRoot '../../analysis-tools/ghidra-runtime'),
 [string]$OutputRoot=(Join-Path $PSScriptRoot '../../analysis-output/ghidra-smoke')
)
$ErrorActionPreference='Stop'
$Capture=(Resolve-Path -LiteralPath $Capture).Path
$captureHash=(Get-FileHash -LiteralPath $Capture -Algorithm SHA256).Hash.ToLowerInvariant()
$profiles=@{'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7'='ishar1';'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'='ishar2'}
if(!$profiles.ContainsKey($captureHash)){throw 'Unidentified capture. This smoke test only supports the two documented unpacked captures.'}
$ghidraRoot=(Resolve-Path -LiteralPath (Join-Path $ToolRoot 'ghidra_12.1.4_PUBLIC')).Path
$java=(Resolve-Path -LiteralPath (Join-Path $ToolRoot 'jdk-21.0.12.1+1/bin/java.exe')).Path
$runName=$profiles[$captureHash]+'-'+[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss-fff')
$output=Join-Path ([IO.Path]::GetFullPath($OutputRoot)) $runName
$projects=Join-Path $output 'projects'
New-Item -ItemType Directory -Path $projects -Force | Out-Null
# Direct official Java launcher avoids the Windows batch parameter bug with parentheses in paths.
$vmArgs=@(Get-Content -LiteralPath (Join-Path $ghidraRoot 'support/launch.properties') | Where-Object {$_ -match '^VMARGS(?:_WINDOWS)?='} | ForEach-Object {$_.Substring($_.IndexOf('=')+1)})
& $java @vmArgs -Xmx2G -cp (Join-Path $ghidraRoot 'Ghidra/Framework/Utility/lib/Utility.jar') ghidra.Ghidra ghidra.app.util.headless.AnalyzeHeadless $projects $runName -import $Capture -loader BinaryLoader -loader-baseAddr '0000:0000' -processor 'x86:LE:16:Real Mode' -cspec default -noanalysis -scriptPath (Join-Path $PSScriptRoot 'ghidra') -postScript InspectIsharDos.java $output -log (Join-Path $output 'headless.log')
if($LASTEXITCODE -ne 0){throw "Ghidra failed; inspect $output"}
if(!(Test-Path -LiteralPath (Join-Path $output 'instruction-boundaries.csv'))){throw 'Ghidra script did not produce verified-boundary input; exit code alone is not success.'}
if((Get-FileHash -LiteralPath $Capture -Algorithm SHA256).Hash.ToLowerInvariant() -ne $captureHash){throw 'Original capture changed'}
Write-Output "GHIDRA_OUTPUT=$output"
