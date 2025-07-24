/**
 * 个人中心功能组件
 * @version 1.0
 * @author pengqiang
 */

'use strict';

/**
 * 录音管理器
 * 处理音频录制和播放功能
 */
class RecordingManager extends MemberBase.EventEmitter {
    constructor(stateManager) {
        super();
        this.state = stateManager;
        this.media = {
            mediaRecorder: null,
            audioChunks: [],
            audioUrl: null,
            audioBlob: null,
            stream: null,
            audioElement: null
        };
        
        this.timers = {
            recording: null,
            playback: null
        };
        
        this.config = {
            maxDuration: 600, // 最大录音时长（秒）
            minDuration: 1,   // 最小录音时长（秒）
            audioType: 'audio/webm;codecs=opus',
            fallbackType: 'audio/wav',
            updateInterval: 100
        };
    }

    /**
     * 开始录音
     */
    async startRecording() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('浏览器不支持录音功能');
            }

            this.cleanupMedia();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.media.stream = stream;

            const mimeType = MediaRecorder.isTypeSupported(this.config.audioType)
                ? this.config.audioType
                : this.config.fallbackType;

            this.media.mediaRecorder = new MediaRecorder(stream, { mimeType });
            this.media.audioChunks = [];

            this.setupMediaRecorderEvents();
            this.media.mediaRecorder.start();

            this.state.set('recording.isRecording', true);
            this.state.set('recording.startTime', Date.now());
            this.startRecordingTimer();

            this.emit('recordingStarted');

        } catch (error) {
            this.emit('recordingError', error);
            throw error;
        }
    }

    /**
     * 停止录音
     */
    stopRecording() {
        try {
            if (this.media.mediaRecorder && this.state.get('recording.isRecording')) {
                this.media.mediaRecorder.stop();
                this.state.set('recording.isRecording', false);
                this.stopRecordingTimer();

                if (this.media.stream) {
                    this.media.stream.getTracks().forEach(track => track.stop());
                }

                this.emit('recordingStopped');
            }
        } catch (error) {
            this.emit('recordingError', error);
        }
    }

    /**
     * 设置MediaRecorder事件处理器
     */
    setupMediaRecorderEvents() {
        this.media.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.media.audioChunks.push(event.data);
            }
        };

        this.media.mediaRecorder.onstop = () => {
            this.processRecordedAudio();
        };

        this.media.mediaRecorder.onerror = (event) => {
            this.emit('recordingError', event.error);
        };
    }

    /**
     * 处理录制的音频
     */
    processRecordedAudio() {
        try {
            const startTime = this.state.get('recording.startTime');
            const actualDuration = startTime ? (Date.now() - startTime) / 1000 : 0;

            if (actualDuration < this.config.minDuration) {
                throw new Error(`录音时长太短，至少需要${this.config.minDuration}秒`);
            }

            const mimeType = this.media.mediaRecorder.mimeType;
            this.media.audioBlob = new Blob(this.media.audioChunks, { type: mimeType });
            this.media.audioUrl = URL.createObjectURL(this.media.audioBlob);

            this.media.audioElement = new Audio(this.media.audioUrl);

            this.media.audioElement.onloadedmetadata = () => {
                const duration = this.media.audioElement.duration || actualDuration;
                this.state.update({
                    'recording.duration': duration,
                    'recording.hasRecording': true
                });
                this.emit('recordingProcessed', { duration });
            };

            this.media.audioElement.onerror = () => {
                const duration = actualDuration;
                this.state.update({
                    'recording.duration': duration,
                    'recording.hasRecording': true
                });
                this.emit('recordingProcessed', { duration });
            };

        } catch (error) {
            this.emit('recordingError', error);
        }
    }

    /**
     * 开始播放
     */
    startPlayback() {
        if (!this.state.get('recording.hasRecording') || !this.media.audioElement) {
            throw new Error('没有可播放的录音');
        }

        try {
            const currentTime = this.state.get('recording.currentTime');
            this.media.audioElement.currentTime = currentTime;
            this.media.audioElement.play();

            this.state.update({
                'recording.isPlaying': true,
                'recording.isPaused': false
            });

            this.startPlaybackTimer();
            this.emit('playbackStarted');

        } catch (error) {
            this.emit('playbackError', error);
        }
    }

    /**
     * 暂停播放
     */
    pausePlayback() {
        if (this.media.audioElement) {
            this.media.audioElement.pause();
            
            this.state.update({
                'recording.isPlaying': false,
                'recording.isPaused': true,
                'recording.currentTime': this.media.audioElement.currentTime
            });

            this.stopPlaybackTimer();
            this.emit('playbackPaused');
        }
    }

    /**
     * 停止播放
     */
    stopPlayback() {
        if (this.media.audioElement) {
            this.media.audioElement.pause();
            this.media.audioElement.currentTime = 0;
        }

        this.state.update({
            'recording.isPlaying': false,
            'recording.isPaused': false,
            'recording.currentTime': 0
        });

        this.stopPlaybackTimer();
        this.emit('playbackStopped');
    }

    /**
     * 跳转到指定时间
     */
    seekTo(time) {
        const duration = this.state.get('recording.duration');
        const newTime = Math.max(0, Math.min(time, duration));
        
        this.state.set('recording.currentTime', newTime);
        
        if (this.media.audioElement) {
            this.media.audioElement.currentTime = newTime;
        }

        this.emit('seeked', { time: newTime });
    }

    /**
     * 清除录音
     */
    clearRecording() {
        this.stopPlayback();
        this.cleanupMedia();
        
        this.state.update({
            'recording.hasRecording': false,
            'recording.duration': 0,
            'recording.currentTime': 0
        });

        this.emit('recordingCleared');
    }

    /**
     * 开始录音计时器
     */
    startRecordingTimer() {
        this.timers.recording = setInterval(() => {
            const startTime = this.state.get('recording.startTime');
            if (startTime && this.state.get('recording.isRecording')) {
                const elapsed = (Date.now() - startTime) / 1000;

                if (elapsed >= this.config.maxDuration) {
                    this.stopRecording();
                    this.emit('recordingMaxDurationReached');
                    return;
                }

                this.emit('recordingProgress', { elapsed });
            }
        }, this.config.updateInterval);
    }

    /**
     * 停止录音计时器
     */
    stopRecordingTimer() {
        if (this.timers.recording) {
            clearInterval(this.timers.recording);
            this.timers.recording = null;
        }
    }

    /**
     * 开始播放计时器
     */
    startPlaybackTimer() {
        this.timers.playback = setInterval(() => {
            if (this.state.get('recording.isPlaying') && this.media.audioElement) {
                const currentTime = this.media.audioElement.currentTime;
                const duration = this.state.get('recording.duration');
                
                this.state.set('recording.currentTime', currentTime);
                this.emit('playbackProgress', { currentTime, duration });

                if (currentTime >= duration) {
                    this.stopPlayback();
                }
            }
        }, this.config.updateInterval);
    }

    /**
     * 停止播放计时器
     */
    stopPlaybackTimer() {
        if (this.timers.playback) {
            clearInterval(this.timers.playback);
            this.timers.playback = null;
        }
    }

    /**
     * 清理媒体资源
     */
    cleanupMedia() {
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

        this.stopRecordingTimer();
        this.stopPlaybackTimer();
    }

    /**
     * 获取录音Blob
     */
    getRecordingBlob() {
        return this.media.audioBlob;
    }

    /**
     * 销毁录音管理器
     */
    destroy() {
        this.cleanupMedia();
        this.off(); // 移除所有事件监听器
    }
}

