param([string]$ToolRoot=(Join-Path $PSScriptRoot '../../analysis-tools/ghidra-runtime'))
$ErrorActionPreference='Stop'
$ToolRoot=[IO.Path]::GetFullPath($ToolRoot)
$downloads=Join-Path $ToolRoot 'downloads'
New-Item -ItemType Directory -Force -Path $ToolRoot,$downloads | Out-Null
$packages=@(
 @{Name='ghidra_12.1.4_PUBLIC_20260921.zip';Url='https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_12.1.4_build/ghidra_12.1.4_PUBLIC_20260921.zip';Sha256='ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db';Directory='ghidra_12.1.4_PUBLIC'},
 @{Name='OpenJDK21U-jdk_x64_windows_hotspot_21.0.12.1_1.zip';Url='https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jdk_x64_windows_hotspot_21.0.12.1_1.zip';Sha256='f9d6e191ab098c0d416e7d588a24420a8621cd2f4720dab2459b8b7b2d2d8b4e';Directory='jdk-21.0.12.1+1'}
)
foreach($package in $packages){
 $destination=Join-Path $ToolRoot $package.Directory
 if(Test-Path -LiteralPath $destination){Write-Output "Existing installation: $destination";continue}
 $archive=Join-Path $downloads $package.Name
 if(!(Test-Path -LiteralPath $archive)){& curl.exe -L --fail --retry 2 --silent --show-error -o $archive $package.Url;if($LASTEXITCODE -ne 0){throw "Download failed: $($package.Name)"}}
 if((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $package.Sha256){throw "Archive checksum mismatch: $archive"}
 Expand-Archive -LiteralPath $archive -DestinationPath $ToolRoot
}
Write-Output 'Portable tools prepared. No system PATH or JAVA_HOME was changed.'
