param(
 [Parameter(Mandatory=$true)][string]$Output,
 [Parameter(Mandatory=$true)][string]$Python,
 [string]$DosBox='E:/Programme/Dosbox/DOSBox.exe'
)
$ErrorActionPreference='Stop'
$Python=(Resolve-Path -LiteralPath $Python).Path
$DosBox=(Resolve-Path -LiteralPath $DosBox).Path
$Output=[IO.Path]::GetFullPath($Output)
if(Test-Path -LiteralPath $Output){throw 'Use a new oracle output directory; existing probes are never overwritten.'}
& $Python (Join-Path $PSScriptRoot 'build-dos-findfirst-probe.py') $Output
if($LASTEXITCODE -ne 0){throw 'Probe build failed'}
$config=Join-Path $Output 'probe.conf'
@"
[sdl]
fullscreen=false
output=surface
[dosbox]
machine=svga_s3
[cpu]
cycles=max
[mixer]
nosound=true
[autoexec]
mount c "$Output"
c:
call probes.bat
exit
"@ | Set-Content -Encoding ascii -LiteralPath $config
$oldVideo=$env:SDL_VIDEODRIVER;$oldAudio=$env:SDL_AUDIODRIVER
try{
 $env:SDL_VIDEODRIVER='dummy';$env:SDL_AUDIODRIVER='dummy'
 $probe=Start-Process -FilePath $DosBox -ArgumentList "-noconsole -conf `"$config`"" -WorkingDirectory $Output -WindowStyle Hidden -RedirectStandardOutput (Join-Path $Output 'dosbox-out.log') -RedirectStandardError (Join-Path $Output 'dosbox-error.log') -PassThru
}finally{$env:SDL_VIDEODRIVER=$oldVideo;$env:SDL_AUDIODRIVER=$oldAudio}
Write-Output "DOSBox oracle PID=$($probe.Id)"
if(!$probe.WaitForExit(30000)){throw "Oracle process is still live: PID=$($probe.Id). Inspect this process before another run; an observation timeout is not process completion."}
if($probe.ExitCode -ne 0){throw "DOSBox failed: exit $($probe.ExitCode)"}
@{dosBoxSha256=(Get-FileHash -LiteralPath $DosBox -Algorithm SHA256).Hash.ToLowerInvariant();configSha256=(Get-FileHash -LiteralPath $config -Algorithm SHA256).Hash.ToLowerInvariant();originalInstallationsMounted=$false;processExited=$true} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $Output 'runtime.json')
& node (Join-Path $PSScriptRoot 'check-dos-findfirst-oracle.mjs') $Output (Join-Path $Output 'report.json')
if($LASTEXITCODE -ne 0){throw 'Oracle report validation failed'}
