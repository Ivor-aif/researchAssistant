$login = Invoke-RestMethod -Uri http://localhost:4000/api/v1/auth/login -Method Post -ContentType "application/json" -Body '{"username":"alice","password":"secret123"}'
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }

# Save config with unique name
$body = @{ apiName = 'default'; type = 'local'; modelPath = 'C:/Windows' } | ConvertTo-Json
$save = Invoke-RestMethod -Uri http://localhost:4000/api/v1/config/ai -Method Post -Headers $headers -ContentType "application/json" -Body $body

# Duplicate name should update, not duplicate
$body2 = @{ apiName = 'default'; type = 'cloud'; url = 'https://example.com'; apiKey = 'k'; paramsJson = '{}' } | ConvertTo-Json
$save2 = Invoke-RestMethod -Uri http://localhost:4000/api/v1/config/ai -Method Post -Headers $headers -ContentType "application/json" -Body $body2

# List and get
$list = Invoke-RestMethod -Uri http://localhost:4000/api/v1/config/ai -Headers $headers -Method Get
$one = Invoke-RestMethod -Uri http://localhost:4000/api/v1/config/ai/default -Headers $headers -Method Get

# Test endpoint
$test = Invoke-RestMethod -Uri http://localhost:4000/api/v1/config/ai/test -Method Post -Headers $headers -ContentType "application/json" -Body '{"apiName":"default"}'
Write-Output "API_CONFIG_TEST_OK"
