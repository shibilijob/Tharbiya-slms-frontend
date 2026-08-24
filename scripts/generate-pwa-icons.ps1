Add-Type -AssemblyName System.Drawing

$frontendRoot = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $frontendRoot "src\assets\logo.png"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source logo not found at $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Source image loaded: $($srcImg.Width)x$($srcImg.Height)"

function Export-ResizedPng {
    param(
        [System.Drawing.Image]$source,
        [int]$width,
        [int]$height,
        [string]$outputPath,
        [bool]$maskable = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($maskable) {
        # Background color matching the app theme / creamy background #FAF8F2
        $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 250, 248, 242))
        $g.FillRectangle($bgBrush, 0, 0, $width, $height)
        $bgBrush.Dispose()

        # Safe area padding (10% padding on each side)
        $pad = [int]($width * 0.10)
        $targetW = $width - (2 * $pad)
        $targetH = $height - (2 * $pad)
        $g.DrawImage($source, $pad, $pad, $targetW, $targetH)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.DrawImage($source, 0, 0, $width, $height)
    }

    $g.Dispose()

    # Ensure parent dir exists
    $parent = Split-Path -Parent $outputPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $outputPath ($width x $height)"
}

$publicDir = Join-Path $frontendRoot "public"

Export-ResizedPng -source $srcImg -width 192 -height 192 -outputPath (Join-Path $publicDir "pwa-192x192.png")
Export-ResizedPng -source $srcImg -width 512 -height 512 -outputPath (Join-Path $publicDir "pwa-512x512.png")
Export-ResizedPng -source $srcImg -width 192 -height 192 -outputPath (Join-Path $publicDir "pwa-maskable-192x192.png") -maskable $true
Export-ResizedPng -source $srcImg -width 512 -height 512 -outputPath (Join-Path $publicDir "pwa-maskable-512x512.png") -maskable $true
Export-ResizedPng -source $srcImg -width 180 -height 180 -outputPath (Join-Path $publicDir "apple-touch-icon.png")
Export-ResizedPng -source $srcImg -width 64 -height 64 -outputPath (Join-Path $publicDir "favicon.png")
Export-ResizedPng -source $srcImg -width 32 -height 32 -outputPath (Join-Path $publicDir "favicon-32x32.png")
Export-ResizedPng -source $srcImg -width 16 -height 16 -outputPath (Join-Path $publicDir "favicon-16x16.png")
Export-ResizedPng -source $srcImg -width 1024 -height 1024 -outputPath (Join-Path $publicDir "logo.png")

$srcImg.Dispose()
Write-Host "All PWA and favicon icons generated successfully!"
