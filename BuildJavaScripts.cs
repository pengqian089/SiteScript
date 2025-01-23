using System;
using System.Diagnostics;
using System.IO;


// Add-Type -Path .\BuildJavaScripts.cs
// $build = New-Object BuildJavaScripts
// $build.Build()

public class BuildJavaScripts
{
    private readonly string[] _jsPaths = new string[]
    {
        "./core/infrastructure.js",
        "./core/init.js",
        "./core/layuiInit.js",
        "./core/animation.js",
        "./core/pjax.js",
        "./core/notification.js",
        "./core/bookmark.js",
        "./core/comment.js",
        "./core/mumble.js",
        "./core/chat.js",
    };

    public void Build()
    {
        var path = Directory.GetCurrentDirectory();
        foreach (var item in _jsPaths)
        {
            var filePath = Path.Combine(path, item);
            if (!File.Exists(filePath))
            {
                Console.WriteLine("{0} file not exists", filePath);
                return;
            }
            var fileInfo = new FileInfo(filePath);
            Console.WriteLine("{0} checked", fileInfo.FullName);
        }

        var inputParameters = string.Join(" ", _jsPaths);
        var execute = string.Format(
            "uglifyjs {0} --source-map \"url='site.min.js.map',base='./'\" -o ./site.min.js -c -m",
            inputParameters
        );
        var execute2 =
            "uglifyjs ./core/music.js --source-map \"url='music.min.js.map',base='./core'\" -o ./core/music.min.js -c -m";

        RunCommand(execute);
        RunCommand(execute2);
    }

    private static void RunCommand(string command)
    {
        ProcessStartInfo startInfo = new ProcessStartInfo("cmd.exe", "/c " + command)
        {
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        Process process = Process.Start(startInfo);
        string output = process.StandardOutput.ReadToEnd();
        process.WaitForExit();
        Console.WriteLine(output);
    }
}
