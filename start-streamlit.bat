@echo off
echo 🎯 Starting Professional OMR System...
echo =====================================

echo.
echo 🐍 Checking Python dependencies...
python -c "import streamlit" 2>nul
if errorlevel 1 (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
)

echo.
echo 🚀 Starting Streamlit OMR Application...
echo   URL: http://localhost:8501
echo.
echo Press Ctrl+C to stop the server
echo.

streamlit run run_professional_omr.py
