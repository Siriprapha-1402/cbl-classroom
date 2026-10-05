$body = '{"username":"teacher01","password":"password123"}'
$resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
$role = $resp.user.role
$name = $resp.user.name
Write-Host "Login OK - Role: $role, Name: $name"

# Test student login
$body2 = '{"username":"student01","password":"password123"}'
$resp2 = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $body2 -ContentType 'application/json'
$sname = $resp2.user.name
Write-Host "Student Login OK - Name: $sname"

# Test health
$health = Invoke-RestMethod -Uri 'http://localhost:5000/api/health'
Write-Host "Health: $($health.status)"
