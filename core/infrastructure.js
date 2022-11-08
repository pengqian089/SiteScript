"use strict";

(async function () {
    // 代码块工具
    codeBlockTools();
    // 时间本地化
    moment.locale("zh-cn");
    // 延迟加载图片
    new LazyLoad({});
    // 通知授权
    if (Notification.permission !== "granted") {
        let result = await Notification.requestPermission(function (permission) {
            if (permission === "granted") {
                console.info("通知已授权");
            }
        });
        console.log(result);
    }
})();

$.fn.relativeTime = function () {
    this.each(function (index) {
        let status = $(this).data("timeStatus");
        if (typeof (status) === "undefined") {
            let datetime = $(this).attr("datetime");
            let text = $(this).text();
            let str = moment(datetime, "YYYY/MM/DD HH:mm:ss").fromNow();
            $(this).text(str).attr("title", text).data("timeStatus", "loaded");
        }
    });
}

function loadImages(images) {
    let promises = [];
    for (let i = 0; i < images.length; i++) {
        let img = images[i];
        let promise = new Promise((resolve, reject) => {
            if (img.complete) {
                resolve(img);
                return;
            }
            img.addEventListener("load", function () {
                if (img.complete) {
                    resolve(img);
                } else {
                    reject(img);
                }
            });
            img.addEventListener("error", function () {
                console.warn(`the image [${img.src}] loaded error.`);
                reject(img);
            });
        });
        promises.push(promise);
    }
    return Promise.all(promises);
}

/**
 * 高亮显示代码块
 */
function lightCode() {
    document.querySelectorAll("pre code").forEach((block) => {
        Prism.highlightElement(block);
    });
    codeBlockTools();
}

/**
 * 代码块工具栏
 */
function codeBlockTools() {
    $('pre[class*=language-]').wrap('<div class="code-area" style="position: relative"></div>');

    // 代码收缩
    let $codeExpand = $('<i class="fa fa-angle-up fa-fw code-expand" aria-hidden="true" title="折叠"></i>');
    $('.code-area').prepend($codeExpand);
    $('.code-expand').on('click', function () {
        if ($(this).parent().hasClass('code-closed')) {
            $(this).siblings('pre').find('code').show();
            $(this).siblings('pre').find('.line-highlight').show();
            $(this).parent().removeClass('code-closed');
        } else {
            $(this).siblings('pre').find('code').hide();
            $(this).siblings('pre').find('.line-highlight').hide();
            $(this).parent().addClass('code-closed');
        }
    });

    // 复制
    let $copyIcon = $('<i class="fa fa-copy fa-fw code_copy" title="复制代码" aria-hidden="true"></i>')
    let $notice = $('<div class="codecopy_notice"></div>')
    $('.code-area').prepend($copyIcon)
    $('.code-area').prepend($notice)

    function copy(text, ctx) {
        if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
            try {
                document.execCommand('copy') // Security exception may be thrown by some browsers.
                layer.msg("复制成功");
            } catch (ex) {
                layer.msg("复制失败");
                return false;
            }
        } else {
            layer.msg("浏览器不支持");
        }
    }

    // 复制
    $('.code-area .fa-copy').on('click', function () {
        let selection = window.getSelection()
        let range = document.createRange()
        range.selectNodeContents($(this).siblings('pre').find("code")[0])
        selection.removeAllRanges()
        selection.addRange(range)
        let text = selection.toString()
        copy(text, this)
        selection.removeAllRanges()
    });

    // 显示代码语言
    let $highlightLang = $('<div class="code_lang" title="代码语言"></div>');
    let $pre = $('pre');
    $pre.before($highlightLang);
    $pre.each(function () {
        // let codeLanguage = $(this).attr('class');
        // if (!codeLanguage) {
        //     return true;
        // };
        let classes = $(this).prop("class").split(/\s+/);
        for (let item of classes) {
            if (item.startsWith("language")) {
                let languageName = item.replace("language-", "").trim();
                $(this).siblings(".code_lang").text(languageName);
                break;
            }
        }
        //let langName = codeLanguage.replace("line-numbers", "").trim().replace("language-", "").trim();

    });
}

/**
 * 控制台输出成功信息
 * @param {string} message 输出消息
 */
function outPutSuccess(message) {
    console.log(`%c Success %c [${moment().format('YYYY-MM-DD HH:mm:ss')}]  %c ${message}`,
        'color: #bb0662; background: #030307; padding:5px 0;',
        'color: #fadfa3; background: #393d49; padding:5px 0',
        'font-weight:bold; color: black; background: #77f2e1; padding:5px 0;');
}

