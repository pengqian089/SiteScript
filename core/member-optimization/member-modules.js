/**
 * 个人中心功能模块
 * @version 1.0
 * @author pengqiang
 */

'use strict';

/**
 * API管理器
 * 统一管理所有API请求
 */
class APIManager extends MemberBase.EventEmitter {
    constructor() {
        super();
        this.baseHeaders = {
            'Content-Type': 'application/json'
        };
        this.requestQueue = new Map();
        this.retryOptions = {
            maxRetries: 3,
            delay: 1000
        };
    }

    /**
     * 通用请求方法
     * @param {string} url - 请求URL
     * @param {Object} options - 请求选项
     * @returns {Promise} 响应Promise
     */
    async request(url, options = {}) {
        const requestId = MemberBase.Utils.generateId('req');
        
        try {
            this.emit('requestStart', { url, requestId });
            
            const response = await MemberBase.Utils.retry(async () => {
                return await fetch(url, {
                    ...options,
                    headers: {
                        ...this.baseHeaders,
                        ...options.headers
                    }
                });
            }, this.retryOptions.maxRetries, this.retryOptions.delay);
            
            const result = await response.json();
            
            this.emit('requestEnd', { url, requestId, success: result.success });
            
            if (!result.success) {
                throw new Error(result.msg || '请求失败');
            }
            
            return result;
        } catch (error) {
            this.emit('requestError', { url, requestId, error });
            throw error;
        }
    }

    /**
     * GET请求
     */
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    }

    /**
     * POST请求
     */
    async post(url, data = {}) {
        const options = {
            method: 'POST'
        };
        
        if (data instanceof FormData) {
            options.body = data;
            // FormData不需要设置Content-Type
            delete this.baseHeaders['Content-Type'];
        } else {
            options.body = JSON.stringify(data);
            options.headers = { ...this.baseHeaders };
        }
        
        return this.request(url, options);
    }

    /**
     * 文件上传
     */
    async upload(url, file, extraData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.entries(extraData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        return this.post(url, formData);
    }

    // 具体的API方法
    
    /**
     * 用户相关API
     */
    user = {
        getInfo: () => this.get('/my/info'),
        updateProfile: (data) => this.post('/Account/UpdateProfile', data),
        updateAvatar: (file) => this.upload('/Account/UpdateAvatar', file),
        bindTwoFactor: (pinCode) => this.post('/my/bind-two-factor', { pinCode }),
        unbindTwoFactor: (pinCode) => this.post('/my/unbind-two-factor', { pinCode }),
        generateTwoFactor: () => this.get('/my/two-factor')
    };

    /**
     * 文章相关API
     */
    article = {
        list: (params) => this.get('/Article/MyArticle', params),
        detail: (id) => this.get(`/Article/Detail/${id}`),
        publish: (data) => this.post('/Article/Publish', data),
        delete: (id) => this.post('/Article/Delete', { id }),
        tags: () => this.get('/Article/Tags'),
        upload: (file) => this.upload('/Article/Upload', file)
    };

    /**
     * 碎碎念相关API
     */
    mumble = {
        list: (params) => this.get('/Talk/MyTalk', params),
        detail: (id) => this.get(`/Talk/Detail/${id}`),
        publish: (data) => this.post('/Talk/Publish', data),
        delete: (id) => this.post('/Talk/Delete', { id }),
        upload: (file) => this.upload('/Talk/Upload', file)
    };

    /**
     * 时间轴相关API
     */
    timeline = {
        list: (params) => this.get('/Timeline/MyTimeline', params),
        detail: (id) => this.get(`/Timeline/Detail/${id}`),
        publish: (data) => this.post('/Timeline/Publish', data),
        delete: (id) => this.post('/Timeline/Delete', { id }),
        upload: (file) => this.upload('/Timeline/Upload', file)
    };

    /**
     * 相册相关API
     */
    photo = {
        list: (params) => this.get('/my/photos', params),
        detail: (id) => this.get(`/my/photos/get/${id}`),
        publish: (data) => this.post('/my/photos/publish', data),
        delete: (id) => this.post('/my/photos/delete', { id }),
        tags: () => this.get('/my/photos/tags')
    };

    /**
     * 音频相关API
     */
    audio = {
        upload: (file, duration) => {
            const formData = new FormData();
            formData.append('record', file, 'recording.webm');
            formData.append('duration', duration);
            return this.post('/Audio/Upload', formData);
        }
    };
}

/**
 * 状态管理器
 * 统一管理应用状态
 */
