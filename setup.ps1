[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Get-NodeVersion {
    try {
        $versionOutput = & node --version 2>$null
        if (-not $versionOutput) {
            return $null
        }
        return [version]($versionOutput.TrimStart('v'))
    } catch {
        return $null
    }
}

function Ensure-Node {
    $minimumVersion = [version]'18.17.0'
    $nodeVersion = Get-NodeVersion

    if ($null -ne $nodeVersion -and $nodeVersion -ge $minimumVersion) {
        Write-Host "Node.js $nodeVersion detected." -ForegroundColor Green
        return
    }

    Write-Host "Node.js $minimumVersion or later is required. Installing the latest LTS release..."
    $wingetCmd = Get-Command winget -ErrorAction SilentlyContinue

    if (-not $wingetCmd) {
        throw "winget is not available. Please install Node.js LTS from https://nodejs.org/en/download manually, then re-run this script."
    }

    $wingetArgs = @(
        'install',
        '--id', 'OpenJS.NodeJS.LTS',
        '--exact',
        '--silent',
        '--accept-source-agreements',
        '--accept-package-agreements'
    )

    Write-Host "Downloading and installing Node.js LTS via winget..."
    $process = Start-Process -FilePath 'winget' -ArgumentList $wingetArgs -NoNewWindow -Wait -PassThru

    if ($process.ExitCode -ne 0) {
        throw "winget failed to install Node.js (exit code $($process.ExitCode))."
    }

    $nodeVersion = Get-NodeVersion
    if ($null -eq $nodeVersion) {
        throw "Node.js was installed but is not available in the current session. Close this PowerShell window, open a new one, and run the script again."
    }

    if ($nodeVersion -lt $minimumVersion) {
        throw "Node.js $nodeVersion detected after installation, but version $minimumVersion or later is required."
    }

    Write-Host "Node.js $nodeVersion installed successfully." -ForegroundColor Green
}

try {
    Write-Section 'Prakriti Odyssey Setup'
    Set-Location -LiteralPath $PSScriptRoot

    if (-not (Test-Path 'package.json')) {
        throw "package.json not found. Run setup.ps1 from the project root."
    }

    Write-Section 'Checking Node.js'
    Ensure-Node

    Write-Section 'Installing npm dependencies'
    & npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed with exit code $LASTEXITCODE."
    }

    Write-Section 'All Set'
    Write-Host "Dependencies are installed. You can now run 'npm run dev' to start the development server." -ForegroundColor Green
    Write-Host "If you set environment variables, add them to a .env.local file before starting the server."
} catch {
    Write-Error $_
    exit 1
}
