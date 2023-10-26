import {useNotifier} from "vuetify-notifier";

export const host = "https://localhost:37701";

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

//const notifier = useNotifier();

/**
 * 警告通知
 * @param {string} message 警告消息
 * */
export function warning(message) {
    const notifier = useNotifier();
    notifier.toastWarning(message, {toastProps: {location: "top center"}});
}

/**
 * 成功通知
 * @param {string} message 成功消息
 * */
export function success(message) {
    const notifier = useNotifier();
    notifier.toastSuccess(message,{toastProps: {location: "top center"}})
}