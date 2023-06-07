# SiteScript


``` powershell
# 压缩 account.js
uglifyjs ./core/account.js --source-map "url='account.js.map',base='./core'" -o ./core/account.min.js -c -m

# 压缩 music.js
uglifyjs ./core/music.js --source-map "url='music.js.map',base='./core'" -o ./core/music.min.js -c -m
```