/**
 * 数据渲染器
 * 处理各种数据的渲染逻辑
 */
class DataRenderer {
    constructor(stateManager, domCache) {
        this.state = stateManager;
        this.dom = domCache;
        this.converter = new showdown.Converter({
            openLinksInNewWindow: true,
            simplifiedAutoLink: true,
            splitAdjacentBlockquotes: true,
            strikethrough: true,
            tables: true,
            tasklists: true,
        });
    }

    /**
     * 渲染文章数据
     */
    renderArticles(articles) {
        const deviceInfo = this.state.get('deviceInfo');
        
        if (deviceInfo.isMobile) {
            this.renderArticlesMobile(articles);
        } else {
            this.renderArticlesDesktop(articles);
        }
    }

    /**
     * 桌面端文章渲染
     */
    renderArticlesDesktop(articles) {
        const tbody = this.dom.get('#articlesTableBody');
        tbody.empty();

        articles.forEach(article => {
            const row = this.createArticleRow(article);
            tbody.append(row);
        });

        this.dom.get('.table-container').show();
        this.dom.get('.mobile-cards').hide();
    }

    /**
     * 移动端文章渲染
     */
    renderArticlesMobile(articles) {
        const container = this.dom.get('#articlesMobileCards');
        container.empty();

        articles.forEach(article => {
            const card = this.createArticleCard(article);
            container.append(card);
        });

        this.dom.get('.table-container').hide();
        this.dom.get('.mobile-cards').show();
    }

