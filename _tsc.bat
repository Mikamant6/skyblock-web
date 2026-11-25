@echo off
cd /d "%~dp0"
call npx.cmd tsc --noEmit > _tsc.log 2>&1
echo EXIT %ERRORLEVEL% >> _tsc.log
