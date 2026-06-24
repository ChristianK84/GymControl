Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\CRamos\Downloads\LogoFullBlend.png"
$resBase = "C:\Users\CRamos\Documents\Github\GymControl\android\app\src\main\res"

$source = [System.Drawing.Image]::FromFile($sourcePath)
$srcW = $source.Width
$srcH = $source.Height

# Portrait 9:16 sizes (width x height)
$portSizes = @(
    @{ name = "mdpi"; w = 480; h = 854 }
    @{ name = "hdpi"; w = 720; h = 1280 }
    @{ name = "xhdpi"; w = 960; h = 1707 }
    @{ name = "xxhdpi"; w = 1440; h = 2560 }
    @{ name = "xxxhdpi"; w = 1920; h = 3413 }
)

# Landscape 16:9 sizes
$landSizes = @(
    @{ name = "ldpi"; w = 427; h = 240 }
    @{ name = "mdpi"; w = 569; h = 320 }
    @{ name = "hdpi"; w = 854; h = 480 }
    @{ name = "xhdpi"; w = 1280; h = 720 }
    @{ name = "xxhdpi"; w = 1920; h = 1080 }
    @{ name = "xxxhdpi"; w = 2560; h = 1440 }
)

# Portrait crop: 9:16 → width narrower, full height
$portCropW = [int]($srcH * 9 / 16)
$portCropX = [int](($srcW - $portCropW) / 2)
$portCrop = $source.Clone([System.Drawing.Rectangle]::new($portCropX, 0, $portCropW, $srcH), $source.PixelFormat)

# Landscape crop: 16:9 → full width, height shorter
$landCropH = [int]($srcW * 9 / 16)
$landCropY = [int](($srcH - $landCropH) / 2)
$landCrop = $source.Clone([System.Drawing.Rectangle]::new(0, $landCropY, $srcW, $landCropH), $source.PixelFormat)

Write-Host "Generating splash images..."

# Portrait
foreach ($size in $portSizes) {
    $path = "$resBase\drawable-port-$($size.name)\splash.png"
    $bmp = New-Object System.Drawing.Bitmap($portCrop, $size.w, $size.h)
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "  $path  ($($size.w)x$($size.h))"
}

# Landscape
foreach ($size in $landSizes) {
    $path = "$resBase\drawable-land-$($size.name)\splash.png"
    $bmp = New-Object System.Drawing.Bitmap($landCrop, $size.w, $size.h)
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "  $path  ($($size.w)x$($size.h))"
}

# Base drawable/splash.png (use portrait mdpi)
$basePath = "$resBase\drawable\splash.png"
$bmp = New-Object System.Drawing.Bitmap($portCrop, 480, 854)
$bmp.Save($basePath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "  $basePath  (480x854)"

$portCrop.Dispose()
$landCrop.Dispose()
$source.Dispose()

Write-Host "Done."
