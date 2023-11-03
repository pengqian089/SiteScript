import _ from "lodash";

export const host = "https://localhost:37701";

export function getToken() {
    return localStorage["token"];
}

/**
 * 抽象fetch响应的处理方式
 * @param {Response} response 响应
 * @param {function} callback 失败回调函数
 * */
export async function handleResponse(response, callback = null) {
    try {
        if (response.ok) {
            let result = await response.json();
            if (result.success) {
                return Promise.resolve(result.data);
            } else {
                warning(result.msg);
                callbackFail(callback);
                return Promise.reject(result.msg);
            }
        } else {
            warning(response.statusText);
            callbackFail(callback);
            return Promise.reject(response.statusText);
        }
    } catch (e) {
        warning(e.toString())
        callbackFail(callback);
        return Promise.reject(e.toString());
    }
}

function callbackFail(fail) {
    if (typeof (fail) === "function") {
        fail();
    }
}

let notifier = null;

export function setNotifier(obj) {
    if (notifier == null)
        notifier = obj;
}

/**
 * 警告通知
 * @param {string} message 警告消息
 * */
export function warning(message) {
    notifier.toastWarning(message, {toastProps: {location: "top center"}});
}

/**
 * 成功通知
 * @param {string} message 成功消息
 * */
export function success(message) {
    notifier.toastSuccess(message, {toastProps: {location: "top center"}})
}

/**
 * 上传图像的fetch处理
 * @param {Response} response 响应
 * @param {function} callback 失败回调函数
 * */
export async function handleUploadResponse(response, callback = null) {
    try {
        if (response.ok) {
            let result = await response.json();
            if (result.success === 1) {
                return Promise.resolve(result.url);
            } else {
                warning(result.message);
                callbackFail(callback);
                return Promise.reject(result.msg);
            }
        } else {
            warning(response.statusText);
            callbackFail(callback);
            return Promise.reject(response.statusText);
        }
    } catch (e) {
        warning(e.toString())
        callbackFail(callback);
        return Promise.reject(e.toString());
    }
}

/**
 * 上传
 * @param {FormData} formData FormData
 * @param {String} url 请求地址
 * @param {String} method 请求方法
 * @param {function(ProgressEvent<XMLHttpRequestEventTarget>)} upload 上传文件回调
 * @param {function(ProgressEvent<XMLHttpRequestEventTarget>)} download 下载结果回调
 * @param {function} callback 失败回调函数
 * */
export async function uploadAsync({formData, url, method = "POST", upload = null, download = null, callback = null}) {
    const xhr = new XMLHttpRequest();
    return await new Promise((resolve, reject) => {
        if (typeof (upload) === "function") {
            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    //console.log("upload progress:", event.loaded / event.total);
                    upload(event);
                }
            });
        }
        if (typeof (download) === "function") {
            xhr.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    // console.log("download progress:", event.loaded / event.total);
                    download(event);
                }
            });
        }
        xhr.addEventListener("loadend", () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                //resolve(xhr.readyState === 4 && xhr.status === 200);
                let result = JSON.parse(xhr.responseText);
                if (result.success === 1) {
                    resolve(result.url);
                } else {
                    warning(result.message);
                    callbackFail(callback);
                    reject(result.msg);
                }
            } else {
                reject(xhr.responseText);
            }


        });
        xhr.open(method, `${host}${url}`, true);
        //xhr.setRequestHeader("Content-Type", "application/octet-stream");
        let token = getToken();
        if (!_.isEmpty(token)) {
            xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);
        }
        xhr.send(formData);
    });
}

export const toolbars = [
    'bold',
    'underline',
    'italic',
    'image',
    'strikeThrough',
    '-',
    'quote',
    'unorderedList',
    'orderedList',
    '-',
    'codeRow',
    'code',
    'link',
    'table',
    '=',
    'prettier',
    'pageFullscreen',
    'preview',
    'catalog',
];

