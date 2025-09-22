@echo off
echo Cleaning up old service worker files...

REM Delete the old service worker file
if exist "sw.js" (
    echo Deleting sw.js...
    del "sw.js"
    echo sw.js deleted successfully
) else (
    echo sw.js not found - already cleaned up
)

REM Delete the conflict resolver (no longer needed)
if exist "js\sw-conflict-resolver.js" (
    echo Deleting sw-conflict-resolver.js...
    del "js\sw-conflict-resolver.js"
    echo sw-conflict-resolver.js deleted successfully
) else (
    echo sw-conflict-resolver.js not found - already cleaned up
)

REM Delete the bridge (no longer needed)
if exist "js\sw-onesignal-bridge.js" (
    echo Deleting sw-onesignal-bridge.js...
    del "js\sw-onesignal-bridge.js"
    echo sw-onesignal-bridge.js deleted successfully
) else (
    echo sw-onesignal-bridge.js not found - already cleaned up
)

echo.
echo Cleanup complete! Your app now uses only the unified OneSignal service worker.
echo.
pause
