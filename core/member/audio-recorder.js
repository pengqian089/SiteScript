/**
 * 音频录制控制器
 * 封装 MediaRecorder API 和相关 UI 逻辑
 */
class AudioRecorder {
    constructor(options = {}) {
        this.options = Object.assign({
            onMessage: (msg, type) => console.log(msg, type),
            onLoading: (show, msg) => {}
        }, options);

        this.config = {
            MAX_DURATION: 600, // 10分钟
            MIN_DURATION: 1,
            AUDIO_TYPE: 'audio/webm;codecs=opus',
            FALLBACK_TYPE: 'audio/wav',
            UPDATE_INTERVAL: 100
        };

        this.media = {
            mediaRecorder: null,
            audioChunks: [],
            audioUrl: null,
            audioBlob: null,
            stream: null,
            audioElement: null
        };

        this.state = {
            isRecording: false,
            isPaused: false,
            isPlaying: false,
            duration: 0,
            currentTime: 0,
            startTime: null,
            recordingTimer: null,
            playbackTimer: null,
            hasRecording: false
        };

        this.selectors = {
            startBtn: '#startRecording',
            stopBtn: '#stopRecording',
            playBtn: '#playRecording',
            pauseBtn: '#pauseRecording',
            clearBtn: '#clearRecording',
            uploadBtn: '#uploadRecording',
            recordingSection: '.recording-section',
            playerSection: '#recordingPlayer',
            statusText: '#recordingStatusText',
            recordingTime: '#recordingTime',
            currentTime: '#currentTime',
            totalTime: '#totalTime',
            progressBar: '#audioProgressBar',
            progressHandle: '#audioProgressHandle',
            progressContainer: '#audioProgress'
        };
    }

    init() {
        this.bindEvents();
        this.resetState();
    }

    bindEvents() {
        $(this.selectors.startBtn).on('click', () => this.startRecording());
        $(this.selectors.stopBtn).on('click', () => this.stopRecording());
        $(this.selectors.playBtn).on('click', () => this.togglePlayback());
        $(this.selectors.pauseBtn).on('click', () => this.pausePlayback());
        $(this.selectors.clearBtn).on('click', () => this.clearRecording());
        $(this.selectors.uploadBtn).on('click', () => this.uploadRecording());
        
        // 进度条拖动
        this.bindProgressBarEvents();
    }

    resetState() {
        this.stopRecording();
        this.stopPlayback();
        this.cleanupMediaResources();
        
        this.state = {
            isRecording: false,
            isPaused: false,
            isPlaying: false,
            duration: 0,
            currentTime: 0,
            startTime: null,
            recordingTimer: null,
            playbackTimer: null,
            hasRecording: false
        };
        
        this.updateUI();
    }

    cleanupMediaResources() {
        if (this.media.stream) {
            this.media.stream.getTracks().forEach(track => track.stop());
            this.media.stream = null;
        }
        if (this.media.audioUrl) {
            URL.revokeObjectURL(this.media.audioUrl);
            this.media.audioUrl = null;
        }
        this.media.mediaRecorder = null;
        this.media.audioChunks = [];
        this.media.audioBlob = null;
        this.media.audioElement = null;
    }

    async startRecording() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.options.onMessage('浏览器不支持录音功能', 'error');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.media.stream = stream;

            const mimeType = MediaRecorder.isTypeSupported(this.config.AUDIO_TYPE) 
                ? this.config.AUDIO_TYPE 
                : this.config.FALLBACK_TYPE;

            this.media.mediaRecorder = new MediaRecorder(stream, { mimeType });
            this.media.audioChunks = [];