    /**
     * 创建文章表格行
     */
    createArticleRow(article) {
        return $(`
            <tr>
                <td class="cell-title">
                    <a href="/article/read/${article.id}.html" title="${article.title}" target="_blank">
                        ${article.title}
                    </a>
                </td>
                <td class="cell-long-text">${article.introduction}</td>
                <td>${this.renderTags(article.tags)}</td>
                <td class="cell-status">${article.viewCount}</td>
                <td class="cell-status">${article.commentCount}</td>
                <td>${this.formatDateTime(article.createTime)}</td>
                <td class="cell-actions">
                    ${this.createActionButtons('article', article.id)}
                </td>
            </tr>
        `);
    }

    /**
     * 创建文章卡片
     */
    createArticleCard(article) {
        return $(`
            <div class="mobile-card">
                <div class="mobile-card-row">
                    <div class="mobile-card-label">标题</div>
                    <div class="mobile-card-content">
                        <a href="/article/read/${article.id}.html" target="_blank">
                            ${article.title}
                        </a>
                    </div>
                </div>
                <div class="mobile-card-row">
                    <div class="mobile-card-label">简介</div>
                    <div class="mobile-card-content">${article.introduction}</div>
                </div>
                <div class="mobile-card-row">
                    <div class="mobile-card-label">标签</div>
                    <div class="mobile-card-content">${this.renderTags(article.tags)}</div>
                </div>
                <div class="mobile-card-row">
                    <div class="mobile-card-label">统计</div>
                    <div class="mobile-card-content">
                        查看: ${article.viewCount} | 评论: ${article.commentCount}
                    </div>
                </div>
                <div class="mobile-card-row">
                    <div class="mobile-card-label">发布时间</div>
                    <div class="mobile-card-content">${this.formatDateTime(article.createTime)}</div>
                </div>
                <div class="mobile-card-row">
                    <div class="mobile-card-label">操作</div>
                    <div class="mobile-card-actions">
                        ${this.createActionButtons('article', article.id)}
                    </div>
                </div>
            </div>
        `);
    }

    /**
     * 渲染碎碎念数据
     */
    renderMumbles(mumbles) {
        const deviceInfo = this.state.get('deviceInfo');
        
        if (deviceInfo.isMobile) {
            this.renderMumblesMobile(mumbles);
        } else {
            this.renderMumblesDesktop(mumbles);
        }
    }

    /**
     * 桌面端碎碎念渲染
     */
    renderMumblesDesktop(mumbles) {
        const tbody = this.dom.get('#mumblesTableBody');
        tbody.empty();

        mumbles.forEach(mumble => {
            const row = $(`
                <tr>
                    <td class="cell-long-text">
                        <div class="markdown-body">${this.converter.makeHtml(mumble.markdown)}</div>
                    </td>
                    <td class="cell-status">${mumble.like}</td>
                    <td class="cell-status">${mumble.commentCount}</td>
                    <td>${this.formatDateTime(mumble.createTime)}</td>
                    <td class="cell-actions">
                        ${this.createActionButtons('mumble', mumble.id)}
                    </td>
                </tr>
            `);
            tbody.append(row);
        });

        this.dom.get('#mumbles-page .table-container').show();
        this.dom.get('#mumbles-page .mobile-cards').hide();
    }

    /**
     * 移动端碎碎念渲染
     */
    renderMumblesMobile(mumbles) {
        const container = this.dom.get('#mumblesMobileCards');
        container.empty();

        mumbles.forEach(mumble => {
            const card = $(`
                <div class="mobile-card">
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">内容</div>
                        <div class="mobile-card-content markdown-body">
                            ${this.converter.makeHtml(mumble.markdown)}
                        </div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">统计</div>
                        <div class="mobile-card-content">
                            点赞: ${mumble.like} | 评论: ${mumble.commentCount}
                        </div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">发布时间</div>
                        <div class="mobile-card-content">${this.formatDateTime(mumble.createTime)}</div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">操作</div>
                        <div class="mobile-card-actions">
                            ${this.createActionButtons('mumble', mumble.id)}
                        </div>
                    </div>
                </div>
            `);
            container.append(card);
        });

        this.dom.get('#mumbles-page .table-container').hide();
        this.dom.get('#mumbles-page .mobile-cards').show();
    }

