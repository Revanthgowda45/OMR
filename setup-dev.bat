@echo off
echo 🚀 Setting up OMR Development Environment...
echo ================================================

echo.
echo 📦 Installing Node.js dependencies...
call npm install

echo.
echo 🐍 Installing Python dependencies...
call pip install -r requirements.txt

echo.
echo ✅ Setup complete!
echo.
echo 🎯 Available commands:
echo   npm run dev          - Start both frontend and backend
echo   npm run dev:client   - Start React frontend only
echo   npm run dev:server   - Start Express backend only
echo   npm run streamlit    - Start Streamlit OMR app
echo   python run_professional_omr.py - Run professional OMR system
echo.
echo 🌐 URLs will be:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo   Streamlit: http://localhost:8501
echo.
pause
