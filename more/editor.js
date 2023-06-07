var aceEditor = {
    editor : null,
    initEditor: function (value,language) {
        aceEditor.editor = ace.edit("code-editor");
        if(matchMedia('(prefers-color-scheme: dark)').matches)
            aceEditor.editor.setTheme("ace/theme/tomorrow_night");
        else
            aceEditor.editor.setTheme("ace/theme/sqlserver");

        aceEditor.editor.session.setMode(`ace/mode/${language}`);
        aceEditor.editor.setValue(value, -1);
        //aceEditor.editor.session.setUseWrapMode(true);
        aceEditor.editor.session.setTabSize(4);
        aceEditor.editor.session.setUseSoftTabs(true);
        aceEditor.editor.setShowPrintMargin(false);
        aceEditor.editor.setReadOnly(true);
        aceEditor.editor.setOptions({
			maxLines: Infinity
		});
    },
    getValue : function (){
        return aceEditor.editor?.getValue() ?? "";
    },
    appendValue:function(value){
        aceEditor.editor?.insert(value);
    }
};