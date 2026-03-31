@echo off
REM Skill Installer - Windows Batch Script
REM This script sets the working directory to the script's location
REM and then runs the main CLI.

cd /d "%~dp0"
node dist\cli.js %*
