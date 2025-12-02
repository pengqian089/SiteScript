'use strict';

/**
 * 个人中心 JavaScript
 * 支持pjax初始化和响应式设计
 * @version 2.1
 * @author 系统管理员
 */

// 常量配置
const CONSTANTS = {
    // 页面类型
    PAGES: {
        PROFILE: 'profile',
        ARTICLES: 'articles',
        MUMBLES: 'mumbles',
        TIMELINE: 'timeline',
        PHOTOS: 'photos'
    },

    // 分页配置
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        DEFAULT_PAGE_NUM: 1,
        MAX_VISIBLE_PAGES: 5
    },

    // 响应式断点
    BREAKPOINTS: {
        MOBILE: 768, // 统一使用 768px 作为移动端断点
        TABLET: 768,
        DESKTOP: 1024
    },

    // 延迟时间
    DELAYS: {
        LOADING: 300,
        TOAST_AUTO_HIDE: 3000,
        TOAST_HIDE_ANIMATION: 300
    },

    // 消息类型配置
    MESSAGE_TYPES: {
        SUCCESS: {
            type: 'success',
            icon: 'fa-check-circle',
            color: '#059669',
            bgColor: '#ffffff',
            borderColor: '#10b981',
            textColor: '#065f46'
        },
        ERROR: {
            type: 'error',
            icon: 'fa-times-circle',
            color: '#dc2626',
            bgColor: '#ffffff',
            borderColor: '#ef4444',
            textColor: '#7f1d1d'
        },
        WARNING: {
            type: 'warning',
            icon: 'fa-exclamation-triangle',
            color: '#d97706',
            bgColor: '#ffffff',
            borderColor: '#f59e0b',
            textColor: '#92400e'
        },
        INFO: {
            type: 'info',
            icon: 'fa-info-circle',
            color: '#2563eb',
            bgColor: '#ffffff',
            borderColor: '#3b82f6',
            textColor: '#1e40af'
        }
    },

    // 选择器缓存
    SELECTORS: {
        // 导航相关
        navItem: '.nav-item',
        navItemLink: '.nav-item a',
        contentPage: '.content-page',
        currentPageTitle: '#currentPageTitle',

        // 布局相关
        menuToggle: '.menu-toggle',
        sidebarOverlay: '.sidebar-overlay',
        memberSidebar: '.member-sidebar',
        tableContainer: '.table-container',
        photosGrid: '.photos-grid',

        // 模态框相关
        publishModal: '#publishModal',
        deleteModal: '#deleteModal',
        twoFactorModal: '#twoFactorModal',
        modalBody: '#modalBody',
        modalTitle: '#modalTitle',
        confirmPublish: '#confirmPublish',

        // 加载相关
        loadingOverlay: '#loadingOverlay',
        toastContainer: '#toast-container',
        progressOverlay: '#progressOverlay'
    }
};

/**
 * 个人中心主类
 */
class MemberCenter {
    constructor() {
        this.state = {
            currentPage: CONSTANTS.PAGES.PROFILE,
            currentTheme: 'light',
            currentDeleteItem: null
        };

        this.cherryInstance = null;
        this.initialize();
    }

    initialize() {
        try {
            this.bindEvents();
            this.initPjax();
            this.initTheme();
            this.initMarkdownEditor();
            if ($('#startRecording').length > 0) {
                this.initAudioRecorder();
            }
        } catch (error) {
            console.error('初始化失败:', error);
            this.showMessage('系统初始化失败，请刷新页面重试', 'error');
        }
    }

