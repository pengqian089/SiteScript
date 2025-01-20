// noinspection t


let layImConfig = {
    contactsPanel: {
        showFriend: true,
        showGroup: true,
        minStatus: true,
    },
    pageurl: {
        // 查看更多聊天记录
        chatlog: "/chat/record"
    },
    copyright: true,
    isAudio: true,
    // 初始化接口
    init: {
        url: "/chat/init"
    },
    min: true,
    theme: 'dark',
    // 群成员接口
    members: {
        url: "/chat/groupMembers",
        type: "get",
        data: {}
    },

    tool: [
        {
            alias: "code",
            title: "代码",
            icon: "&#xe64e;"
        }
    ]
};


layui.config({
    layimPath: `${dpzOption.CDNBaseAddress}/lib/layim/`,
    layimResPath: `${dpzOption.CDNBaseAddress}/lib/layim/res/`,
}).extend({
    layim: `${dpzOption.CDNBaseAddress}/lib/layim/layim`
}).use(["layim", "layer"], async function () {
    if (layui.device().mobile === true) {
        return;
    }
    let layim = layui.layim,
        layer = layui.layer;

    layim.config(layImConfig);
    layim.on("tool(code)",
        function (insert) {
            layer.prompt({
                    title: "插入代码",
                    formType: 2,
                    shade: 0
                },
                function (text, index) {
                    layer.close(index);
                    insert("[pre class=layui-code]" + text + "[/pre]");
                });
        });

    layim.on("sign",
        async function (value) {
            try {
                const formData = new FormData();
                formData.append("sign", value);
                const response = await fetch("/Account/UpdateSign", {
                    method: "POST",
                    body: formData
                });
                const result = await response.json();
                if (!result.success) {
                    layer.msg(result.msg);
                }
            } catch (fetchError) {
                console.error(fetchError);
            }
        });

    let chatConnection = await getSignalRConnection("/chatHub");
    let robotConnection = await getSignalRConnection("/robotChat");

    chatConnection.on("ReceiveMessage", function (res) {
        res["timestamp"] = res["timestamp"] * 1000;
        layim.getMessage(res);
    });



    robotConnection.on("Answer", function (res) {
        //res["timestamp"] = res["timestamp"] * 1000;
        console.log(res);
        layim.getMessage(res);
    });

    robotConnection.on("SystemError",function (res){
        console.error(res);
        layim.getMessage(res);
    });
    chatConnection.on("System", function (res) {
        if (res.code < 0) {
            outPutError(res.content);
            chatConnection.stop();
        } else if (res.code === 0 && !res.isGuest) {
            layer.msg(`${res.user.name}下线了`);
            layim.setFriendStatus(res.user.id, "offline");
        } else if (res.code === 1) {
            layer.msg(`${res.user.name}上线了`);
            layim.setFriendStatus(res.user.id, "online");
        }
    });

    layim.on("sendMessage", sendMessage);
    layim.on('viewMmembers', loadMembers);

    async function sendMessage(data){
        const receiverId = data.receiver.id;
        const type = data.receiver.type;
        const content = data.user.content;

        try {
            if(receiverId === "kefu"){
                await robotConnection.invoke("SendMessage", content);
            }
            if(receiverId === "e0a82f97-d01d-43c0-a257-97998003e8b9"){
                await robotConnection.invoke("SendMessageToChatGpt", content);
            }
            else if (type === "friend") {
                await chatConnection.invoke("SendMessageToUser", receiverId, content);
            }
            else if (type === "group") {
                await chatConnection.invoke("SendMessageToGroup", receiverId, content);
            }

        }
        catch (invokeError) {
            console.error(invokeError);
        }
    }
});


async function loadMembers(data){
    let request = await fetch(`/chat/groupMembers/${data.receiver.id}`,{method:"GET"});
    let result = await request.json();
    data.render(result.data);
}


async function getSignalRConnection(url) {
    let connection = new signalR
        .HubConnectionBuilder()
        .withUrl(url,
            {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
            }
        )
        .withAutomaticReconnect()
        .build();
    try {
        await connection.start();
    } catch (e) {
        console.error(e);
    }
    return connection;
}