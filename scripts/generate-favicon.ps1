$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root "app\icon.png"
$dest = Join-Path $root "public\favicon.ico"

Add-Type -AssemblyName System.Drawing

$png = [System.Drawing.Image]::FromFile($src)
$sizes = @(16, 32, 48)

# Buat ikon multi-ukuran sederhana (32px utama untuk tab browser).
$bmp = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($png, 0, 0, 32, 32)

$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$stream = [System.IO.File]::Open($dest, [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()

$icon.Dispose()
$bmp.Dispose()
$png.Dispose()
$g.Dispose()

Write-Output "Generated $dest"