    initPjax() {
        $.pjax.defaults.timeout = 5000;

        const mainSelectors = [
            'nav.member-nav > ul > li.nav-item > a',
            '#newArticle', '#newMumble', '#newTimeline', '#uploadPhoto',
            '.page-header .btn-secondary',
            '.list-actions a',
            '.photo-actions a'
        ];

        // 绑定主内容区 PJAX
        $(document).pjax(mainSelectors.join(', '), '#pjax-container', {scrollTo: 0});

        // 绑定列表分页 PJAX
        $(document).pjax('#member-article .pagination a', '#member-article', {scrollTo: 0});
        $(document).pjax('#member-mumble .pagination a', '#member-mumble', {scrollTo: 0});
        $(document).pjax('#member-timeline .pagination a', '#member-timeline', {scrollTo: 0});
        $(document).pjax('#member-photo .pagination a', '#member-photo', {scrollTo: 0});

        $(document).on('pjax:send', () => {
            $(CONSTANTS.SELECTORS.loadingOverlay).addClass('active');
        });

        $(document).on('pjax:complete', () => {
            $(CONSTANTS.SELECTORS.loadingOverlay).removeClass('active');
        });

        $(document).on('pjax:end', () => {
            window.scrollTo(0, 0);
            if ($('#startRecording').length > 0) {
                this.initAudioRecorder();
            }
            this.initMarkdownEditor();

            // 更新页面标题
            this.updatePageTitle();

            // 移动端：PJAX加载完成后自动关闭菜单
            if (this.isMobile()) {
                this.closeMobileMenu();
            }
        });

        // 初始化进度条 DOM
        if ($(CONSTANTS.SELECTORS.progressOverlay).length === 0) {
            $('body').append(`
                <div class="loading-overlay" id="progressOverlay" style="display: none; flex-direction: column; z-index: 9999;">
                    <div class="loading-spinner" style="width: 80%; max-width: 400px; text-align: center;">
                        <div style="font-size: 1.1rem; margin-bottom: 15px; color: var(--text-color);" id="progressText">准备上传...</div>
                        <div style="width: 100%; height: 10px; background: rgba(0,0,0,0.1); border-radius: 5px; overflow: hidden; position: relative;">
                             <div id="progressBar" class="progress-bar-animated" style="width: 0%; height: 100%; background-color: var(--primary-color); border-radius: 5px; transition: width 0.2s ease;"></div>
                        </div>
                        <div id="progressPercent" style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary);">0%</div>
                    </div>
                </div>
            `);
        }

        // 初始化进度条 DOM
        if ($(CONSTANTS.SELECTORS.progressOverlay).length === 0) {
            $('body').append(`
                <div class="loading-overlay" id="progressOverlay" style="display: none; flex-direction: column; z-index: 9999;">
                    <div class="loading-spinner" style="width: 80%; max-width: 400px; text-align: center;">
                        <div style="font-size: 1.1rem; margin-bottom: 15px; color: var(--text-color);" id="progressText">准备上传...</div>
                        <div style="width: 100%; height: 10px; background: rgba(0,0,0,0.1); border-radius: 5px; overflow: hidden; position: relative;">
                             <div id="progressBar" class="progress-bar-animated" style="width: 0%; height: 100%; background-color: var(--primary-color); border-radius: 5px; transition: width 0.2s ease;"></div>
                        </div>
                        <div id="progressPercent" style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary);">0%</div>
                    </div>
                </div>
            `);
        }
    }

    /**
     * 更新页面标题
     */
    updatePageTitle() {
        try {
            // 直接获取当前激活的导航菜单文本
            const $activeNav = $('nav.member-nav .nav-item.active a');
            let title = '';

            if ($activeNav.length > 0) {
                // 获取纯文本
                title = $activeNav.text().trim();
            }

            // 如果没有获取到（比如在非导航菜单页面），回退到默认标题
            if (!title) {
                title = '个人中心';
            }

            // 设置文档标题
            document.title = `${title} - 个人中心`;
        } catch (error) {
            console.error('更新页面标题失败:', error);
        }
    }

    initAudioRecorder() {
        if (!this.audioRecorder) {
            if (typeof AudioRecorder === 'undefined') return;
            this.audioRecorder = new AudioRecorder({
                onMessage: (msg, type) => this.showMessage(msg, type),
                onLoading: (show, msg) => show ? this.showLoading(msg) : this.hideLoading()
            });
        }
        this.audioRecorder.init();
    }

    bindEvents() {
        this.bindMobileMenuEvents();
        this.bindWindowEvents();
        this.bindContentEvents();
        this.bindModalEvents();
        this.bindViewContentEvents();
        this.bindKeyboardEvents();
        this.bindSidebarActive();
    }

