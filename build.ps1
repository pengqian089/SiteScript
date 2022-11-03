$location = Get-Location
$path = $location.Path
Write-Host $path

[string[]] $jsPaths =
"./core/bookmark.js",
"./core/comment.js",
"./core/infrastructure.js",
"./core/init.js",
"./core/layuiInit.js",
"./core/notification.js",
"./core/pjax.js"

foreach($item in $jsPaths){
    $filePath = [System.IO.Path]::Combine($path,$item)
    if(![System.IO.File]::Exists($filePath)){
        Write-Host "$filePath file not exists" -ForegroundColor red
        return;
    }
}

$inputParameters = [System.String]::Join(" ",$jsPaths)

$execute = "uglifyjs $inputParameters --source-map `"url='site.min.js.map',base='./'`" -o ./site.min.js -c -m"

Invoke-Expression $execute