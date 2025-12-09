# 注册并登录
$register = Invoke-RestMethod -Uri http://localhost:4000/api/v1/auth/register -Method Post -ContentType "application/json" -Body '{"username":"smoke","password":"secret123"}'
$login = Invoke-RestMethod -Uri http://localhost:4000/api/v1/auth/login -Method Post -ContentType "application/json" -Body '{"username":"smoke","password":"secret123"}'
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }

# 创建项目
$proj = Invoke-RestMethod -Uri http://localhost:4000/api/v1/projects -Method Post -Headers $headers -ContentType "application/json" -Body '{"name":"Smoke项目","description":"desc"}'

# 创建方向
$dirBody = @{ projectId = $proj.id; name = '方向A'; description = 'D' } | ConvertTo-Json
$dir = Invoke-RestMethod -Uri http://localhost:4000/api/v1/directions -Method Post -Headers $headers -ContentType "application/json" -Body $dirBody

# 设置与测试AI配置
$cfg = Invoke-RestMethod -Uri http://localhost:4000/api/v1/config/ai -Method Post -Headers $headers -ContentType "application/json" -Body '{"type":"local","modelPath":"C:/Windows"}'
$test = Invoke-RestMethod -Uri http://localhost:4000/api/v1/config/ai/test -Method Post -Headers $headers

Write-Output "OK"