    /**
     * 渲染时间轴数据
     */
    renderTimeline(timeline) {
        const deviceInfo = this.state.get('deviceInfo');
        
        if (deviceInfo.isMobile) {
            this.renderTimelineMobile(timeline);
        } else {
            this.renderTimelineDesktop(timeline);
        }
    }

    /**
     * 桌面端时间轴渲染
     */
    renderTimelineDesktop(timeline) {
        const tbody = this.dom.get('#timelineTableBody');
        tbody.empty();

        timeline.forEach(item => {
            const row = $(`
                <tr>
                    <td class="cell-title">${item.title}</td>
                    <td class="cell-long-text">
                        <div class="markdown-body">${this.converter.makeHtml(item.content)}</div>
                    </td>
                    <td>${moment(item.date).format("YYYY/MM/DD")}</td>
                    <td>${item.more ? `<a href="${item.more}" target="_blank">链接</a>` : '-'}</td>
                    <td>${this.formatDateTime(item.createTime)}</td>
                    <td class="cell-actions">
                        ${this.createActionButtons('timeline', item.id)}
                    </td>
                </tr>
            `);
            tbody.append(row);
        });

        this.dom.get('#timeline-page .table-container').show();
        this.dom.get('#timeline-page .mobile-cards').hide();
    }

    /**
     * 桌面端相册渲染
     */
    renderPhotos(photos) {
        const deviceInfo = this.state.get('deviceInfo');
        
        if (deviceInfo.isMobile) {
            this.renderPhotosMobile(photos);
        } else {
            this.renderPhotosDesktop(photos);
        }
    }

    /**
     * 桌面端相册渲染
     */
    renderPhotosDesktop(photos) {
        const grid = this.dom.get('#photosGrid');
        grid.empty();

        photos.forEach(photo => {
            const card = $(`
                <div class="photo-card">
                    <img src="${photo.accessUrl}!albums" alt="${photo.description}" class="photo-image">
                    <div class="photo-info">
                        <div class="photo-title">${photo.description || ""}</div>
                        <div class="photo-meta">${this.formatDateTime(photo.uploadTime)}</div>
                        <div class="photo-tags">${this.renderTags(photo.tags)}</div>
                        <div class="photo-actions">
                            ${this.createActionButtons('photo', photo.id)}
                        </div>
                    </div>
                </div>
            `);
            grid.append(card);
        });

        this.dom.get('#photos-page .photos-grid').show();
        this.dom.get('#photos-page .mobile-photos-grid').hide();
    }

    /**
     * 移动端相册渲染
     */
    renderPhotosMobile(photos) {
        const container = this.dom.get('#photosMobileGrid');
        container.empty();

        photos.forEach(photo => {
            const card = $(`
                <div class="mobile-photo-card">
                    <img src="${photo.accessUrl}!albums" alt="${photo.description}" class="mobile-photo-image">
                    <div class="mobile-photo-info">
                        <div class="mobile-photo-title">${photo.description || ""}</div>
                        <div class="mobile-photo-meta">${this.formatDateTime(photo.uploadTime)}</div>
                        <div class="mobile-photo-tags">${this.renderTags(photo.tags)}</div>
                        <div class="mobile-photo-actions">
                            ${this.createActionButtons('photo', photo.id)}
                        </div>
                    </div>
                </div>
            `);
            container.append(card);
        });

        this.dom.get('#photos-page .photos-grid').hide();
        this.dom.get('#photos-page .mobile-photos-grid').show();
    }

    /**
     * 渲染标签
     */
    renderTags(tags) {
        if (!tags || tags.length === 0) return '';
        return tags.map(tag => `<span class="photo-tag">${tag}</span>`).join('');
    }

    /**
     * 创建操作按钮
     */
    createActionButtons(type, id) {
        return `
            <button class="btn btn-sm btn-primary" onclick="memberCenter.edit${this.capitalize(type)}('${id}')">
                <i class="fa fa-edit"></i> 修改
            </button>
            <button class="btn btn-sm btn-danger" onclick="memberCenter.deleteItem('${type}', '${id}')">
                <i class="fa fa-trash"></i> 删除
            </button>
        `;
    }

