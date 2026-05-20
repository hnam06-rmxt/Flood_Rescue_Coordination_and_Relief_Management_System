$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$jdkHome = Join-Path $projectRoot "..\.tools\jdk17\jdk-17.0.18+8"
$jdkHome = [System.IO.Path]::GetFullPath($jdkHome)

if (-not (Test-Path (Join-Path $jdkHome "bin\java.exe"))) {
  throw "JDK 17 not found at: $jdkHome"
}

$env:JAVA_HOME = $jdkHome
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Write-Host "Using JAVA_HOME=$env:JAVA_HOME"
& "$projectRoot\mvnw.cmd" test
