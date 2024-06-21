import Artplayer from 'artplayer';
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";

export async function initVideo() {
    const playerId = "video-player";
    const mPlayerId = "m-video-player";
    const playerElement = document.getElementById(playerId) || document.getElementById(mPlayerId);

    if (playerElement !== null) {
        await fetchRandomVideo(playerElement);
    } else {
        await fetchVideo();
    }
}

async function fetchVideo(){
    const video = document.querySelector("[data-video]");
    if (video !== null) {
        const data = JSON.parse(video.dataset.video);
        let response = await fetch(`/history/danmaku/${data["id"]}`);
        let danmakuItems = await response.json();
        videoPlayer(video,danmakuItems,data["m3u8"],data["id"]);
    }
}

/**
 * 初始化播放器
 * @param {HTMLDivElement} element 播放器ID
 * @param {Array} danmakuItems 弹幕列表
 * @param {string} videoSrc 视频地址
 * @param {string} videoId 视频数据ID
 * @return {Artplayer} 播放器实例
 * */
function videoPlayer(element, danmakuItems, videoSrc, videoId) {
    const art = new Artplayer({
        container: element,
        setting: true,
        url: videoSrc,
        customType: {
            m3u8: playM3u8,
        },
        plugins: [
            artplayerPluginDanmuku({
                danmuku: danmakuItems,
                synchronousPlayback: true,
                filter: (danmaku) => danmaku.text.length > 0 && danmaku.text.length < 50,
                theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
                beforeEmit: (danmaku) => !!danmaku.text.trim()
            })
        ]
    });

    art.on('artplayerPluginDanmuku:emit', (danmaku) => {
        console.info('新增弹幕', danmaku, videoId);
    });

    return art;
}

/**
 * 获取一个随机视频
 * @param {HTMLDivElement} element 元素ID
 * */
async function fetchRandomVideo(element) {
    const response = await fetch(`${dpzOption.webApiBaseAddress}/api/Video`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        mode: 'cors'
    });
    const data = await response.json();
    const index = Math.floor(Math.random() * data.length);

    const danmakuResponse = await fetch(`/history/danmaku/${data[index]["id"]}`);
    const danmakuItems = await danmakuResponse.json();

    videoPlayer(element,danmakuItems,data[index]["m3u8"],data[index]["id"]);
}

/**
 * 发送弹幕
 * @param {Object} danmaku
 * */
async function sendDanmaku(danmaku) {
    //danmaku["id"] = id;
    await fetch(`/history/danmaku`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(danmaku)
    });
}

/**
 * 播放m3u8
 * @param {HTMLVideoElement} video
 * @param {string} url
 * @param {Artplayer} art
 * */
function playM3u8(video, url, art) {

    if (Hls.isSupported()) {
        if (art.hls) art.hls.destroy();
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        art.hls = hls;
        art.on('destroy', () => hls.destroy());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
    } else {
        art.notice.show = 'Unsupported playback format: m3u8';
    }
}