    /**
     * 格式化日期时间
     */
    formatDateTime(dateTime) {
        return moment(dateTime).format("YYYY/MM/DD HH:mm:ss");
    }

    /**
     * 首字母大写
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

/**
 * 分页管理器
 * 处理分页逻辑和渲染
 */
class PaginationManager {
    constructor(stateManager) {
        this.state = stateManager;
        this.maxVisiblePages = 5;
    }

    /**
     * 渲染分页
     * @param {string} type - 页面类型
     * @param {number} totalPages - 总页数
     * @param {number} currentPage - 当前页
     */
    renderPagination(type, totalPages, currentPage) {
        const paginationId = `${type}Pagination`;
        const pagination = $(`#${paginationId}`);
        pagination.empty();

        if (totalPages <= 1) return;

        // 上一页
        this.addPreviousButton(pagination, currentPage, type);
        
        // 页码
        this.addPageNumbers(pagination, totalPages, currentPage, type);
        
        // 下一页
        this.addNextButton(pagination, totalPages, currentPage, type);
    }

    /**
     * 添加上一页按钮
     */
    addPreviousButton(pagination, currentPage, type) {
        const disabled = currentPage <= 1;
        const prevPage = currentPage - 1;
        
        if (disabled) {
            pagination.append(`
                <li class="page-item disabled">
                    <span class="page-link" tabindex="-1">
                        <i class="fa fa-chevron-left"></i>
                    </span>
                </li>
            `);
        } else {
            const url = this.generatePageUrl(type, prevPage);
            pagination.append(`
                <li class="page-item">
                    <a class="page-link" href="${url}">
                        <i class="fa fa-chevron-left"></i>
                    </a>
                </li>
            `);
        }
    }

    /**
     * 添加页码
     */
    addPageNumbers(pagination, totalPages, currentPage, type) {
        const { startPage, endPage } = this.calculatePageRange(totalPages, currentPage);

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage;
            
            if (isActive) {
                pagination.append(`
                    <li class="page-item active">
                        <span class="page-link">${i}</span>
                    </li>
                `);
            } else {
                const url = this.generatePageUrl(type, i);
                pagination.append(`
                    <li class="page-item">
                        <a class="page-link" href="${url}">${i}</a>
                    </li>
                `);
            }
        }
    }

    /**
     * 添加下一页按钮
     */
    addNextButton(pagination, totalPages, currentPage, type) {
        const disabled = currentPage >= totalPages;
        const nextPage = currentPage + 1;
        
        if (disabled) {
            pagination.append(`
                <li class="page-item disabled">
                    <span class="page-link" tabindex="-1">
                        <i class="fa fa-chevron-right"></i>
                    </span>
                </li>
            `);
        } else {
            const url = this.generatePageUrl(type, nextPage);
            pagination.append(`
                <li class="page-item">
                    <a class="page-link" href="${url}">
                        <i class="fa fa-chevron-right"></i>
                    </a>
                </li>
            `);
        }
    }

    /**
     * 计算页码范围
     */
    calculatePageRange(totalPages, currentPage) {
        let startPage = 1;
        let endPage = totalPages;

        if (totalPages > this.maxVisiblePages) {
            const halfVisible = Math.floor(this.maxVisiblePages / 2);

            if (currentPage <= halfVisible + 1) {
                endPage = this.maxVisiblePages;
            } else if (currentPage >= totalPages - halfVisible) {
                startPage = totalPages - this.maxVisiblePages + 1;
            } else {
                startPage = currentPage - halfVisible;
                endPage = currentPage + halfVisible;
            }
        }

        return { startPage, endPage };
    }

    /**
     * 生成分页URL
     */
    generatePageUrl(type, pageNum) {
        const params = {};
        const pageSize = this.state.get('pageSize');
        
        if (pageNum !== 1) {
            params.pageIndex = pageNum;
        }
        
        if (pageSize !== 10) {
            params.pageSize = pageSize;
        }

        const queryString = this.buildQueryString(params);
        return `#${type}${queryString}`;
    }

    /**
     * 构建查询字符串
     */
    buildQueryString(params) {
        const pairs = [];
        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined && value !== '') {
                pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }
        return pairs.length > 0 ? `?${pairs.join('&')}` : '';
    }
}

// 导出组件
window.MemberComponents = {
    RecordingManager,
    DataRenderer,
    PaginationManager
}; 