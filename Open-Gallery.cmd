@echo off
cd /d "%~dp0"
node scripts\open-gallery.mjs
if errorlevel 1 pause
