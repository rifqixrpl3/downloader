$root = 'C:\Web Tiktok'

$img = [System.Drawing.Bitmap]::new(256, 256)
$g = [System.Drawing.Graphics]::FromImage($img)
$g.Clear([System.Drawing.Color]::FromArgb(245,239,232))

$brand = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(29,47,44))
$points = @(
    [System.Drawing.Point]::new(82,30),
    [System.Drawing.Point]::new(174,30),
    [System.Drawing.Point]::new(174,104),
    [System.Drawing.Point]::new(206,104),
    [System.Drawing.Point]::new(128,182),
    [System.Drawing.Point]::new(50,104),
    [System.Drawing.Point]::new(82,104)
)
$g.FillPolygon($brand, $points)
$g.FillRectangle($brand, 62, 112, 130, 26)
$g.FillRectangle($brand, 82, 28, 22, 80)
$g.FillRectangle($brand, 128, 28, 22, 80)
$g.FillRectangle($brand, 174, 110, 22, 44)

$img.Save((Join-Path $root 'favicon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$img.Save((Join-Path $root 'favicon-32x32.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$img.Save((Join-Path $root 'favicon-192x192.png'), [System.Drawing.Imaging.ImageFormat]::Png)

# create ico file using a 32x32 bitmap
$icoImg = [System.Drawing.Bitmap]::new(32, 32)
$icoG = [System.Drawing.Graphics]::FromImage($icoImg)
$icoG.Clear([System.Drawing.Color]::FromArgb(245,239,232))
$icoBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(29,47,44))
$icoPoints = @(
    [System.Drawing.Point]::new(10, 6),
    [System.Drawing.Point]::new(22, 6),
    [System.Drawing.Point]::new(22, 16),
    [System.Drawing.Point]::new(26, 16),
    [System.Drawing.Point]::new(16, 28),
    [System.Drawing.Point]::new(6, 16),
    [System.Drawing.Point]::new(10, 16)
)
$icoG.FillPolygon($icoBrush, $icoPoints)
$icoG.FillRectangle($icoBrush, 7, 17, 16, 4)
$icoG.FillRectangle($icoBrush, 10, 6, 3, 10)
$icoG.FillRectangle($icoBrush, 16, 6, 3, 10)
$icoG.FillRectangle($icoBrush, 22, 16, 3, 6)

$icoStream = [System.IO.File]::Open((Join-Path $root 'favicon.ico'), [System.IO.FileMode]::Create)
$icon = [System.Drawing.Icon]::FromHandle($icoImg.GetHicon())
$icon.Save($icoStream)
$icoStream.Close()
$icon.Dispose()
$icoG.Dispose()
$icoImg.Dispose()
$g.Dispose()
$img.Dispose()

Write-Host 'Created favicon files in ' $root
