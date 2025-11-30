/**
 * 个人中心优化版本
 * 使用模块化架构重构，提高可维护性和性能
 * @version 2.0
 * @author pengqiang
 */

'use strict';

// 常量配置 - 优化后的配置
const MEMBER_CONFIG = {
    PAGES: {
        PROFILE: 'profile',
        ARTICLES: 'articles',
        MUMBLES: 'mumbles',
        TIMELINE: 'timeline',
        PHOTOS: 'photos'
    },

    PAGE_NAMES: {
        profile: '基本设置',
        articles: '我的文章',
        mumbles: '我的碎碎念',
        timeline: '我的时间轴',
        photos: '我的相册'
    },

    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        DEFAULT_PAGE_NUM: 1,
        MAX_VISIBLE_PAGES: 5
    },

    BREAKPOINTS: {
        MOBILE: 480,
        TABLET: 768,
        DESKTOP: 1024
    },

    DELAYS: {
        LOADING: 500,
        API_MOCK: 1000,
        UPLOAD: 2000,
        TOAST_AUTO_HIDE: 4000,
        TOAST_HIDE_ANIMATION: 300,
        DEBOUNCE: 250,
        THROTTLE: 100
    },

    RECORDING: {
        MAX_DURATION: 600,
        MIN_DURATION: 1,
        AUDIO_TYPE: 'audio/webm;codecs=opus',
        FALLBACK_TYPE: 'audio/wav',
        UPDATE_INTERVAL: 100
    },

    SELECTORS: {
        // 导航相关
        navItem: '.nav-item',
        navItemLink: '.nav-item a',
        contentPage: '.content-page',
        currentPageTitle: '#currentPageTitle',

        // 布局相关
        menuToggle: '#menuToggle',
        sidebarOverlay: '#sidebarOverlay',
        memberSidebar: '.member-sidebar',
        tableContainer: '.table-container',
        photosGrid: '.photos-grid',
        mobileCards: '.mobile-cards',
        mobilePhotosGrid: '.mobile-photos-grid',

        // 模态框相关
        publishModal: '#publishModal',
        deleteModal: '#deleteModal',
        twoFactorModal: '#twoFactorModal',
        modalBody: '#modalBody',
        modalTitle: '#modalTitle',
        confirmPublish: '#confirmPublish',

        // 加载相关
        loadingOverlay: '#loadingOverlay',
        toastContainer: '#toast-container'
    }
};

/**
 * 个人中心主类 - 优化版本
 * 使用组合模式，将各个功能模块组合起来
 */
class MemberCenterOptimized extends MemberBase.EventEmitter {
    constructor() {
        super();
        
        // 初始化各个管理器
        this.initializeManagers();
        
        // 初始化应用
        this.initialize();
    }

