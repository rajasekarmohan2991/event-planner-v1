@echo off
echo "Pushing code to GitHub (Forcing update to match local version)..."
"C:\Program Files\Git\cmd\git.exe" push -u origin main --force
pause
