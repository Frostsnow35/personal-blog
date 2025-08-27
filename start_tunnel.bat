@echo off
echo Starting Cloudflare Tunnel...
if exist "cloudflared.exe" (
    cloudflared.exe tunnel run 3971baeb-dbf5-451c-bf24-d869e96743a3
) else if exist "backend\cloudflared.exe" (
    backend\cloudflared.exe tunnel run 3971baeb-dbf5-451c-bf24-d869e96743a3
) else (
    echo cloudflared.exe not found
    pause
)