    /**
     * 初始化各个管理器
     */
    initializeManagers() {
        // DOM缓存管理器
        this.dom = new MemberBase.DOMCache();
        
        // 状态管理器
        this.state = new MemberModules.StateManager();
        
        // API管理器
        this.api = new MemberModules.APIManager();
        
        // UI管理器
        this.ui = new UIManagerExtended(this.state, this.dom);
        
        // 功能组件
        this.recording = new MemberComponents.RecordingManager(this.state);
        this.renderer = new MemberComponents.DataRenderer(this.state, this.dom);
        this.pagination = new MemberComponents.PaginationManager(this.state);
        
        // 错误处理器
        this.errorHandler = new MemberBase.ErrorHandler();
        
        // 存储管理器
        this.storage = new MemberBase.StorageManager();
        
        // 编辑器实例
        this.cherryInstance = null;
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
     * 初始化应用
     */
    async initialize() {
        try {
            // 设置错误处理
            this.setupErrorHandling();
            
            // 绑定事件
            this.bindEvents();
            
            // 加载用户信息
            await this.loadUserInfo();
            
            // 初始化主题
            this.initTheme();
            
            // 从URL初始化页面
            await this.initPageFromHash();
            
            // 初始化布局
            this.initLayoutVisibility();
            
            // 启动定时清理
            this.startPeriodicCleanup();
            
            this.emit('initialized');
            console.log('个人中心初始化成功');
            
        } catch (error) {
            this.errorHandler.reportError(error, { context: 'initialization' });
            this.ui.showMessage('系统初始化失败，请刷新页面重试', 'error');
        }
    }

    /**
     * 设置错误处理
     */
    setupErrorHandling() {
        this.errorHandler.onError((errorInfo) => {
            console.error('全局错误:', errorInfo);
            
            // 根据错误类型显示不同的提示
            let message = '系统出现错误';
            
            if (errorInfo.type === 'javascript') {
                message = '页面脚本错误，请刷新页面';
            } else if (errorInfo.type === 'promise') {
                message = '网络请求错误，请检查网络连接';
            }
            
            this.ui.showMessage(message, 'error');
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.bindNavigationEvents();
        this.bindMobileMenuEvents();
        this.bindWindowEvents();
        this.bindProfileEvents();
        this.bindContentEvents();
        this.bindModalEvents();
        this.bindKeyboardEvents();
        this.bindModuleEvents();
    }

    /**
     * 绑定模块间通信事件
     */
    bindModuleEvents() {
        // API请求事件
        this.api.on('requestStart', () => {
            this.state.set('loading', true);
        });

        this.api.on('requestEnd', () => {
            this.state.set('loading', false);
        });

        this.api.on('requestError', ({ error }) => {
            this.state.set('loading', false);
            this.ui.showMessage(error.message || '请求失败', 'error');
        });

        // 录音事件
        this.recording.on('recordingStarted', () => {
            this.ui.showMessage('开始录音', 'success');
        });

        this.recording.on('recordingStopped', () => {
            this.ui.showMessage('录音完成', 'success');
        });

        this.recording.on('recordingError', ({ error }) => {
            this.ui.showMessage(error.message || '录音失败', 'error');
        });

        this.recording.on('recordingMaxDurationReached', () => {
            this.ui.showMessage(`已达到最大录音时长${MEMBER_CONFIG.RECORDING.MAX_DURATION}秒`, 'warning');
        });

        // 状态变化事件
        this.state.on('stateChange:currentPage', ({ value }) => {
            this.handlePageChange(value);
        });

        // UI事件
        this.ui.on('resize', () => {
            this.handleResize();
        });
    }

    /**
     * 使用事件委托绑定导航事件
     */
    bindNavigationEvents() {
        // 使用事件委托提高性能
        $(document).on('click', MEMBER_CONFIG.SELECTORS.navItemLink, 
            MemberBase.Utils.debounce(async (e) => {
                e.preventDefault();
                const page = $(e.currentTarget).parent().data('page');
                await this.switchPage(page);
                this.ui.closeMobileMenu();
            }, MEMBER_CONFIG.DELAYS.DEBOUNCE)
        );

        // 监听hash变化
        $(window).on('hashchange', 
            MemberBase.Utils.debounce(() => {
                this.handleHashChange();
            }, MEMBER_CONFIG.DELAYS.DEBOUNCE)
        );
    }

    /**
     * 绑定移动端菜单事件
     */
    bindMobileMenuEvents() {
        $(document).on('click', MEMBER_CONFIG.SELECTORS.menuToggle, () => {
            this.ui.toggleMobileMenu();
        });

        $(document).on('click', MEMBER_CONFIG.SELECTORS.sidebarOverlay, () => {
            this.ui.closeMobileMenu();
        });
    }

    /**
     * 绑定窗口事件
     */
    bindWindowEvents() {
        const debouncedResize = MemberBase.Utils.debounce(() => {
            this.handleResize();
        }, MEMBER_CONFIG.DELAYS.DEBOUNCE);

        $(window).on('resize', debouncedResize);
    }

    /**
     * 绑定个人资料事件
     */
    bindProfileEvents() {
        // 使用事件委托和防抖
        $(document).on('click', '#saveProfile', 
            MemberBase.Utils.debounce(() => this.saveProfile(), MEMBER_CONFIG.DELAYS.DEBOUNCE)
        );

        $(document).on('click', '#logout', () => this.logout());
        $(document).on('click', '#uploadAvatar', () => $('#avatarFile').click());
        
        $(document).on('change', '#avatarFile', 
            MemberBase.Utils.debounce((e) => this.handleAvatarUpload(e), MEMBER_CONFIG.DELAYS.DEBOUNCE)
        );

        $(document).on('click', '#bindTwoFactor', () => this.showTwoFactorModal());
        $(document).on('click', '#closeTwoFactorModal', () => this.ui.hideModal('twoFactorModal'));
        $(document).on('click', '#confirmTwoFactor', () => this.confirmTwoFactor());
        $(document).on('click', '#copySecretKey', () => this.copySecretKey());
        $(document).on('click', '#cancelTwoFactor', () => this.ui.hideModal('twoFactorModal'));
    }

    /**
     * 绑定内容相关事件
     */
    bindContentEvents() {
        // 新建内容
        $(document).on('click', '#newArticle', () => this.showArticleModal());
        $(document).on('click', '#newMumble', () => this.showMumbleModal());
        $(document).on('click', '#newTimeline', () => this.showTimelineModal());
        $(document).on('click', '#uploadPhoto', () => this.showPhotoModal());

        // 搜索功能 - 使用防抖
        const debouncedSearch = MemberBase.Utils.debounce(() => {
            this.searchCurrentPage();
        }, MEMBER_CONFIG.DELAYS.DEBOUNCE);

        $(document).on('click', '#searchArticles, #searchMumbles, #searchTimeline, #searchPhotos', debouncedSearch);
    }

    /**
     * 绑定模态框事件
     */
    bindModalEvents() {
        $(document).on('click', '#closeModal', () => this.ui.hideModal('publishModal'));
        $(document).on('click', '#cancelPublish', () => this.ui.hideModal('publishModal'));
        $(document).on('click', MEMBER_CONFIG.SELECTORS.confirmPublish, () => this.confirmPublish());

        $(document).on('click', '#closeDeleteModal', () => this.ui.hideModal('deleteModal'));
        $(document).on('click', '#cancelDelete', () => this.ui.hideModal('deleteModal'));
        $(document).on('click', '#confirmDelete', () => this.confirmDelete());

        // 点击背景关闭模态框
        $(document).on('click', '.modal-overlay', (e) => {
            if (e.target === e.currentTarget) {
                this.closeAllModals();
            }
        });
    }

    /**
     * 绑定键盘事件
     */
    bindKeyboardEvents() {
        $(document).on('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * 页面切换
     */
    async switchPage(page, resetPageIndex = true) {
        if (!this.isValidPage(page)) {
            console.warn('无效的页面标识:', page);
            return;
        }

        try {
            const currentPage = this.state.get('currentPage');
            const isPageChanged = page !== currentPage;

            // 避免重复处理相同页面
            if (!isPageChanged && !resetPageIndex) {
                return;
            }

            // 暂时禁用状态监听以避免重复触发
            this._switchingPage = true;

            if (isPageChanged && resetPageIndex) {
                this.state.set('currentPageNum', MEMBER_CONFIG.PAGINATION.DEFAULT_PAGE_NUM);
            }

            if (isPageChanged) {
                this.state.set('currentPage', page);
                // 直接更新UI（因为状态监听被暂时禁用）
                this.ui.updateNavigation(page);
                this.ui.updateBreadcrumb(MEMBER_CONFIG.PAGE_NAMES[page]);
                // 加载数据
                await this.loadPageData();
            } else {
                // 只是分页参数变化，只需要重新加载数据
                await this.loadPageData();
            }
            
            // 更新URL
            this.updateURL();

        } catch (error) {
            this.errorHandler.reportError(error, { context: 'page switch', page });
        } finally {
            // 重新启用状态监听
            this._switchingPage = false;
        }
    }

    /**
     * 处理页面变化
     */
    async handlePageChange(newPage) {
        // 如果正在切换页面，跳过状态监听处理（避免重复触发）
        if (this._switchingPage) {
            return;
        }

        // 更新导航状态
        this.ui.updateNavigation(newPage);
        
        // 更新面包屑
        this.ui.updateBreadcrumb(MEMBER_CONFIG.PAGE_NAMES[newPage] || MEMBER_CONFIG.PAGE_NAMES.profile);
        
        // 加载页面数据
        await this.loadPageData();
    }

    /**
     * 从Hash初始化页面
     */
    async initPageFromHash() {
        try {
            const hash = window.location.hash.substring(1);
            const [page, queryString] = hash.split('?');
            const params = this.parseQueryString(queryString);

            if (page && this.isValidPage(page)) {
                // 静默设置分页参数（不触发状态监听）
                const currentPageNum = parseInt(params.pageIndex) || MEMBER_CONFIG.PAGINATION.DEFAULT_PAGE_NUM;
                const pageSize = parseInt(params.pageSize) || MEMBER_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
                
                this.state.state.currentPageNum = currentPageNum;
                this.state.state.pageSize = pageSize;

                await this.switchPage(page, false);
            } else {
                await this.switchPage(MEMBER_CONFIG.PAGES.PROFILE);
            }
        } catch (error) {
            this.errorHandler.reportError(error, { context: 'init from hash' });
            await this.switchPage(MEMBER_CONFIG.PAGES.PROFILE);
        }
    }

    /**
     * 处理Hash变化
     */
    async handleHashChange() {
        // 避免无限循环
        if (this.updatingURL) return;
        
        await this.initPageFromHash();
    }

    /**
     * 更新URL
     */
    updateURL() {
        const currentPage = this.state.get('currentPage');
        const currentPageNum = this.state.get('currentPageNum');
        const pageSize = this.state.get('pageSize');

        const params = {};
        if (currentPageNum !== MEMBER_CONFIG.PAGINATION.DEFAULT_PAGE_NUM) {
            params.pageIndex = currentPageNum;
        }
        if (pageSize !== MEMBER_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE) {
            params.pageSize = pageSize;
        }

        const queryString = this.buildQueryString(params);
        const newHash = `${currentPage}${queryString}`;

        this.updatingURL = true;
        if (window.location.hash.substring(1) !== newHash) {
            history.replaceState(null, null, `#${newHash}`);
        }
        this.updatingURL = false;
    }

    /**
     * 加载页面数据
     */
    async loadPageData() {
        const currentPage = this.state.get('currentPage');
        const currentPageNum = this.state.get('currentPageNum');
        const pageSize = this.state.get('pageSize');

        try {
            // 直接从API加载数据（不使用缓存）
            console.log('从API加载数据:', `${currentPage}_${currentPageNum}_${pageSize}`);
            
            let result;
            switch (currentPage) {
                case MEMBER_CONFIG.PAGES.ARTICLES:
                    result = await this.loadArticles(currentPageNum, pageSize);
                    break;
                case MEMBER_CONFIG.PAGES.MUMBLES:
                    result = await this.loadMumbles(currentPageNum, pageSize);
                    break;
                case MEMBER_CONFIG.PAGES.TIMELINE:
                    result = await this.loadTimeline(currentPageNum, pageSize);
                    break;
                case MEMBER_CONFIG.PAGES.PHOTOS:
                    result = await this.loadPhotos(currentPageNum, pageSize);
                    break;
                default:
                    return;
            }

            if (result) {
                this.renderPageData(currentPage, result.list);
                this.pagination.renderPagination(currentPage, result.totalPages, currentPageNum);
            }

        } catch (error) {
            this.errorHandler.reportError(error, { context: 'load page data', page: currentPage });
        }
    }

    /**
     * 加载文章列表
     */
    async loadArticles(page = 1, pageSize = 10) {
        const title = $('#articleTitleSearch').val();
        const tag = $('#articleTagSearch').val();

        const params = {
            pageIndex: page,
            pageSize,
            title: encodeURIComponent(title || ''),
            tag: encodeURIComponent(tag || '')
        };

        const result = await this.api.article.list(params);
        return result.data;
    }

    /**
     * 加载碎碎念列表
     */
    async loadMumbles(page = 1, pageSize = 10) {
        const content = $("#mumbleContentSearch").val();

        const params = {
            pageIndex: page,
            pageSize,
            content: encodeURIComponent(content || '')
        };

        const result = await this.api.mumble.list(params);
        return result.data;
    }

    /**
     * 加载时间轴列表
     */
    async loadTimeline(page = 1, pageSize = 10) {
        const content = $("#timelineSearch").val();

        const params = {
            pageIndex: page,
            pageSize,
            content: encodeURIComponent(content || '')
        };

        const result = await this.api.timeline.list(params);
        return result.data;
    }

    /**
     * 加载照片列表
     */
    async loadPhotos(page = 1, pageSize = 12) {
        const tag = $("#photoTagSearch").val();
        const description = $("#photoDescSearch").val();

        const params = {
            pageIndex: page,
            pageSize,
            tag: encodeURIComponent(tag || ''),
            description: encodeURIComponent(description || '')
        };

        const result = await this.api.photo.list(params);
        return result.data;
    }

    /**
     * 渲染页面数据
     */
    renderPageData(pageType, data) {
        switch (pageType) {
            case MEMBER_CONFIG.PAGES.ARTICLES:
                this.renderer.renderArticles(data);
                break;
            case MEMBER_CONFIG.PAGES.MUMBLES:
                this.renderer.renderMumbles(data);
                break;
            case MEMBER_CONFIG.PAGES.TIMELINE:
                this.renderer.renderTimeline(data);
                break;
            case MEMBER_CONFIG.PAGES.PHOTOS:
                this.renderer.renderPhotos(data);
                break;
        }
    }

    /**
     * 加载用户信息
     */
    async loadUserInfo() {
        try {
            const result = await this.api.user.getInfo();
            this.state.set('userInfo', result.data);
            this.updateUserInterface(result.data);
            this.updateTwoFactorStatus(result.data.twoFactorEnabled);
        } catch (error) {
            this.errorHandler.reportError(error, { context: 'load user info' });
        }
    }

    /**
     * 更新用户界面信息
     */
    updateUserInterface(userInfo) {
        const elements = {
            '#account': userInfo.account,
            '#nickname': userInfo.nickname,
            '#gender': userInfo.gender,
            '#signature': userInfo.signature,
            '#userName': userInfo.nickname,
            '#userEmail': userInfo.signature
        };

        Object.entries(elements).forEach(([selector, value]) => {
            const $element = this.dom.get(selector);
            if ($element.is('input, textarea, select')) {
                $element.val(value);
            } else {
                $element.text(value);
            }
        });

        if (userInfo.avatar) {
            this.dom.get('#userAvatar, #avatarPreview').attr('src', userInfo.avatar);
        }
    }

    /**
     * 更新双因素验证状态
     */
    updateTwoFactorStatus(enabled) {
        const config = enabled ? 
            {
                statusText: '已绑定',
                buttonText: '解绑双因素验证',
                buttonClass: 'btn-danger',
                buttonIcon: 'fa-unlock'
            } : 
            {
                statusText: '未绑定',
                buttonText: '绑定双因素验证',
                buttonClass: 'btn-success',
                buttonIcon: 'fa-shield'
            };

        this.dom.get('.status-text').text(config.statusText);
        this.dom.get('#bindTwoFactor')
            .removeClass('btn-success btn-danger')
            .addClass(config.buttonClass)
            .html(`<i class="fa ${config.buttonIcon}"></i> ${config.buttonText}`);
    }

    // 业务逻辑方法（简化版本，使用模块化API）

    /**
     * 保存个人资料
     */
    async saveProfile() {
        try {
            const formData = {
                nickname: this.dom.get('#nickname').val().trim(),
                gender: this.dom.get('#gender').val(),
                signature: this.dom.get('#signature').val().trim()
            };

            if (!this.validateProfileData(formData)) return;

            await this.api.user.updateProfile(formData);
            this.ui.showMessage('保存成功', 'success');

            // 更新状态
            const userInfo = this.state.get('userInfo');
            Object.assign(userInfo, formData);
            this.state.set('userInfo', userInfo);
            this.dom.get('#userName').text(formData.nickname);

        } catch (error) {
            this.errorHandler.reportError(error, { context: 'save profile' });
        }
    }

    /**
     * 退出登录
     */
    logout() {
        if (confirm('确定要退出登录吗？')) {
            this.state.set('loading', true);
            setTimeout(() => {
                window.location.href = '/';
            }, MEMBER_CONFIG.DELAYS.API_MOCK);
        }
    }

    /**
     * 处理头像上传
     */
    async handleAvatarUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file || !this.validateImageFile(file)) return;

            this.previewImage(file);
            await this.api.user.updateAvatar(file);
            this.ui.showMessage('头像上传成功', 'success');

        } catch (error) {
            this.errorHandler.reportError(error, { context: 'avatar upload' });
        }
    }

    /**
     * 显示双因素验证模态框
     */
    async showTwoFactorModal() {
        try {
            const isEnabled = this.dom.get('.status-text').text() === '已绑定';
            const modalConfig = this.getTwoFactorModalConfig(isEnabled);

            await this.setupTwoFactorModal(modalConfig, isEnabled);
            this.ui.showModal('twoFactorModal');

        } catch (error) {
            this.errorHandler.reportError(error, { context: 'show two factor modal' });
        }
    }

    /**
     * 启动定时清理任务
     */
    startPeriodicCleanup() {
        // 每5分钟清理一次存储和DOM缓存
        setInterval(() => {
            this.storage.cleanup();
            this.dom.clear(); // 清理DOM缓存
        }, 5 * 60 * 1000);
    }

    /**
     * 工具方法
     */
    isValidPage(page) {
        return Object.values(MEMBER_CONFIG.PAGES).includes(page);
    }

    parseQueryString(queryString) {
        const params = {};
        if (!queryString) return params;

        try {
            const pairs = queryString.split('&');
            for (const pair of pairs) {
                const [key, value] = pair.split('=');
                if (key && value) {
                    params[decodeURIComponent(key)] = decodeURIComponent(value);
                }
            }
        } catch (error) {
            console.warn('解析查询字符串失败:', error);
        }
        return params;
    }

    buildQueryString(params) {
        const pairs = [];
        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined && value !== '') {
                pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }
        return pairs.length > 0 ? `?${pairs.join('&')}` : '';
    }

    validateProfileData(data) {
        if (!data.nickname) {
            this.ui.showMessage('请输入昵称', 'warning');
            return false;
        }
        if (data.nickname.length > 20) {
            this.ui.showMessage('昵称不能超过20个字符', 'warning');
            return false;
        }
        return true;
    }

    validateImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.ui.showMessage('请选择图片文件', 'error');
            return false;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.ui.showMessage('图片文件不能超过5MB', 'error');
            return false;
        }
        return true;
    }

    previewImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.dom.get('#avatarPreview, #userAvatar').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);
    }

    handleResize() {
        this.initLayoutVisibility();
    }

    initLayoutVisibility() {
        const deviceInfo = this.state.get('deviceInfo');
        
        if (deviceInfo.isMobile) {
            this.dom.get(MEMBER_CONFIG.SELECTORS.tableContainer + ', ' + MEMBER_CONFIG.SELECTORS.photosGrid).hide();
            this.dom.get(MEMBER_CONFIG.SELECTORS.mobileCards + ', ' + MEMBER_CONFIG.SELECTORS.mobilePhotosGrid).show();
        } else {
            this.dom.get(MEMBER_CONFIG.SELECTORS.tableContainer + ', ' + MEMBER_CONFIG.SELECTORS.photosGrid).show();
            this.dom.get(MEMBER_CONFIG.SELECTORS.mobileCards + ', ' + MEMBER_CONFIG.SELECTORS.mobilePhotosGrid).hide();
        }
    }

    initTheme() {
        const savedTheme = this.storage.get('theme', 
            window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        );
        this.ui.setTheme(savedTheme);
    }

    closeAllModals() {
        this.ui.hideModal('publishModal');
        this.ui.hideModal('deleteModal');
        this.ui.hideModal('twoFactorModal');
    }

    searchCurrentPage() {
        // 静默重置到第一页（避免触发状态监听）
        this.state.state.currentPageNum = 1;
        
        // 直接加载数据
        this.loadPageData();
        
        // 更新URL
        this.updateURL();
    }



    // 数据变更后的处理（不使用缓存，直接重新加载数据）
    handleDataChange() {
        console.log('数据已变更，重新加载当前页面数据');
    }

    // 业务操作方法（完整实现）
    async editArticle(id) {
        try {
            this.state.set('loading', true);
            const result = await this.api.article.detail(id);
            if (result.success) {
                await this.showArticleModal(result.data);
            }
        } catch (error) {
            this.errorHandler.reportError(error, { context: 'edit article', id });
        } finally {
            this.state.set('loading', false);
        }
    }

    async editMumble(id) {
        await this.showMumbleModal(id);
    }

    async editTimeline(id) {
        await this.showTimelineModal(id);
    }

    async editPhoto(id) {
        await this.showPhotoModal(id);
    }

    async deleteItem(type, id) {
        this.state.set('currentDeleteItem', { type, id });
        this.ui.showModal('deleteModal');
    }

    // 模态框方法（简化实现，在实际项目中需要完整实现）
    async showArticleModal(article = null) {
        console.log('显示文章模态框:', article);
        // 这里应该有完整的模态框显示逻辑
        this.ui.showModal('publishModal');
    }

    async showMumbleModal(mumbleId = null) {
        console.log('显示碎碎念模态框:', mumbleId);
        this.ui.showModal('publishModal');
    }

    async showTimelineModal(timelineId = null) {
        console.log('显示时间轴模态框:', timelineId);
        this.ui.showModal('publishModal');
    }

    async showPhotoModal(photoId = null) {
        console.log('显示照片模态框:', photoId);
        this.ui.showModal('publishModal');
    }

    // 发布和删除确认
    async confirmPublish() {
        try {
            // 根据当前模态框类型确定操作
            const currentPage = this.state.get('currentPage');
            
            // 这里应该有具体的发布逻辑
            console.log('确认发布:', currentPage);
            
            // 发布成功后直接重新加载页面数据
            this.handleDataChange();
            this.ui.hideModal('publishModal');
            this.ui.showMessage('发布成功', 'success');
            await this.loadPageData();
            
        } catch (error) {
            this.errorHandler.reportError(error, { context: 'confirm publish' });
        }
    }

    async confirmDelete() {
        try {
            const deleteItem = this.state.get('currentDeleteItem');
            if (!deleteItem) return;

            const { type, id } = deleteItem;
            
            // 调用删除API
            let result;
            switch (type) {
                case 'article':
                    result = await this.api.article.delete(id);
                    break;
                case 'mumble':
                    result = await this.api.mumble.delete(id);
                    break;
                case 'timeline':
                    result = await this.api.timeline.delete(id);
                    break;
                case 'photo':
                    result = await this.api.photo.delete(id);
                    break;
                default:
                    throw new Error('未知的删除类型');
            }

            if (result.success) {
                // 删除成功后直接重新加载页面数据
                this.handleDataChange();
                this.ui.hideModal('deleteModal');
                this.ui.showMessage('删除成功', 'success');
                await this.loadPageData();
            }

        } catch (error) {
            this.errorHandler.reportError(error, { context: 'confirm delete' });
        } finally {
            this.state.set('currentDeleteItem', null);
        }
    }

    /**
     * 销毁实例
     */
    destroy() {
        // 清理所有定时器和资源
        this.recording.destroy();
        this.dom.clear();
        this.off(); // 移除所有事件监听器
        
        // 清理全局引用
        window.memberCenter = null;
    }
}

/**
 * 扩展的UI管理器
 * 继承基础UI管理器并添加特定功能
 */
class UIManagerExtended extends MemberModules.UIManager {
    constructor(stateManager, domCache) {
        super(stateManager, domCache);
    }

    // 可以在这里添加特定的UI管理方法
}

// 全局初始化
let memberCenter = null;

$(document).ready(() => {
    try {
        memberCenter = new MemberCenterOptimized();
        window.memberCenter = memberCenter;
        console.log('个人中心优化版本初始化成功');
    } catch (error) {
        console.error('个人中心初始化失败:', error);
        alert('系统初始化失败，请刷新页面重试');
    }
});

// 页面卸载清理
$(window).on('beforeunload', () => {
    if (memberCenter) {
        memberCenter.destroy();
    }
});

// 导出优化版本
window.MemberCenterOptimized = MemberCenterOptimized; 