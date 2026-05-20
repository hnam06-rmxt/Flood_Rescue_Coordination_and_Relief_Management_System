$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $projectRoot ".env"

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $name, $value = $line.Split("=", 2)
    [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim().Trim('"').Trim("'"), "Process")
  }
}

$jdkHome = Join-Path $projectRoot "..\.tools\jdk17\jdk-17.0.18+8"
$jdkHome = [System.IO.Path]::GetFullPath($jdkHome)

if (Test-Path (Join-Path $jdkHome "bin\java.exe")) {
  $env:JAVA_HOME = $jdkHome
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
  Write-Host "Using JAVA_HOME=$env:JAVA_HOME"
} else {
  Write-Host "Bundled JDK not found, using Java from PATH"
}

if (Test-Path (Join-Path $projectRoot "mvnw.cmd")) {
  & "$projectRoot\mvnw.cmd" spring-boot:run
} else {
  & mvn spring-boot:run
}
