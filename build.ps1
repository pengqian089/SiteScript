$location = Get-Location
$path = $location.Path
Write-Host $path

[string[]]$jsPaths =
"./core/infrastructure.js",
"./core/init.js",
"./core/layuiInit.js",
"./core/animation.js",
"./core/pjax.js",
"./core/notification.js",
"./core/bookmark.js",
"./core/comment.js",
"./core/mumble.js",
"./core/chat.js"


foreach ($item in $jsPaths)
{
    $filePath = [System.IO.Path]::Combine($path, $item)
    if (![System.IO.File]::Exists($filePath))
    {
        Write-Host "$filePath file not exists" -ForegroundColor red
        return;
    }
}

$inputParameters = [System.String]::Join(" ", $jsPaths)

$execute = "uglifyjs $inputParameters --source-map `"url='site.min.js.map',base='./'`" -o ./site.min.js -c -m"

Invoke-Expression $execute