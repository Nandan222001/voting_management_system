@echo off
REM Create Superadmin User Script for Windows
REM Usage: create_superadmin.bat [--email EMAIL] [--password PASSWORD] [--name NAME]

setlocal enabledelayedexpansion

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo X Python is not installed
    exit /b 1
)

REM Check if virtual environment is active
if "%VIRTUAL_ENV%"=="" (
    echo. Virtual environment is not active. Attempting to activate...
    if exist "venv\Scripts\activate.bat" (
        call venv\Scripts\activate.bat
    ) else if exist ".venv\Scripts\activate.bat" (
        call .venv\Scripts\activate.bat
    ) else (
        echo X Could not find virtual environment
        exit /b 1
    )
)

REM Run the Python script with all arguments
python create_superadmin.py %*
