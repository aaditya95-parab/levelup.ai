$loginBody = @{ email = "test@test.com"; password = "test1234" } | ConvertTo-Json
try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResp.token
    Write-Host "Login OK, token: $($token.Substring(0,20))..."

    $aiBody = @{
        goals = @("coding", "fitness")
        level = "intermediate"
        dailyTime = 90
        weaknesses = @("consistency")
        preferredTime = "morning"
        pastPerformance = @{
            streak = 3
            completionRate = 60
            recentMissedTasks = 1
        }
    } | ConvertTo-Json -Depth 5

    $headers = @{ Authorization = "Bearer $token" }
    $aiResp = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/generate-quests" -Method POST -Body $aiBody -ContentType "application/json" -Headers $headers
    $aiResp | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $_"
    Write-Host $_.Exception.Response
}
