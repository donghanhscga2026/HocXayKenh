$PORT = 3000
$GAS_URL = "https://script.google.com/macros/s/AKfycbwd9qsO3FlcwNMOWBqPm5c7NWb0d5c8hMCd5o2YzeXlFOQMVayvHErqcUcWHrelojIbeA/exec"

Write-Host "CORS Proxy running on localhost:$PORT" -ForegroundColor Green

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$PORT/")
$listener.Start()

while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $($request.HttpMethod)" -ForegroundColor Cyan

    $response.Headers["Access-Control-Allow-Origin"] = "*"
    $response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    $response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    $response.ContentType = "application/json"

    if ($request.HttpMethod -eq "OPTIONS") {
        $response.StatusCode = 200
        $response.ContentLength64 = 0
        $response.Close()
        continue
    }

    if ($request.HttpMethod -eq "POST") {
        $reader = New-Object System.IO.StreamReader($request.InputStream)
        $body = $reader.ReadToEnd()
        $reader.Close()

        $webClient = New-Object System.Net.WebClient
        $webClient.Headers["Content-Type"] = "application/json"
        $gasResponse = $webClient.UploadString($GAS_URL, "POST", $body)
        
        $response.StatusCode = 200
        $responseBytes = [System.Text.Encoding]::UTF8.GetBytes($gasResponse)
        $response.ContentLength64 = $responseBytes.Length
        $response.OutputStream.Write($responseBytes, 0, $responseBytes.Length)
        $response.Close()
    }
}