    bindSidebarActive() {
        $(document).on('click', CONSTANTS.SELECTORS.navItem, (e) => {
            $(CONSTANTS.SELECTORS.navItem).removeClass('active');
            $(e.currentTarget).addClass('active');
        });
    }

    initMarkdownEditor() {
        const articleContentEl = document.getElementById('articleContent');
        const mumbleContentEl = document.getElementById('mumbleContent');
        const timelineContentEl = document.getElementById('timelineContent');

        const uploadAddress = document.getElementById('uploadAddress')?.value;


        const editorEl = (articleContentEl || mumbleContentEl || timelineContentEl);
        if (!editorEl) return;

        const markdownValueEl = document.getElementById('txt_' + editorEl.id);
        if (!markdownValueEl) return;

        const editorId = editorEl.id;
        const markdown = markdownValueEl.value;

        if (this.cherryInstance) {
            this.cherryInstance = null;
        }

        let that = this;
        try {
            this.cherryInstance = new Cherry({
                id: editorId,
                value: markdown,
                height: "100%",
                defaultModel: "editOnly",
                themeSettings: {
                    mainTheme: this.state.currentTheme,
                    codeBlockTheme: 'one-dark',
                },
                engine: {
                    syntax: {
                        codeBlock: {
                            editCode: false,
                            changeLang: false,
                        },
                    }
                },
                toolbars: {
                    toolbar: ['bold', 'italic', 'size', '|', 'color', 'header', 'togglePreview', '|', 'theme',
                        {insert: ['image', 'link', 'hr', 'br', 'code', 'table']}
                    ],
                },
                fileUpload: async function (file, callback) {
                    if (uploadAddress && uploadAddress.trim() !== '') {
                        await that.fileUpload(file, callback, uploadAddress);
                    } else {
                        callback('');
                    }
                }
            });
        } catch (e) {
            console.error('Markdown 编辑器初始化失败:', e);
        }

        markdownValueEl.style.display = 'none';

        if (this.cherryInstance) {
            this.cherryInstance.switchModel('editOnly');
        }
    }

    // 带进度的上传方法
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

    async fileUpload(file, callback, uploadUrl) {
        const formData = new FormData();
        formData.append("image", file);

        try {
            this.showProgress('正在上传图片...');
            const result = await this.uploadWithProgress(uploadUrl, formData, (percent) => {
                this.updateProgress(percent, '正在上传图片...');
            });
            this.hideProgress();
            callback(result["url"]);
        } catch (error) {
            this.hideProgress();
            this.showMessage('图片上传失败: ' + error.message, 'error');
            console.error('图片上传失败:', error);
        }
    }

    bindMobileMenuEvents() {
        $(document).on('click', CONSTANTS.SELECTORS.menuToggle, () => this.toggleMobileMenu());
        $(document).on('click', CONSTANTS.SELECTORS.sidebarOverlay, () => this.closeMobileMenu());
    }

    bindWindowEvents() {
        $(window).on('resize', () => this.handleResize());
    }

