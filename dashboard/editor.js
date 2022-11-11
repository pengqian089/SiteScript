

function initEditor(id,value) {
    let editor = ace.edit(id);
    editor.setTheme("ace/theme/tomorrow_night");
    editor.session.setMode("ace/mode/markdown");
    editor.setValue(value, -1);
    editor.session.setUseWrapMode(true);
    editor.session.setTabSize(4);
    editor.session.setUseSoftTabs(true);
    editor.setShowPrintMargin(false);
    // editor.session.on('change', function(delta) {
    //     let markdown = document.getElementById("hide-markdown");
    //     markdown.value = editor.getValue();
    // });
}