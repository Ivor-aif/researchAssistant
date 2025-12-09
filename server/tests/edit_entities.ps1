$login = Invoke-RestMethod -Uri http://localhost:4000/api/v1/auth/login -Method Post -ContentType "application/json" -Body '{"username":"alice","password":"secret123"}'
$t = $login.token
$h = @{ Authorization = "Bearer $t" }

$p = Invoke-RestMethod -Uri http://localhost:4000/api/v1/projects -Method Post -Headers $h -ContentType "application/json" -Body '{"name":"P1","description":"D1"}'
$updP = Invoke-RestMethod -Uri ("http://localhost:4000/api/v1/projects/" + $p.id) -Method Put -Headers $h -ContentType "application/json" -Body '{"name":"P1-new","description":"D1-new"}'

$dBody = @{ projectId = $p.id; name = 'Dir1'; description = 'desc1' } | ConvertTo-Json
$d = Invoke-RestMethod -Uri http://localhost:4000/api/v1/directions -Method Post -Headers $h -ContentType "application/json" -Body $dBody
$updD = Invoke-RestMethod -Uri ("http://localhost:4000/api/v1/directions/" + $d.id) -Method Put -Headers $h -ContentType "application/json" -Body '{"name":"Dir1-new","description":"desc1-new"}'

Write-Output ("UPDATED:" + $updP.name + "," + $updD.name)
