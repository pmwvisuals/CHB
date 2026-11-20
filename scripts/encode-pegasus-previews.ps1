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
    $checkStream = [IO.File]::OpenRead($output)
    try {
        $decoder = [System.Windows.Media.Imaging.GifBitmapDecoder]::new($checkStream,[System.Windows.Media.Imaging.BitmapCreateOptions]::None,[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
        if ($decoder.Frames.Count -ne $frames.Count) { throw 'GIF frame count mismatch' }
        Write-Output "$clip encoded $($decoder.Frames.Count) frames"
    } finally { $checkStream.Dispose() }
}
