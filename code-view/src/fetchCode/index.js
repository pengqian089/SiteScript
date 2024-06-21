import Enumerable from "linq"
import folderIcons from "src/language/folderIcons";
import fileIcons from "src/language/fileIcons";
import languageIcons from "src/language/languageIcons";

let host = "https://localhost:53381";

/**
 * fetch code
 * @param {Array<String>} path
 * */
export async function fetchCodeTree(path = null) {
  let params = [];
  if (path != null && path.length > 0) {
    for (const item of path) {
      params.push(`path=${encodeURIComponent(item)}`);
    }
  }
  let queryString = params.join("&");
  let response = await fetch(`${host}/api/Code?${queryString}`, {
    method: "GET"
  });
  let json = await response.json();
  const isDirectory = json["isDirectory"];
  for (const item of json["directories"]) {
    addIcon(item,isDirectory);
    item["lazy"] = true;
  }
  for (const item of json["files"]) {
    addIcon(item,isDirectory);
  }
  return json;
}

/**
 * 添加图标
 * @param {Object<{name:String,lastUpdateTime:Date,note:String,currentPath:Array<String>}>} node
 * @param {boolean} isDirectory
 * */
function addIcon(node,isDirectory) {
  let folderIcon = Enumerable.from(folderIcons).firstOrDefault(x => {
    let folderNames = x["folderNames"];
    if (x.hasOwnProperty("folderNames") && Array.isArray(folderNames)) {
      return Enumerable.from(folderNames).contains(node.name);
    }
    return false;
  });
  if (folderIcon != null) {
    node["icon"] = `https://dpangzi.com/scripts/icons/${folderIcon["name"]}.svg`;
    return node;
  }

  let list = Enumerable.from(fileIcons);
  let fileIcon = list.firstOrDefault(x => {
    let fileNames = x["fileNames"];
    if (x.hasOwnProperty("fileNames") && Array.isArray(fileNames)) {
      return Enumerable.from(fileNames).contains(node.name);
    }
    return false;
  });
  if (fileIcon != null) {
    node["icon"] = `https://dpangzi.com/scripts/icons/${fileIcon["name"]}.svg`;
    return node;
  }

  let index = node.name.lastIndexOf('.');
  if (index >= 0) {
    let expandName = node.name.substring(index + 1);
    let fileIcon2 = list.firstOrDefault(x => {
      let fileExtensions = x["fileExtensions"];
      if (x.hasOwnProperty("fileExtensions") && Array.isArray(fileExtensions)) {
        return Enumerable.from(fileExtensions).contains(expandName);
      }
      return false;
    });
    if (fileIcon2 != null) {
      node["icon"] = `https://dpangzi.com/scripts/icons/${fileIcon2["name"]}.svg`;
      return node;
    }

    let languageIcon = Enumerable.from(languageIcons).firstOrDefault(x => {
      let ids = x["ids"];
      if (x.hasOwnProperty("ids") && Array.isArray(ids)) {
        return Enumerable.from(ids).contains(expandName);
      }
      return false;
    });
    if (languageIcon != null) {
      node["icon"] = `https://dpangzi.com/scripts/icons/${languageIcon["icon"]["name"]}.svg`;
      return node;
    }
  }

  node["icon"] = `https://dpangzi.com/scripts/icons/${isDirectory ? "folder" : "file"}.svg`;
  return node;
}
