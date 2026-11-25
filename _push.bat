@echo off
cd /d "%~dp0"
git add -A > _push.log 2>&1
git reset -q -- "_*.bat" "_*.log" "_*.txt" "_*.ps1" "_guide_src" "data/petInfo.json" >> _push.log 2>&1
git status --short >> _push.log 2>&1
git commit -F _msg.txt >> _push.log 2>&1
git push >> _push.log 2>&1
echo EXIT %ERRORLEVEL% >> _push.log
