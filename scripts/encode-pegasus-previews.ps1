param(
    [Parameter(Mandatory=$true)][string]$FramesPath,
    [Parameter(Mandatory=$true)][string]$OutputPath
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationCore
foreach ($clip in @('Walking','Flight')) {
    $encoder = [System.Windows.Media.Imaging.GifBitmapEncoder]::new()
    $frames = @(Get-ChildItem -LiteralPath (Join-Path $FramesPath $clip) -Filter '*.png' -File | Sort-Object Name)
    if ($frames.Count -lt 48) { throw "Incomplete animation $clip" }
    for ($index=0; $index -lt $frames.Count; $index++) {
        $stream = [IO.File]::OpenRead($frames[$index].FullName)
        try {
            $source = [System.Windows.Media.Imaging.BitmapFrame]::Create($stream,[System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
        } finally {
            $stream.Dispose()
        }
        $metadata = [System.Windows.Media.Imaging.BitmapMetadata]::new('gif')
        $delay = [uint16]([math]::Round(($index+1)*100/24)-[math]::Round($index*100/24))
        $metadata.SetQuery('/grctlext/Delay',$delay)
        $metadata.SetQuery('/grctlext/Disposal',[byte]1)
        if ($index -eq 0) {
            $metadata.SetQuery('/appext/application',[Text.Encoding]::ASCII.GetBytes('NETSCAPE2.0'))
            $metadata.SetQuery('/appext/data',[byte[]](3,1,0,0,0))
        }
        $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($source,$null,$metadata,$null))
    }
    $output = Join-Path $OutputPath "$clip.gif"
    $stream = [IO.File]::Create($output)
    try { $encoder.Save($stream) } finally { $stream.Dispose() }
    $gifBytes = [IO.File]::ReadAllBytes($output)
    if (-not [Text.Encoding]::ASCII.GetString($gifBytes).Contains('NETSCAPE2.0')) {
        $tableSize = 0
        if (($gifBytes[10] -band 128) -ne 0) {
            $tableSize = 3 * [int][math]::Pow(2,($gifBytes[10] -band 7)+1)
        }
        $extensionOffset = 13 + $tableSize
        $loopExtension = [byte[]](33,255,11) + [Text.Encoding]::ASCII.GetBytes('NETSCAPE2.0') + [byte[]](3,1,0,0,0)
        $withLoop = [IO.MemoryStream]::new()
        try {
            $withLoop.Write($gifBytes,0,$extensionOffset)
            $withLoop.Write($loopExtension,0,$loopExtension.Length)
            $withLoop.Write($gifBytes,$extensionOffset,$gifBytes.Length-$extensionOffset)
            [IO.File]::WriteAllBytes($output,$withLoop.ToArray())
        } finally { $withLoop.Dispose() }
    }
    $gifBytes = [IO.File]::ReadAllBytes($output)
    $position = 13
    if (($gifBytes[10] -band 128) -ne 0) {
        $position += 3 * [int][math]::Pow(2,($gifBytes[10] -band 7)+1)
    }
    $timedGif = [IO.MemoryStream]::new()
    $timedGif.Write($gifBytes,0,$position)
    $frameIndex = 0
    $controlFlags = [byte]4
    $transparentIndex = [byte]0
    try {
        while ($position -lt $gifBytes.Length) {
            $start = $position
            $marker = $gifBytes[$position]
            if ($marker -eq 59) {
                $timedGif.WriteByte(59)
                break
            }
            if ($marker -eq 33) {
                $label = $gifBytes[$position+1]
                $position += 2
                do {
                    $blockSize = $gifBytes[$position]
                    $position += 1 + $blockSize
                } while ($blockSize -gt 0)
                if ($label -eq 249) {
                    $controlFlags = $gifBytes[$start+3]
                    $transparentIndex = $gifBytes[$start+6]
                } else {
                    $timedGif.Write($gifBytes,$start,$position-$start)
                }
            } elseif ($marker -eq 44) {
                $frameDelay = [int]([math]::Round(($frameIndex+1)*100/24)-[math]::Round($frameIndex*100/24))
                $frameControl = [byte[]](33,249,4,$controlFlags,($frameDelay -band 255),($frameDelay -shr 8),$transparentIndex,0)
                $timedGif.Write($frameControl,0,$frameControl.Length)
                $localFlags = $gifBytes[$position+9]
                $position += 10
                if (($localFlags -band 128) -ne 0) {
                    $position += 3 * [int][math]::Pow(2,($localFlags -band 7)+1)
                }
                $position += 1
                do {
                    $blockSize = $gifBytes[$position]
                    $position += 1 + $blockSize
                } while ($blockSize -gt 0)
                $timedGif.Write($gifBytes,$start,$position-$start)
                $frameIndex += 1
                $controlFlags = [byte]4
                $transparentIndex = [byte]0
            } else {
                throw "Invalid GIF block at byte $position"
            }
        }
        if ($frameIndex -ne $frames.Count) { throw 'Incomplete timed GIF' }
        [IO.File]::WriteAllBytes($output,$timedGif.ToArray())
    } finally { $timedGif.Dispose() }
    $checkStream = [IO.File]::OpenRead($output)
    try {
        $decoder = [System.Windows.Media.Imaging.GifBitmapDecoder]::new($checkStream,[System.Windows.Media.Imaging.BitmapCreateOptions]::None,[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
        if ($decoder.Frames.Count -ne $frames.Count) { throw 'GIF frame count mismatch' }
        $duration = 0
        foreach ($frame in $decoder.Frames) {
            $duration += [int]$frame.Metadata.GetQuery('/grctlext/Delay')
        }
        if ([math]::Abs($duration/100-$frames.Count/24) -gt .02) { throw 'GIF timing mismatch' }
        Write-Output "$clip encoded $($decoder.Frames.Count) frames"
    } finally { $checkStream.Dispose() }
}