            this.media.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.media.audioChunks.push(event.data);
                }
            };

            this.media.mediaRecorder.onstop = () => {
                this.processRecordedAudio(mimeType);
            };

            this.media.mediaRecorder.start();
            this.state.isRecording = true;
            this.state.startTime = Date.now();
            
            this.startRecordingTimer();
            this.updateUI();

        } catch (error) {
            console.error('录音启动失败:', error);
            this.options.onMessage('无法启动录音，请检查麦克风权限', 'error');
        }
    }

    stopRecording() {
        if (this.media.mediaRecorder && this.state.isRecording) {
            this.media.mediaRecorder.stop();
            this.state.isRecording = false;
            this.stopRecordingTimer();
            // stream cleanup happens in cleanupMediaResources or after processing?
            // Usually we keep stream until we clear or restart? 
            // Better to stop tracks now to release mic.
            if (this.media.stream) {
                this.media.stream.getTracks().forEach(track => track.stop());
                this.media.stream = null;
            }
        }
    }

    startRecordingTimer() {
        this.stopRecordingTimer();
        this.state.recordingTimer = setInterval(() => {
            const duration = (Date.now() - this.state.startTime) / 1000;
            this.state.duration = duration;
            this.updateTimeDisplay(duration, this.selectors.recordingTime);
            
            if (duration >= this.config.MAX_DURATION) {
                this.stopRecording();
                this.options.onMessage('已达到最大录音时长', 'info');
            }
        }, this.config.UPDATE_INTERVAL);
    }

    stopRecordingTimer() {
        if (this.state.recordingTimer) {
            clearInterval(this.state.recordingTimer);
            this.state.recordingTimer = null;
        }
    }

    processRecordedAudio(mimeType) {
        this.media.audioBlob = new Blob(this.media.audioChunks, { type: mimeType });
        this.media.audioUrl = URL.createObjectURL(this.media.audioBlob);
        this.media.audioElement = new Audio(this.media.audioUrl);
        
        this.media.audioElement.onended = () => {
            this.state.isPlaying = false;
            this.stopPlaybackTimer();
            this.state.currentTime = 0;
            this.updateUI();
        };

        this.media.audioElement.onloadedmetadata = () => {
            if (this.media.audioElement.duration && !isNaN(this.media.audioElement.duration)) {
                 // fix duration if needed, but we use recorded duration
            }
        };

        this.state.hasRecording = true;
        this.updateUI();
    }

    togglePlayback() {
        if (!this.media.audioElement) return;

        if (this.state.isPlaying) {
            this.pausePlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback() {
        if (!this.media.audioElement) return;
        
        this.media.audioElement.play();
        this.state.isPlaying = true;
        this.startPlaybackTimer();
        this.updateUI();
    }

    pausePlayback() {
        if (!this.media.audioElement) return;

        this.media.audioElement.pause();
        this.state.isPlaying = false;
        this.stopPlaybackTimer();
        this.updateUI();
    }

    stopPlayback() {
        if (!this.media.audioElement) return;
        
        this.media.audioElement.pause();
        this.media.audioElement.currentTime = 0;
        this.state.isPlaying = false;
        this.stopPlaybackTimer();
        this.state.currentTime = 0;
        this.updateUI();
    }

    startPlaybackTimer() {
        this.stopPlaybackTimer();
        this.state.playbackTimer = setInterval(() => {
            if (this.media.audioElement) {
                this.state.currentTime = this.media.audioElement.currentTime;
                this.updateTimeDisplay(this.state.currentTime, this.selectors.currentTime);
                this.updatePlaybackProgress();
            }
        }, this.config.UPDATE_INTERVAL);
    }

    stopPlaybackTimer() {
        if (this.state.playbackTimer) {
            clearInterval(this.state.playbackTimer);
            this.state.playbackTimer = null;
        }
    }

    clearRecording() {
        if (confirm('确定要清除当前录音吗？')) {
            this.resetState();
        }
    }

    async uploadRecording() {
        if (!this.media.audioBlob) {
            this.options.onMessage('没有可上传的录音', 'warning');
            return;
        }

        // 确定录音文件扩展名
        let extension = 'webm';
        if (this.media.audioBlob.type.includes('wav')) {
            extension = 'wav';
        } else if (this.media.audioBlob.type.includes('mp3')) {
            extension = 'mp3';
        } else if (this.media.audioBlob.type.includes('flac')) {
            extension = 'flac';
        }

        const formData = new FormData();
        formData.append('record', this.media.audioBlob, `recording.${extension}`);
        formData.append('duration', this.state.duration.toString());

        try {
            // 使用 memberCenter 的上传进度方法
            if (typeof memberCenter !== 'undefined' && memberCenter.showProgress) {
                memberCenter.showProgress('正在上传录音...');
            } else {
                this.options.onLoading(true, '正在上传...');
            }

            const result = await this.uploadWithProgress(
                '/Audio/Upload',
                formData,
                (percent) => {
                    if (typeof memberCenter !== 'undefined' && memberCenter.updateProgress) {
                        memberCenter.updateProgress(percent, '正在上传录音...');
                    }
                }
            );

            if (typeof memberCenter !== 'undefined' && memberCenter.hideProgress) {
                memberCenter.hideProgress();
            } else {
                this.options.onLoading(false);
            }

            if (!result.success) {
                this.options.onMessage(result.msg || '上传失败', 'error');
                return;
            }

            this.options.onMessage('录音上传成功', 'success');

            // 插入音频标签到编辑器
            if (result.data && result.data.accessUrl) {
                this.insertAudioToEditor(result.data.accessUrl);
            }

            // 清除录音状态
            this.resetState();

        } catch (error) {
            if (typeof memberCenter !== 'undefined' && memberCenter.hideProgress) {
                memberCenter.hideProgress();
            } else {
                this.options.onLoading(false);
            }
            this.options.onMessage('上传失败: ' + error.message, 'error');
            console.error('上传录音失败:', error);
        }
    }

    updateUI() {
        const { isRecording, hasRecording, isPlaying, duration, currentTime } = this.state;

        // 按钮状态
        $(this.selectors.startBtn).toggle(!isRecording && !hasRecording);
        $(this.selectors.stopBtn).toggle(isRecording);
        $(this.selectors.playBtn).toggle(hasRecording && !isPlaying);
        $(this.selectors.pauseBtn).toggle(hasRecording && isPlaying);
        $(this.selectors.clearBtn).toggle(hasRecording && !isRecording);
        $(this.selectors.uploadBtn).toggle(hasRecording && !isRecording);

        // 区域显示
        if (hasRecording) {
            $(this.selectors.playerSection).slideDown();
        } else {
            $(this.selectors.playerSection).slideUp();
        }

        // 状态文本
        if (isRecording) {
            $(this.selectors.statusText).text('正在录音...');
            $(this.selectors.recordingSection).addClass('recording');
        } else {
            $(this.selectors.statusText).text(hasRecording ? '录音完成' : '准备录音');
            $(this.selectors.recordingSection).removeClass('recording');
        }

        // 时间显示
        this.updateTimeDisplay(duration, this.selectors.totalTime);
        this.updateTimeDisplay(currentTime, this.selectors.currentTime);
        this.updatePlaybackProgress();
    }

    updateTimeDisplay(seconds, selector) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        $(selector).text(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`);
    }

    updatePlaybackProgress() {
        if (this.state.duration > 0) {
            const percent = (this.state.currentTime / this.state.duration) * 100;
            $(this.selectors.progressBar).css('width', `${percent}%`);
            $(this.selectors.progressHandle).css('left', `${percent}%`);
        } else {
            $(this.selectors.progressBar).css('width', '0%');
            $(this.selectors.progressHandle).css('left', '0%');
        }
    }

    bindProgressBarEvents() {
        let isDragging = false;
        const container = $(this.selectors.progressContainer);

        container.on('mousedown touchstart', (e) => {
            if (!this.state.hasRecording) return;
            isDragging = true;
            this.handleSeek(e);
        });

        $(document).on('mousemove touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();
                this.handleSeek(e);
            }
        });

        $(document).on('mouseup touchend', () => {
            isDragging = false;
        });
    }

    handleSeek(e) {
        const container = $(this.selectors.progressContainer);
        const offset = container.offset();
        const width = container.width();
        let clientX = e.clientX;
        
        if (e.type.includes('touch')) {
            clientX = e.touches[0].clientX;
        }

        let percent = (clientX - offset.left) / width;
        percent = Math.max(0, Math.min(1, percent));
        
        const time = percent * this.state.duration;
        this.seekTo(time);
    }

    seekTo(time) {
        if (!this.media.audioElement) return;
        this.media.audioElement.currentTime = time;
        this.state.currentTime = time;
        this.updateTimeDisplay(time, this.selectors.currentTime);
        this.updatePlaybackProgress();
    }

    uploadWithProgress(url, formData, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);

            // 监听上传进度
            if (xhr.upload && onProgress) {
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        onProgress(percent);
                    }
                };
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    }

    insertAudioToEditor(audioUrl) {
        try {
            // 构建音频标签的 HTML
            const audioHtml = `\n<audio controls src="${audioUrl}" style="max-width: 100%; margin: 10px 0;"></audio>\n`;
            
            // 如果使用 Cherry Markdown 编辑器
            if (typeof memberCenter !== 'undefined' && memberCenter.cherryInstance) {
                const currentContent = memberCenter.cherryInstance.getMarkdown();
                memberCenter.cherryInstance.setMarkdown(currentContent + audioHtml);
            } 
            // 如果使用普通文本框
            else {
                const editorEl = document.getElementById('mumbleContent') || 
                                document.getElementById('articleContent') || 
                                document.getElementById('timelineContent');
                if (editorEl) {
                    const currentContent = editorEl.value || '';
                    editorEl.value = currentContent + audioHtml;
                }
            }
        } catch (error) {
            console.error('插入音频标签失败:', error);
        }
    }
}
