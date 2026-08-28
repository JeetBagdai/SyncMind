@echo off
echo ===================================================
echo      SyncMind Database Utility: Clear Memory
echo ===================================================
echo.
echo Connecting to local rqlite cluster on port 4001...

python -c "import pyrqlite.dbapi2 as dbapi2; conn = dbapi2.connect(host='127.0.0.1', port=4001); c = conn.cursor(); c.execute('DELETE FROM messages'); print('--> Successfully deleted all records from the messages table.')"

echo.
echo NOTE: If old messages still appear in the UI, it means your browser has cached them.
echo Open the browser console (F12) and run: clearSyncMindMemory()
echo.
pause