function outPutInfo(message) {
    console.log(`%c Info %c [${moment().format('YYYY-MM-DD HH:mm:ss')}]  %c ${message}`,
        'color: #bb0662; background: #030307; padding:5px 0;',
        'color: #fadfa3; background: #393d49; padding:5px 0',
        'font-weight:bold; color: black; background: #fadfa3; padding:5px 0;');
}

function outPutError(message) {
    console.log(`%c Error %c [${moment().format('YYYY-MM-DD HH:mm:ss')}]  %c ${message}`,
        'color: #bb0662; background: #030307; padding:5px 0;',
        'color: #fadfa3; background: #393d49; padding:5px 0',
        'font-weight:bold; color: black; background: red; padding:5px 0;');
}

/**
 * ajax 请求错误处理
 * @param {jqXHR} xhr
 * @param {string} textStatus
 * @param {any} errorThrown
 * */
function ajaxFail(xhr, textStatus, errorThrown) {
    console.log(xhr);
    console.log(textStatus);
    console.log(errorThrown);
    if (xhr.hasOwnProperty("responseJSON")
        && xhr["responseJSON"].hasOwnProperty("success")
        && xhr["responseJSON"].hasOwnProperty("msg")
        && xhr["responseJSON"]["success"] === false) {
        layer.alert(xhr["responseJSON"].msg);
    } else {
        layer.msg(`error:${xhr.status}`)
    }
}

async function initVideoPlayer() {
    const playerId = "video-player";
    const mPlayerId = "m-video-player";
    const playerElement = document.getElementById(playerId) || document.getElementById(mPlayerId);
    if (playerElement !== null) {
        //player.style.marginBottom = "15px";
        let response = await fetch(`${dpzOption.webApiBaseAddress}/api/Video`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
            mode: 'cors'
        });
        let data = await response.json();
        let index = Math.floor(Math.random() * data.length);


        let danmakuResponse = await fetch(`/history/danmaku/${data[index]["id"]}`);
        let danmakuItems = await danmakuResponse.json();

        const danmakuOptions = {items: danmakuItems};

        const player = new NPlayer.Player({
            plugins: [
                new NPlayerDanmaku(danmakuOptions)
            ]
        });

        player.on('DanmakuSend', async (opts) => {
            await sendDanmaku(opts, data[index]["id"]);
        });

        const hls = new Hls();

        hls.attachMedia(player.video);

        hls.on(Hls.Events.MEDIA_ATTACHED, function () {
            hls.loadSource(data[index]["m3u8"])
        })

        player.mount(playerElement);
    }

    const video = document.querySelector("[data-video]");
    if (video !== null) {
        const data2 = JSON.parse(video.dataset.video);

        let danmakuResponse2 = await fetch(`/history/danmaku/${data2["id"]}`);
        let danmakuItems2 = await danmakuResponse2.json();

        const danmakuOptions = {items: danmakuItems2};

        const player2 = new NPlayer.Player({
            plugins: [
                new NPlayerDanmaku(danmakuOptions)
            ]
        });

        player2.on('DanmakuSend', async (opts) => {
            await sendDanmaku(opts, data2["id"]);
        });

        const hls2 = new Hls();

        hls2.attachMedia(player2.video);

        hls2.on(Hls.Events.MEDIA_ATTACHED, function () {
            hls2.loadSource(data2["url"])
        });

        player2.mount(video);
    }
}

async function sendDanmaku(danmaku, id) {
    danmaku["id"] = id;
    await fetch(`/history/danmaku`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(danmaku)
    });
}


async function initFetchContent() {
    let fetchContents = document.querySelectorAll("[data-request]");
    for (let item of fetchContents) {
        let response = await fetch(item.dataset.request, {
            method: 'GET'
        });
        response.text().then(x => {
            item.innerHTML = x;
            $("time.timeago").relativeTime();
            lightCode();
        });
    }
}

function generateToc() {
    let toc = $(".js-toc");
    if (toc.length === 0) return;
    if ($(".article-detail-content").find("h1,h2,h3").length === 0) {
        tocbot.destroy();
        $("label.toc-icon.menu").hide();
        toc.hide();
        return;
    }
    tocbot.init({
        tocSelector: '.js-toc',
        contentSelector: '.article-detail-content',
        headingSelector: 'h1, h2, h3',
        hasInnerContainers: true,
    });
}