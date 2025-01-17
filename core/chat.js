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

    title: "聊天室",
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
    layimAssetsPath: `${dpzOption.CDNBaseAddress}/lib/layim/res/`,
}).extend({
    layim: `${dpzOption.CDNBaseAddress}/lib/layim/layim`
}).use(["layim", "layer"], async function () {
    console.log(layui.cache.layimPath);
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
    chatConnection.on("System", function (res) {
        if (res.code < 0) {
            //console.log("%cchatHub:" + res.content, "color:#ff00ff");
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
    layim.on("sendMessage", async function (data) {
        // if (data.to.type === "friend") {
        //     layim.setChatStatus('<span style="color:#FF5722;">对方正在输入。。。</span>');
        // }
        try {
            if (data.to.id === "kefu") {
                robotConnection.invoke("SendMessage", data.mine.content).catch(function (err) {
                    return console.error(err.toString());
                });
            } else if (data.to.type === "friend") {
                await chatConnection.invoke("SendMessageToUser", data.to.id, data.mine.content);
            } else if (data.to.type === "group") {
                await chatConnection.invoke("SendMessageToGroup", data.to.id, data.mine.content);
            }
        } catch (invokeError) {
            console.error(invokeError);
        }
    });
});

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