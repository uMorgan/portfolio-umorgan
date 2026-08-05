# Servidor local do portfólio para PowerShell usando TcpListener puro
# Serve em http://localhost:8899 sem validação de Host (totalmente compatível com ngrok)
# Uso: .\servir.ps1 ou powershell -ExecutionPolicy Bypass -File servir.ps1

$porta = 8899
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $porta)

try {
    $listener.Start()
    Write-Host "Portfolio rodando em http://localhost:$porta/ (compatível com ngrok)" -ForegroundColor Green
} catch {
    Write-Host "Erro ao iniciar o servidor na porta $porta : $_" -ForegroundColor Red
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".ico"  = "image/x-icon"
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        
        $buffer = New-Object byte[] 4096
        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
        if ($bytesRead -le 0) { $client.Close(); continue }

        $requestText = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
        $lines = $requestText -split "`r`n"
        $requestLine = $lines[0]
        if ([string]::IsNullOrEmpty($requestLine)) { $client.Close(); continue }

        $parts = $requestLine.Split(' ')
        $path = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
        $path = [System.Uri]::UnescapeDataString($path)
        if ($path.Contains("?")) { $path = $path.Substring(0, $path.IndexOf("?")) }
        if ($path -eq "/") { $path = "/index.html" }

        $localPath = Join-Path (Get-Location) ($path.TrimStart('/').Replace('/', '\'))

        if (Test-Path -Path $localPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $fileBytes = [System.IO.File]::ReadAllBytes($localPath)

            $header = "HTTP/1.1 200 OK`r`n" +
                      "Content-Type: $contentType`r`n" +
                      "Content-Length: $($fileBytes.Length)`r`n" +
                      "Cache-Control: no-store, no-cache, must-revalidate, max-age=0`r`n" +
                      "Pragma: no-cache`r`n" +
                      "Expires: 0`r`n" +
                      "Access-Control-Allow-Origin: *`r`n" +
                      "Connection: close`r`n`r`n"
            
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($fileBytes, 0, $fileBytes.Length)
        } else {
            $response404 = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: 28`r`nConnection: close`r`n`r`n404 - Arquivo Nao Encontrado"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($response404)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
        }
        $stream.Flush()
        $client.Close()
    }
} finally {
    $listener.Stop()
}
