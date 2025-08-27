@echo off
echo Testing backend connection...
echo.
echo Testing localhost:5000...
curl -s http://localhost:5000/api/health
echo.
echo Testing localhost:5000/api/posts/published...
curl -s http://localhost:5000/api/posts/published
echo.
pause