class StateManager extends MemberBase.EventEmitter {
    constructor() {
        super();
        this.state = {
            // 页面状态
            currentPage: 'profile',
            currentPageNum: 1,
            pageSize: 10,
            
            // 用户信息
            userInfo: null,
            
            // UI状态
            loading: false,
            theme: 'light',
            deviceInfo: null,
            
            // 录音状态
            recording: {
                isRecording: false,
                isPaused: false,
                isPlaying: false,
                duration: 0,
                currentTime: 0,
                hasRecording: false
            },
            
            // 模态框状态
            modals: {
                publish: false,
                delete: false,
                twoFactor: false
            },
            
            // 数据缓存
            cache: new Map(),
            
            // 当前删除项目
            currentDeleteItem: null
        };
        
        this.storage = new MemberBase.StorageManager();
        this.loadPersistedState();
    }

    /**
     * 获取状态
     * @param {string} path - 状态路径，用.分隔
     * @returns {any} 状态值
     */
    get(path) {
        return this.getNestedValue(this.state, path);
    }

    /**
     * 设置状态
     * @param {string} path - 状态路径
     * @param {any} value - 状态值
     * @param {boolean} persist - 是否持久化
     */
    set(path, value, persist = false) {
        const oldValue = this.get(path);
        this.setNestedValue(this.state, path, value);
        
        this.emit('stateChange', { path, value, oldValue });
        this.emit(`stateChange:${path}`, { value, oldValue });
        
        if (persist) {
            this.persistState(path, value);
        }
    }

    /**
     * 更新状态（批量）
     * @param {Object} updates - 更新对象
     * @param {boolean} persist - 是否持久化
     */
    update(updates, persist = false) {
        Object.entries(updates).forEach(([path, value]) => {
            this.set(path, value, persist);
        });
    }

    /**
     * 获取嵌套值
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * 设置嵌套值
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    /**
     * 持久化状态
     */
    persistState(path, value) {
        this.storage.set(`state.${path}`, value);
    }

    /**
     * 加载持久化状态
     */
    loadPersistedState() {
        const theme = this.storage.get('state.theme', 'light');
        const pageSize = this.storage.get('state.pageSize', 10);
        
        this.set('theme', theme);
        this.set('pageSize', pageSize);
    }

    /**
     * 缓存数据
     * @param {string} key - 缓存键
     * @param {any} data - 缓存数据
     * @param {number} ttl - 过期时间（毫秒）
     */
    cache(key, data, ttl = 5 * 60 * 1000) { // 默认5分钟
        const cacheItem = {
            data,
            timestamp: Date.now(),
            ttl
        };
        this.state.cache.set(key, cacheItem);
    }

