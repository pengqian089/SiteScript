"use strict";

(async function () {
    let connection = new signalR
        .HubConnectionBuilder()
        .withUrl("/notification",
            {

                skipNegotiation : true,
                transport : signalR.HttpTransportType.WebSockets,
            }
        )
        .withAutomaticReconnect()
        .build();

    try {
        await connection.start();
        await connection.invoke("Init");
    } catch (error) {
        console.error(error);
    }

    connection.on("pushMessage", async function (result) {
        let option = {title: "小喇叭开始广播辣", content: result.markdown};
        let ntf = await showNotify(option);
        if (ntf !== null) {
            ntf.onclick = function () {
                window.open("/talk.html");
            };
        }
        console.info(result);
    });

    connection.on("pushLogMessage", function (type, message) {
        if (type === 0) {
            outPutSuccess(message);
            $.notify(`${moment().format('YYYY-MM-DD HH:mm:ss')}\n${message}`, "success");
        } else if (type === 1) {
            outPutInfo(message);
            $.notify(`${moment().format('YYYY-MM-DD HH:mm:ss')}\n${message}`, "warn");
        } else if (type === 2) {
            outPutError(message);
            $.notify(`${moment().format('YYYY-MM-DD HH:mm:ss')}\n${message}`, "error");
        }
    });

    let cnBetaBox = null;
    connection.on("cnBetaSubscribe", function (result) {
        let values = [];
        if (result.hasOwnProperty("progressValues") && Array.isArray(result["progressValues"])) {
            for (let i = 0; i < result["progressValues"].length; i++) {
                let value = (result["progressValues"][i] * 100).toFixed(2);
                values.push(parseFloat(value));
            }
        }
        if (cnBetaBox == null) {
            cnBetaBox = notification.show({
                title: "CnBeta发布",
                content: result.message,
                bars: values
            });
        } else {
            notification.setContent(cnBetaBox, result.message);
            notification.setProgress(cnBetaBox, values);
        }
        switch (result.type) {
            case 0:
                outPutSuccess(result.message);
                break;
            case 1:
                outPutInfo(result.message);
                break;
            case 2:
                outPutError(result.message);
                break;
            case 3:
                outPutSuccess(result.message);
                setTimeout(function () {
                    notification.close(cnBetaBox);
                    cnBetaBox = null;
                }, 1000);
                break;
        }
    });

    connection.on("ready", function (result) {
        console.info(result);
    });

    setTimeout(function () {
        updateRunTime();
    }, 1000);

    function updateRunTime() {
        connection.invoke("getRunTime");
    }

    connection.on("ReceiveRunTime", function (msg) {
        let runTime = $("#runTime");
        if (runTime.length > 0) {
            runTime.text("运行时间 " + msg);
            setTimeout(updateRunTime, 1000);
        }
    });

    connection.on("systemNotification", function (msg) {
        layer.msg(msg);
    });
})();

(async () => {
    let appConnection = new signalR
        .HubConnectionBuilder()
        .withUrl("/app/notification",
            {
                skipNegotiation : true,
                transport : signalR.HttpTransportType.WebSockets,
            }
        )
        .withAutomaticReconnect()
        .build();

    try {
        await appConnection.start();
    } catch (error) {
        console.error(error);
    }
    appConnection.on("systemMessage", function (level, message) {
        if (level === 0) {
            outPutSuccess(message);
            $.notify(message, "success");
        } else if (level === 1) {
            outPutInfo(message);
            $.notify(message, "warn");
        } else if (level === 2) {
            outPutError(message);
            $.notify(message, "error");
        }
    });
})();

async function showNotify(option) {
    if (!("Notification" in window)) {
        return null;
    }

    let permission = await Notification.requestPermission();

    let setting = {
        title: "",
        content: "",
        image: "https://cdn.dpangzi.com/logo.png"
    };
    $.extend(setting, option);

    if (permission === "granted") {
        return new Notification(setting.title, {
            icon: setting.image,
            body: setting.content,
            lang: "zh-cn",
            tag: setting.tag
        });
    }
    return null;
}

let notification = {
    /**
     * 显示通知框
     * @typedef Options
     * @property {string} title
     * @property {string} content
     * @property {number[]} bars
     * @param {Options} option
     * */
    show: function (option) {
        if (typeof option !== "object") option = {};
        let setting = {
            title: "",
            content: "",
            bars: []
        };
        $.extend(setting, option);
        let top = 0;
        $(".notification-box").each(function () {
            top += ($(this).height() + 15);
        });
        let $box = createBox(setting.title, setting.content);
        $box.css("top", `${(top + 15)}px`)
        $("body").append($box);

        function createBox(title, content) {
            let $box = $("<div>").addClass("notification-box");
            let $title = $("<div>").addClass("title").text(title);
            $box.append($title);
            let $container = $("<div>").addClass("content-container");
            let $content = $("<span>").addClass("content").text(content);
            $container.append($content);
            let values = barValues(setting.bars);
            for (let i = 0; i < values.length; i++) {
                let $progress = $("<div>").addClass("progress");
                let progressValue = `${values[i]}%`;
                let $bar = $("<div>").addClass("bar")
                    .css("width", progressValue)
                    .text(progressValue);
                $progress.append($bar);
                $container.append($progress);
            }
            $box.append($container);
            return $box;
        }

        function barValues(bars) {
            let values = [];
            if (!Array.isArray(bars)) return values;
            for (let i = 0; i < bars.length; i++) {
                if (typeof bars[i] === "number")
                    values.push(bars[i]);
            }
            return values;
        }

        return $box;
    },
    setContent: function ($box, content) {
        if ($box.length === 0) return;
        $box.find(".content").text(content);
    },
    setTitle: function ($box, title) {
        if ($box.length === 0) return;
        $box.find(".title").text(title);
    },
    /**
     * 设置进度条的进度
     * @param {jQuery} $box 要设置的提示框
     * @param {number[]} values 进度值
     */
    setProgress: function ($box, values) {
        if ($box.length === 0) return;
        if (!Array.isArray(values))
            return;
        let j = 0;
        for (let i = 0; i < values.length; i++) {
            if (typeof values[i] === "number") {
                $box.find(`.content-container .progress:eq(${j}) .bar`)
                    .css("width", `${values[i]}%`)
                    .text(`${values[i]}%`);
                j++;
            }
        }
    },
    /**
     * 关闭通知框
     * @param {jQuery} $box 要关闭的提示框
     * */
    close: function ($box) {
        if ($box.length === 0) return;
        $box.fadeOut("fast", function () {
            $box.remove();
        });
    },
    closeAll: function () {
        $(".notification-box").fadeOut("fast", function () {
            $(".notification-box").remove();
        });
    },
    test: function () {
        let $box = notification.show(
            {
                title: "这是标题呀",
                content: "内容",
                bars: [0]
            }
        );
        setTimeout(progress, 100);
        let progressValue = 0;

        function progress() {
            if (progressValue >= 100) {
                notification.setContent($box, "加载完毕，即将关闭！");
                notification.close($box);
                return;
            }
            progressValue++;
            notification.setContent($box, "新内容呀\n" + progressValue);
            notification.setProgress($box, [progressValue]);
            setTimeout(progress, 100);
        }
    }
};