    bindContentEvents() {
        $(document).on('click', '#saveProfile', () => this.saveProfile());
        $(document).on('click', '#logout', () => this.logout());
        $(document).on('click', '#uploadAvatar', () => $('#avatarFile').click());
        $(document).on('change', '#avatarFile', (e) => this.handleAvatarUpload(e));

        // Articles
        $(document).on('click', '#searchArticles', () => {
            const title = $('#articleTitleSearch').val();
            const tag = $('#articleTagSearch').val();
            const url = new URL('/member/articles', window.location.origin);
            if (title) url.searchParams.set('title', title);
            if (tag) url.searchParams.set('tag', tag);
            $.pjax({url: url.href, container: '#member-article', push: true});
        });

        $(document).on('click', '#clearArticles', () => {
            $('#articleTitleSearch').val('');
            $('#articleTagSearch').val('');
            $('#searchArticles').click();
        });

        $(document).on('keyup', '#articleTitleSearch', (e) => {
            if (e.key === 'Enter') $('#searchArticles').click();
        });

        // Mumbles
        $(document).on('click', '#searchMumbles', () => {
            const content = $('#mumbleContentSearch').val();
            const url = new URL('/member/mumbles', window.location.origin);
            if (content) url.searchParams.set('content', content);
            $.pjax({url: url.href, container: '#member-mumble', push: true});
        });

        $(document).on('click', '#clearMumbles', () => {
            $('#mumbleContentSearch').val('');
            $('#searchMumbles').click();
        });

        $(document).on('keyup', '#mumbleContentSearch', (e) => {
            if (e.key === 'Enter') $('#searchMumbles').click();
        });

        // Timeline
        $(document).on('click', '#searchTimeline', () => {
            const content = $('#timelineSearch').val();
            const url = new URL('/member/timeline', window.location.origin);
            if (content) url.searchParams.set('content', content);
            $.pjax({url: url.href, container: '#member-timeline', push: true});
        });

        $(document).on('click', '#clearTimeline', () => {
            $('#timelineSearch').val('');
            $('#searchTimeline').click();
        });

        $(document).on('keyup', '#timelineSearch', (e) => {
            if (e.key === 'Enter') $('#searchTimeline').click();
        });

        // Photos
        $(document).on('click', '#searchPhotos', () => {
            const tag = $('#photoTagSearch').val();
            const desc = $('#photoDescSearch').val();
            const url = new URL('/member/photos', window.location.origin);
            if (tag) url.searchParams.set('tag', tag);
            if (desc) url.searchParams.set('description', desc);
            $.pjax({url: url.href, container: '#member-photo', push: true});
        });

        $(document).on('click', '#clearPhotos', () => {
            $('#photoTagSearch').val('');
            $('#photoDescSearch').val('');
            $('#searchPhotos').click();
        });

        $(document).on('keyup', '#photoDescSearch', (e) => {
            if (e.key === 'Enter') $('#searchPhotos').click();
        });

        $(document).on('click', '#confirmPublish', (e) => {
            const $btn = $(e.currentTarget);
            const action = $btn.data('action');
            if (action && typeof this[action] === 'function') {
                this.withButtonLoading($btn, async () => {
                    await this[action]();
                });
            }
        });

        $(document).on('change', '#photoFile', function (event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                $('#photoPreview').attr('src', e.target.result).show();
            };
            reader.readAsDataURL(file);
        });
    }

    bindModalEvents() {
        $('#closeDeleteModal').on('click', () => this.hideDeleteModal());
        $('#cancelDelete').on('click', () => this.hideDeleteModal());
        $('#confirmDelete').on('click', () => this.confirmDelete());

        $(document).on('click', '.modal-overlay', (e) => {
            if (e.target === e.currentTarget) {
                this.hideDeleteModal();
            }
        });
    }

    bindViewContentEvents() {
        $('#closeViewContentModal, #closeViewContentBtn').on('click', () => {
            $('#viewContentModal').hide();
        });

        $('#viewContentModal').on('click', (e) => {
            if (e.target === e.currentTarget) {
                $('#viewContentModal').hide();
            }
        });

        $(document).on('click', '.mobile-content-toggle', (e) => {
            this.toggleMobileContent(e.target);
        });
    }

    showContent(content, type = 'markdown') {
        let htmlContent = content;
        if (type === 'markdown' && typeof showdown !== 'undefined') {
            const converter = new showdown.Converter();
            htmlContent = converter.makeHtml(content);
        } else if (type === 'text') {
            htmlContent = $('<div>').text(content).html().replace(/\n/g, '<br>');
        }

        const $content = $('<div>').html(htmlContent);
        $content.find('img').css({'max-width': '100%', 'height': 'auto'});

        $('#viewContentModalBody').html($content);
        $('#viewContentModal').css('display', 'flex');

        // 代码高亮
        if (typeof Prism !== 'undefined') {
            try {
                // 对模态框内的代码块进行高亮
                const codeBlocks = document.getElementById('viewContentModalBody').querySelectorAll('pre code');
                if (codeBlocks.length > 0) {
                    Prism.highlightAllUnder(document.getElementById('viewContentModalBody'));
                }
            } catch (e) {
                console.error('代码高亮失败:', e);
            }
        }
    }

    toggleMobileContent(btn) {
        const $btn = $(btn);
        const $wrapper = $btn.prev('.mobile-content-wrapper');

        if ($wrapper.hasClass('collapsed')) {
            $wrapper.removeClass('collapsed');
            $btn.html('<i class="fa fa-angle-up"></i> 收起内容');
        } else {
            $wrapper.addClass('collapsed');
            $btn.html('<i class="fa fa-angle-down"></i> 展开全文');
        }
    }

    bindKeyboardEvents() {
        $(document).on('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideDeleteModal();
            }
        });
    }

    // 保存个人资料
    async saveProfile() {
        try {
            const formData = new FormData();
            formData.append('name', $('#nickname').val().trim());
            formData.append('sex', $('#gender').val());
            formData.append('sign', $('#signature').val().trim());

            this.showLoading();

            const response = await fetch('/Account/UpdateInfo', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            this.hideLoading();
            if (!result.success) {
                this.showMessage(result.message || '保存失败', 'error');
                return;
            }
            this.showMessage('保存成功', 'success');

        } catch (error) {
            console.error('保存个人资料失败:', error);
            this.hideLoading();
            this.showMessage('保存失败，请重试', 'error');
        }
    }

    // 退出登录
    async logout() {
        if (confirm('确定要退出登录吗？')) {
            this.showLoading();
            try {
                const response = await fetch('/Account/LogOut', {
                    method: 'POST'
                });
                if (response.redirected) {
                    window.location.href = response.url;
                } else if (response.ok) {
                    window.location.href = '/';
                } else {
                    this.showMessage('退出失败', 'error');
                }
            } catch (error) {
                console.error('退出失败:', error);
                this.showMessage('退出失败', 'error');
            } finally {
                this.hideLoading();
            }
        }
    }

    handleAvatarUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            if (!this.validateImageFile(file)) {
                return;
            }

            this.previewImage(file);
            this.uploadImage(file);
        } catch (error) {
            console.error('头像上传失败:', error);
            this.showMessage('头像上传失败', 'error');
        }
    }

    validateImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showMessage('请选择图片文件', 'error');
            return false;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showMessage('图片文件不能超过5MB', 'error');
            return false;
        }

        return true;
    }

    previewImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            $('#avatarPreview, #userAvatar').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);
    }

    // 上传头像实现
    async uploadImage(file) {
        this.showLoading();

        const form = new FormData();
        form.append('avatar', file);

        try {
            const response = await fetch('/Account/UpdateAvatar', {
                method: 'POST',
                body: form,
            });
            const result = await response.json();
            this.hideLoading();
            if (!result.success) {
                this.showMessage(result.msg, 'error');
                return;
            }
            this.showMessage('头像上传成功', 'success');
        } catch (error) {
            this.hideLoading();
            this.showMessage('上传发生错误', 'error');
        }
    }

    deleteItem(type, id) {
        this.state.currentDeleteItem = {type, id};
        $('#deleteModal').show();
    }

    confirmDelete() {
        if (this.state.currentDeleteItem) {
            this.showLoading();
            setTimeout(() => {
                this.hideLoading();
                this.hideDeleteModal();
                this.showMessage('删除成功', 'success');
                $.pjax.reload('#' + this.getCurrentContainerId());
            }, 300); // Small delay for UX
        }
    }

    getCurrentContainerId() {
        if (location.pathname.includes('articles')) return 'member-article';
        if (location.pathname.includes('mumbles')) return 'member-mumble';
        if (location.pathname.includes('timeline')) return 'member-timeline';
        if (location.pathname.includes('photos')) return 'member-photo';
        return 'pjax-container';
    }

    async publishArticle() {
        // ... (existing publishArticle logic kept as it uses its own endpoints)
        const submitAddressEl = document.getElementById('submitAddress');
        if (!submitAddressEl) return;

        const action = submitAddressEl.value;
        const id = document.getElementById('articleId').value;
        const title = document.getElementById('articleTitle').value;
        const tagsSelect = document.getElementById('articleTags');
        const tags = Array.from(tagsSelect.selectedOptions).map(x => x.value).join(',');
        const introduction = document.getElementById('articleIntroduction').value;
        const newTag = document.getElementById('articleExtraTags').value;

        let markdown = '';
        let content = '';
        if (this.cherryInstance) {
            markdown = this.cherryInstance.getMarkdown();
            content = this.cherryInstance.getHtml();
        } else {
            const txt = document.getElementById('txt_articleContent');
            if (txt) {
                markdown = txt.value;
                content = markdown;
            }
        }

        if (title.trim() === '') {
            this.showMessage('标题不能为空', 'warning');
            return;
        }

        if (newTag.trim() === '' && tags.trim() === '') {
            this.showMessage('请选择标签或输入补充标签', 'warning');
            return;
        }
        if (introduction.trim() === '') {
            this.showMessage('简介不能为空', 'warning');
            return;
        }
        if (markdown.trim() === '' || markdown.length < 5) {
            this.showMessage('内容不能为空', 'warning');
            return;
        }

        const formData = new FormData();
        if (id.trim() !== '') {
            formData.append("id", id);
        }
        formData.append("title", title);
        formData.append("tags", tags);
        formData.append("introduction", introduction);
        formData.append("markdown", markdown);
        formData.append("content", content);
        formData.append("newTag", newTag);

        try {
            const response = await fetch(action, {method: 'POST', body: formData});
            const result = await response.json();
            if (!result.success) {
                this.showMessage(result.msg || '发布失败', 'error');
                return;
            }
            this.showMessage('文章发布成功', 'success');
            $.pjax({url: '/member/articles', container: '#pjax-container'});
        } catch (error) {
            this.showMessage('发布失败: ' + error.message, 'error');
        }
    }

    async publishMumble() {
        const submitAddressEl = document.getElementById('submitAddress');
        if (!submitAddressEl) return;

        const action = submitAddressEl.value;
        const id = document.getElementById('mumbleId')?.value;

        let content = '';
        let html = '';
        if (this.cherryInstance) {
            content = this.cherryInstance.getMarkdown();
            html = this.cherryInstance.getHtml();
        } else {
            const el = document.getElementById('mumbleContent');
            content = el ? el.value : '';
        }

        if (!content || content.trim() === '' || content.length < 5) {
            this.showMessage('请输入内容', 'warning');
            return;
        }

        const formData = new FormData();
        if (id.trim() !== '') {
            formData.append("id", id);
        }
        formData.append("markdown", content);
        formData.append("html", html);

        try {
            const response = await fetch(action, {method: 'POST', body: formData});
            const result = await response.json();
            if (!result.success) {
                this.showMessage(result.msg || '发布失败', 'error');
                return;
            }
            this.showMessage('碎碎念发布成功', 'success');
            $.pjax({url: '/member/mumbles', container: '#pjax-container'});
        } catch (error) {
            this.showMessage('发布失败: ' + error.message, 'error');
        }
    }

    async publishTimeline() {
        const submitAddressEl = document.getElementById('submitAddress');
        if (!submitAddressEl) return;

        const action = submitAddressEl.value;
        const id = document.getElementById('timelineId').value;
        const title = document.getElementById('timelineTitle').value;
        const more = document.getElementById('timelineMore').value;
        const date = document.getElementById('timelineDate').value;

        let content = '';
        if (this.cherryInstance) {
            content = this.cherryInstance.getMarkdown();
        } else {
            const el = document.getElementById('timelineContent');
            content = el ? el.value : '';
        }

        if (title.trim() === '') {
            this.showMessage('标题不能为空', 'warning');
            return;
        }
        if (date.trim() === '') {
            this.showMessage('时间不能为空', 'warning');
            return;
        }
        if (content.trim() === '' || content.length < 5) {
            this.showMessage('内容不能为空', 'warning');
            return;
        }

        const formData = new FormData();
        if (id.trim() !== '') {
            formData.append("id", id);
        }
        formData.append("title", title);
        formData.append("more", more);
        formData.append("date", date);
        formData.append("content", content);

        try {
            const response = await fetch(action, {method: 'POST', body: formData});
            const result = await response.json();
            if (!result.success) {
                this.showMessage(result.msg || '发布失败', 'error');
                return;
            }
            this.showMessage('时间轴发布成功', 'success');
            $.pjax({url: '/member/timeline', container: '#pjax-container'});
        } catch (error) {
            this.showMessage('发布失败: ' + error.message, 'error');
        }
    }

    async publishPhoto() {
        const submitAddressEl = document.getElementById('submitAddress');
        if (!submitAddressEl) return;

        const action = submitAddressEl.value;
        const id = document.getElementById('photoId')?.value || '';
        const fileInput = document.getElementById('photoFile');
        const file = fileInput.files[0];

        if (!file) {
            this.showMessage('请选择照片', 'warning');
            return;
        }

        const tagsSelect = document.getElementById('photoTags');
        const tags = Array.from(tagsSelect.selectedOptions).map(x => x.value).join(',');
        const newTag = document.getElementById('photoExtraTags').value;
        const description = document.getElementById('photoDescription').value;

        const formData = new FormData();
        if (id.trim() !== '') {
            formData.append("id", id);
        }
        if (file) {
            formData.append("photo", file);
        }
        formData.append("description", description);

        let finalTags = tags;
        if (newTag) {
            finalTags = finalTags ? (finalTags + ',' + newTag) : newTag;
        }
        formData.append("tags", finalTags);

        try {
            // const response = await fetch(action, { method: 'POST', body: formData });
            // const result = await response.json();

            this.showProgress('正在上传照片...');
            const result = await this.uploadWithProgress(action, formData, (percent) => {
                this.updateProgress(percent, '正在上传照片...');
            });

            if (!result.success) {
                this.showMessage(result.msg || '上传失败', 'error');
                return;
            }
            this.showMessage('照片上传成功', 'success');
            $.pjax({url: '/member/photos', container: '#pjax-container'});
        } catch (error) {
            this.showMessage('上传失败: ' + error.message, 'error');
        } finally {
            this.hideProgress(); // 确保 loading 被隐藏
        }
    }

    hideDeleteModal() {
        $(CONSTANTS.SELECTORS.deleteModal).hide();
        this.state.currentDeleteItem = null;
    }

    showProgress(message = '上传中...') {
        const $overlay = $(CONSTANTS.SELECTORS.progressOverlay);
        if ($overlay.length > 0) {
            $overlay.find('#progressText').text(message);
            $overlay.find('#progressBar').css('width', '0%');
            $overlay.find('#progressPercent').text('0%');
            $overlay.css('display', 'flex').addClass('active');
        }
    }

    updateProgress(percent, message) {
        const $overlay = $(CONSTANTS.SELECTORS.progressOverlay);
        if ($overlay.length > 0) {
            if (message) $overlay.find('#progressText').text(message);
            $overlay.find('#progressBar').css('width', `${percent}%`);
            $overlay.find('#progressPercent').text(`${percent}%`);
        }
    }

    hideProgress() {
        const $overlay = $(CONSTANTS.SELECTORS.progressOverlay);
        $overlay.removeClass('active').fadeOut(200);
    }

    showLoading(message = '加载中...') {
        const loadingText = $('.loading-spinner .loading-text');
        if (loadingText.length > 0) {
            loadingText.text(message);
        }
        $(CONSTANTS.SELECTORS.loadingOverlay).addClass('active');
    }

    hideLoading() {
        $(CONSTANTS.SELECTORS.loadingOverlay).removeClass('active');
    }

    showMessage(message, type = 'info') {
        try {
            const messageConfig = CONSTANTS.MESSAGE_TYPES;
            const config = messageConfig[type.toUpperCase()] || messageConfig.INFO;

            const messageId = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const alert = this.createToastElement(messageId, type, message, config);
            this.appendToastToContainer(alert);
            this.animateToast(alert, messageId);
        } catch (error) {
            console.error('显示消息失败:', error);
        }
    }

    createToastElement(messageId, type, message, config) {
        const alert = $(`
            <div class="toast-message" id="${messageId}" data-type="${type}">
                <div class="toast-content">
                    <div class="toast-icon">
                        <i class="fa ${config.icon}"></i>
                    </div>
                    <div class="toast-text">
                        <div class="toast-message-text">${message}</div>
                    </div>
                    <button type="button" class="toast-close">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
                <div class="toast-progress">
                    <div class="toast-progress-bar"></div>
                </div>
            </div>
        `);

        alert.css({
            '--toast-color': config.color,
            '--toast-bg-color': config.bgColor,
            '--toast-border-color': config.borderColor,
            '--toast-text-color': config.textColor
        });

        return alert;
    }

    appendToastToContainer(alert) {
        let container = $(CONSTANTS.SELECTORS.toastContainer);
        if (container.length === 0) {
            container = $('<div id="toast-container"></div>');
            $('body').append(container);
        }
        container.append(alert);
    }

    animateToast(alert, messageId) {
        setTimeout(() => {
            alert.addClass('toast-show');
        }, 10);

        setTimeout(() => {
            alert.find('.toast-progress-bar').addClass('toast-progress-active');
        }, 100);

        alert.find('.toast-close').on('click', () => {
            this.hideMessage(messageId);
        });

        setTimeout(() => {
            this.hideMessage(messageId);
        }, CONSTANTS.DELAYS.TOAST_AUTO_HIDE);
    }

    hideMessage(messageId) {
        try {
            const alert = $(`#${messageId}`);
            if (alert.length === 0) return;

            alert.addClass('toast-hide');
            setTimeout(() => {
                alert.remove();

                const container = $(CONSTANTS.SELECTORS.toastContainer);
                if (container.children().length === 0) {
                    container.remove();
                }
            }, CONSTANTS.DELAYS.TOAST_HIDE_ANIMATION);
        } catch (error) {
            console.error('隐藏消息失败:', error);
        }
    }

    initTheme() {
        try {
            const savedTheme = localStorage.getItem('theme') ||
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            this.setTheme(savedTheme);
        } catch (error) {
            console.error('初始化主题失败:', error);
            this.setTheme('light');
        }
    }

    setTheme(theme) {
        try {
            if (!['light', 'dark'].includes(theme)) {
                theme = 'light';
            }

            this.state.currentTheme = theme;
            $('html').attr('data-theme', theme);
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.error('设置主题失败:', error);
        }
    }

    toggleMobileMenu() {
        $(CONSTANTS.SELECTORS.memberSidebar).toggleClass('active');
        $(CONSTANTS.SELECTORS.sidebarOverlay).toggleClass('active');
    }

    closeMobileMenu() {
        $(CONSTANTS.SELECTORS.memberSidebar).removeClass('active');
        $(CONSTANTS.SELECTORS.sidebarOverlay).removeClass('active');
    }

    handleResize() {
        try {
            const width = $(window).width();
            if (width > CONSTANTS.BREAKPOINTS.TABLET) {
                this.closeMobileMenu();
            }
        } catch (error) {
            console.error('处理窗口大小改变失败:', error);
        }
    }

    async withButtonLoading(btn, asyncAction) {
        const $btn = $(btn);
        const originalHtml = $btn.html();
        // const originalWidth = $btn.outerWidth();

        try {
            $btn.addClass('btn-loading');
            $btn.prop('disabled', true);
            $btn.html(`<i class="fa fa-spinner fa-spin"></i> ${originalHtml}`);

            await asyncAction();
        } finally {
            $btn.prop('disabled', false);
            $btn.removeClass('btn-loading');
            $btn.html(originalHtml);
        }
    }

    isMobile() {
        return $(window).width() <= CONSTANTS.BREAKPOINTS.MOBILE;
    }
}

let memberCenter = null;

$(document).ready(() => {
    try {
        memberCenter = new MemberCenter();
        window.memberCenter = memberCenter;
        console.log('个人中心初始化成功');
    } catch (error) {
        console.error('个人中心初始化失败:', error);
    }
});

$(window).on('beforeunload', () => {
    // 清理工作
});

window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    try {
        if (memberCenter && typeof memberCenter.showMessage === 'function') {
            memberCenter.showMessage('系统出现错误，请刷新页面', 'error');
        }
    } catch (e) {
    }
});