    /**
     * 获取缓存数据
     * @param {string} key - 缓存键
     * @returns {any} 缓存数据
     */
    getCache(key) {
        const item = this.state.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > item.ttl) {
            this.state.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    /**
     * 清理过期缓存
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, item] of this.state.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                this.state.cache.delete(key);
            }
        }
    }
}

/**
 * UI管理器
 * 统一管理UI相关操作
 */
class UIManager extends MemberBase.EventEmitter {
    constructor(stateManager, domCache) {
        super();
        this.state = stateManager;
        this.dom = domCache;
        this.toastContainer = null;
        
        this.init();
    }

    /**
     * 初始化UI管理器
     */
    init() {
        this.setupEventListeners();
        this.initToastContainer();
        this.updateDeviceInfo();
        
        // 监听窗口大小变化
        const debouncedResize = MemberBase.Utils.debounce(() => {
            this.updateDeviceInfo();
            this.handleResize();
        }, 250);
        
        $(window).on('resize', debouncedResize);
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 监听状态变化
        this.state.on('stateChange:theme', ({ value }) => {
            this.setTheme(value);
        });
        
        this.state.on('stateChange:loading', ({ value }) => {
            this.toggleLoading(value);
        });
        
        this.state.on('stateChange:modals', ({ value }) => {
            this.updateModals(value);
        });
    }

    /**
     * 更新设备信息
     */
    updateDeviceInfo() {
        const deviceInfo = MemberBase.Utils.getDeviceInfo();
        this.state.set('deviceInfo', deviceInfo);
        this.emit('deviceChange', deviceInfo);
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const deviceInfo = this.state.get('deviceInfo');
        
        // 大屏幕时关闭移动端菜单
        if (deviceInfo.isDesktop) {
            this.closeMobileMenu();
        }
        
        this.emit('resize', deviceInfo);
    }

    /**
     * 设置主题
     */
    setTheme(theme) {
        $('html').attr('data-theme', theme);
        this.state.set('theme', theme, true); // 持久化主题设置
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = this.state.get('theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * 显示/隐藏加载状态
     */
    toggleLoading(show, message = '加载中...') {
        const loadingOverlay = this.dom.get('#loadingOverlay');
        
        if (show) {
            const loadingText = loadingOverlay.find('p');
            if (loadingText.length > 0) {
                loadingText.text(message);
            }
            loadingOverlay.show();
        } else {
            loadingOverlay.hide();
        }
    }

    /**
     * 显示消息提示
     */
    showMessage(message, type = 'info', options = {}) {
        const messageId = MemberBase.Utils.generateId('msg');
        const config = this.getMessageConfig(type);
        
        const toast = this.createToast(messageId, message, config, options);
        this.appendToast(toast);
        this.animateToast(toast, messageId, options.duration || 4000);
        
        return messageId;
    }

    /**
     * 获取消息配置
     */
    getMessageConfig(type) {
        const configs = {
            success: { icon: 'fa-check-circle', color: '#059669' },
            error: { icon: 'fa-times-circle', color: '#dc2626' },
            warning: { icon: 'fa-exclamation-triangle', color: '#d97706' },
            info: { icon: 'fa-info-circle', color: '#2563eb' }
        };
        
        return configs[type] || configs.info;
    }

    /**
     * 创建Toast元素
     */
    createToast(messageId, message, config, options) {
        const toast = $(`
            <div class="toast-message" id="${messageId}">
                <div class="toast-content">
                    <div class="toast-icon">
                        <i class="fa ${config.icon}"></i>
                    </div>
                    <div class="toast-text">${message}</div>
                    ${!options.persistent ? '<button type="button" class="toast-close"><i class="fa fa-times"></i></button>' : ''}
                </div>
                <div class="toast-progress">
                    <div class="toast-progress-bar"></div>
                </div>
            </div>
        `);
        
        toast.css('--toast-color', config.color);
        return toast;
    }

    /**
     * 初始化Toast容器
     */
    initToastContainer() {
        this.toastContainer = this.dom.get('#toast-container');
        if (this.toastContainer.length === 0) {
            this.toastContainer = $('<div id="toast-container"></div>');
            $('body').append(this.toastContainer);
        }
    }

    /**
     * 添加Toast到容器
     */
    appendToast(toast) {
        this.toastContainer.append(toast);
    }

    /**
     * Toast动画效果
     */
    animateToast(toast, messageId, duration) {
        // 入场动画
        setTimeout(() => toast.addClass('toast-show'), 10);
        
        // 进度条动画
        setTimeout(() => {
            toast.find('.toast-progress-bar').addClass('toast-progress-active');
        }, 100);
        
        // 绑定关闭事件
        toast.find('.toast-close').on('click', () => {
            this.hideMessage(messageId);
        });
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => this.hideMessage(messageId), duration);
        }
    }

    /**
     * 隐藏消息
     */
    hideMessage(messageId) {
        const toast = $(`#${messageId}`);
        if (toast.length === 0) return;
        
        toast.addClass('toast-hide');
        setTimeout(() => {
            toast.remove();
            if (this.toastContainer.children().length === 0) {
                this.toastContainer.hide();
            }
        }, 300);
    }

    /**
     * 移动端菜单控制
     */
    toggleMobileMenu() {
        const sidebar = this.dom.get('.member-sidebar');
        const overlay = this.dom.get('#sidebarOverlay');
        
        sidebar.toggleClass('active');
        overlay.toggleClass('active');
    }

    closeMobileMenu() {
        const sidebar = this.dom.get('.member-sidebar');
        const overlay = this.dom.get('#sidebarOverlay');
        
        sidebar.removeClass('active');
        overlay.removeClass('active');
    }

    /**
     * 模态框管理
     */
    showModal(modalId, content = null) {
        const modal = this.dom.get(`#${modalId}`);
        if (content) {
            modal.find('.modal-body, #modalBody').html(content);
        }
        modal.show();
        
        // 更新状态
        const modals = this.state.get('modals');
        modals[modalId.replace('Modal', '')] = true;
        this.state.set('modals', modals);
    }

    hideModal(modalId) {
        this.dom.get(`#${modalId}`).hide();
        
        // 更新状态
        const modals = this.state.get('modals');
        modals[modalId.replace('Modal', '')] = false;
        this.state.set('modals', modals);
    }

    /**
     * 更新模态框状态
     */
    updateModals(modals) {
        Object.entries(modals).forEach(([key, isOpen]) => {
            const modalId = `${key}Modal`;
            const modal = this.dom.get(`#${modalId}`);
            
            if (isOpen) {
                modal.show();
            } else {
                modal.hide();
            }
        });
    }

    /**
     * 导航管理
     */
    updateNavigation(activePage) {
        const navItems = this.dom.get('.nav-item');
        navItems.removeClass('active');
        navItems.filter(`[data-page="${activePage}"]`).addClass('active');
        
        // 更新页面显示
        const contentPages = this.dom.get('.content-page');
        contentPages.removeClass('active');
        this.dom.get(`#${activePage}-page`).addClass('active');
    }

    /**
     * 更新面包屑
     */
    updateBreadcrumb(pageName) {
        this.dom.get('#currentPageTitle').text(pageName);
    }
}

// 导出模块
window.MemberModules = {
    APIManager,
    StateManager,
    UIManager
}; 