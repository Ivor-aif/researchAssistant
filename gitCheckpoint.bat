@echo off
REM gitCheckpoint - One-click Git save, commit and push
REM Automatically use current date as commit message

echo Executing Git operations...

REM Get current date and time for commit message
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set datetime=%%a
set year=%datetime:~0,4%
set month=%datetime:~4,2%
set day=%datetime:~6,2%
set hour=%datetime:~8,2%
set minute=%datetime:~10,2%
set second=%datetime:~12,2%

set commit_message=%year%-%month%-%day% %hour%:%minute%:%second%

echo Commit message: %commit_message%

REM Execute Git operations
git add .
if %errorlevel% neq 0 (
    echo Git add operation failed
    exit /b %errorlevel%
)

git commit -m "%commit_message%"
if %errorlevel% neq 0 (
    echo Git commit operation failed
    exit /b %errorlevel%
)

git push -u gitee master
if %errorlevel% neq 0 (
    echo Git push to gitee operation failed
    exit /b %errorlevel%
)

git push -u github master
if %errorlevel% neq 0 (
    echo Git push to github operation failed
    exit /b %errorlevel%
)

echo Git operations completed!
echo Successfully committed and pushed changes, commit message: %commit_message%