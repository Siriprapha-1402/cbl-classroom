$body = '{"username":"69219100001","password":"69219100001"}'
$resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
Write-Host "Login OK!"
Write-Host "  ชื่อ: $($resp.user.name)"
Write-Host "  รหัส: $($resp.user.student_id)"
Write-Host "  ห้อง: $($resp.user.class_name)"
Write-Host "  Role: $($resp.user.role)"
