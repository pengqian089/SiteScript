import {getToken, handleResponse, host, warning} from "src/common";

class Record {
  #audioChunks = [];
  #mediaRecorder = null;
  #audio = null;

  /**
   * 播放录音音频
   * @param {function} playAction 播放录音音频后回调函数
   * @param {function} endAction 播放录音音频完毕后回调函数
   * */
  async playAudio(playAction = null, endAction = null) {
    if (this.#audioChunks.length === 0) return;
    if (this.#audio === null) {
      const audioBlob = new Blob(this.#audioChunks);
      const audioUrl = URL.createObjectURL(audioBlob);
      this.#audio = new Audio(audioUrl);
      this.#audio.addEventListener("play", function () {
        if (typeof (playAction) === "function") {
          playAction();
        }
      });
      this.#audio.addEventListener("ended", function () {
        if (typeof (endAction) === "function") {
          endAction();
        }
      });
    }
    await this.#audio.play();
  }

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
  }
  /**
   * 开始录音
   * @param {function} startAction 开始录音回调函数
   * */
  async startRecord(startAction = null) {
    try {
      let stream = await navigator.mediaDevices.getUserMedia({audio: true});
      this.#mediaRecorder = new MediaRecorder(stream);
      this.#mediaRecorder.addEventListener("dataavailable", event => {
        this.#audioChunks.push(event.data);
      });
      this.#mediaRecorder.addEventListener("stop", () => {
        stream.getTracks().forEach(track => {
          console.log(track);
          track.stop();
        });
      });
      this.#mediaRecorder.start();
      if (typeof (startAction) === "function") {
        startAction();
      }
    } catch (e) {
      warning("无法使用录音,已拒绝授权麦克风权限或者没有录音设备");
    }
  }
  /**
   * 结束录音
   * @param {function} endAction 结束录音回调函数
   * */
  endRecord(endAction = null) {
    if (this.#mediaRecorder === null) return;
    this.#mediaRecorder.stop();
    if (typeof (endAction) === "function") {
      endAction();
    }
  }
  /**
   * 清除录音
   * @param {function} clearAction 清除录音回调函数
   * */
  clearAudio(clearAction = null) {
    this.#audioChunks = [];
    this.#audio = null;
    if (typeof (clearAction) === "function") {
      clearAction();
    }
  }
  /**
   * 上传录音
   * @param {function} uploadComplete 录音上传完成回调函数
   * @return {Promise.<string>} 音频地址
   * */
  async uploadAudio(uploadComplete = null) {
    if (this.#audioChunks.length === 0) return Promise.reject("没有获取到音频");
    try {
      const audioBlob = new Blob(this.#audioChunks);
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
  }
  saveAs() {
    if (this.#audioChunks.length === 0) return Promise.reject("没有获取到音频");
    const audioBlob = new Blob(this.#audioChunks);
    let url = URL.createObjectURL(audioBlob);
    window.open(url);
  }
}

export const record = new Record();
