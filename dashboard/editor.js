var aceEditor = {
    editor : null,
    initEditor: function (id, value) {
        aceEditor.editor = ace.edit(id);
        aceEditor.editor.setTheme("ace/theme/tomorrow_night");
        aceEditor.editor.session.setMode("ace/mode/markdown");
        aceEditor.editor.setValue(value, -1);
        aceEditor.editor.session.setUseWrapMode(true);
        aceEditor.editor.session.setTabSize(4);
        aceEditor.editor.session.setUseSoftTabs(true);
        aceEditor.editor.setShowPrintMargin(false);
        // editor.session.on('change', function(delta) {
        //     let markdown = document.getElementById("hide-markdown");
        //     markdown.value = editor.getValue();
        // });
    },
    initHtmlEditor:function(id,value){
        aceEditor.editor = ace.edit(id);
        aceEditor.editor.setTheme("ace/theme/tomorrow_night");
        aceEditor.editor.session.setMode("ace/mode/html");
        aceEditor.editor.setValue(value, -1);
        aceEditor.editor.session.setUseWrapMode(true);
        aceEditor.editor.session.setTabSize(4);
        aceEditor.editor.session.setUseSoftTabs(true);
        aceEditor.editor.setShowPrintMargin(false);
    },
    getValue : function (){
        return aceEditor.editor?.getValue() ?? "";
    },
    appendValue:function(value){
        aceEditor.editor?.insert(value);
    }
};

