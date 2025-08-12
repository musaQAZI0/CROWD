@echo off
echo Testing All APIs...
echo.

echo 1. Testing Health Check:
curl -s http://localhost:3001/api/health
echo.
echo.

echo 2. Testing Public Index:
curl -s http://localhost:3001/api/index/public
echo.
echo.

echo 3. Testing Trending Events:
curl -s http://localhost:3001/api/index/trending
echo.
echo.

echo 4. Testing Featured Events:
curl -s http://localhost:3001/api/index/featured
echo.
echo.

echo 5. Testing Login (should work):
curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"testapi@example.com\",\"password\":\"TestPass123!\"}" http://localhost:3001/api/auth/login
echo.
echo.

echo 6. Testing Dashboard Without Token (should fail):
curl -s http://localhost:3001/api/index/dashboard
echo.
echo.

echo All API tests completed!
pause