let audioChunks = [],
    mediaRecorder = null,
    audio = null;
export const record = {
    /**
     * 播放录音音频
     * @param {function} playAction 播放录音音频后回调函数
     * @param {function} endAction 播放录音音频完毕后回调函数
     * */
    async playAudio(playAction = null, endAction = null) {
        if (audioChunks.length === 0) return;
        if (audio === null) {
            const audioBlob = new Blob(audioChunks);
            const audioUrl = URL.createObjectURL(audioBlob);
            audio = new Audio(audioUrl);
            audio.addEventListener("play", function () {
                if (typeof (playAction) === "function") {
                    playAction();
                }
            });
            audio.addEventListener("ended", function () {
                if (typeof (endAction) === "function") {
                    endAction();
                }
            });
        }
        await audio.play();
    },
    /**
     * 暂停录音音频
     * @param {function} pauseAction 暂停播放音频回调函数
     * */
    async pauseAudio(pauseAction = null) {
        if (audio === null) {
            return;
        }
        await audio.pause();
        if (typeof (pauseAction) === "function") {
            pauseAction();
        }
    },
    /**
     * 开始录音
     * @param {function} startAction 开始录音回调函数
     * */
    async startRecord(startAction = null) {
        try {
            let stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
            });
            mediaRecorder.addEventListener("stop", () => {
                stream.getTracks().forEach(track => {
                    console.log(track);
                    track.stop();
                });
            });
            mediaRecorder.start();
            if (typeof (startAction) === "function") {
                startAction();
            }
        } catch (e) {
            warning("无法使用录音,已拒绝授权麦克风权限或者没有录音设备");
        }
    },
    /**
     * 结束录音
     * @param {function} endAction 结束录音回调函数
     * */
    endRecord(endAction = null) {
        if (mediaRecorder === null) return;
        mediaRecorder.stop();
        if (typeof (endAction) === "function") {
            endAction();
        }
    },
    /**
     * 清除录音
     * @param {function} clearAction 清除录音回调函数
     * */
    clearAudio(clearAction = null) {
        audioChunks = [];
        audio = null;
        if (typeof (clearAction) === "function") {
            clearAction();
        }
    },
    /**
     * 上传录音
     * @param {function} uploadComplete 录音上传完成回调函数
     * @return {Promise.<string>} 音频地址
     * */
    async uploadAudio(uploadComplete = null) {
        if (audioChunks.length === 0) return Promise.reject("没有获取到音频");
        try {
            const audioBlob = new Blob(audioChunks);
            let form = new FormData();
            form.append("record", audioBlob, `${new Date().getTime()}.wav`);
            let response = await fetch(`${host}/Audio/Upload`, {
                method: "post",
                body: form,
                headers: {"Authorization": `Bearer ${getToken()}`}
            });

            let result = await handleResponse(response);
            if (typeof (uploadComplete) === "function") {
                uploadComplete();
            }
            return Promise.resolve(result);
        } catch (e) {
            return Promise.reject(e.toString());
        }
    },
    saveAs() {
        if (audioChunks.length === 0) return Promise.reject("没有获取到音频");
        const audioBlob = new Blob(audioChunks);
        let url = URL.createObjectURL(audioBlob);
        window.open(url);
    }
};

/**
 * fetch request
 * @param {String} url 不包含host的url
 * @param {Array<{name,value}>} parameters 请求参数对象
 * @param {function} callback 返回预期的返回值的回调
 * */
export async function fetchGetAsync({url, parameters = null, callback = null}) {
    let parametersValue = [];
    if (parameters != null) {
        for (const item of parameters) {
            parametersValue.push(`${item.name}=${encodeURIComponent(item.value)}`)
        }
    }
    let uri = `${host}${url}${(parametersValue.length === 0 ? "" : "?" + parametersValue.join("&"))}`;
    let response = await fetch(uri,{
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    return await handleResponse(response, callback);
}