$login = Invoke-RestMethod -Uri http://localhost:4000/api/v1/auth/login -Method Post -ContentType "application/json" -Body '{"username":"alice","password":"secret123"}'
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }

$saveTz = Invoke-RestMethod -Uri http://localhost:4000/api/v1/config/settings -Method Post -Headers $headers -ContentType "application/json" -Body '{"timezone":"Asia/Tokyo"}'
$getTz = Invoke-RestMethod -Uri http://localhost:4000/api/v1/config/settings -Method Get -Headers $headers
Write-Output "TZ_SET:" $getTz.timezone
