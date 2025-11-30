/**
 * 基础工具类和事件管理器
 * @version 1.0
 * @author pengqiang
 */

'use strict';

/**
 * 事件发射器基类
 * 提供事件监听和触发功能
 */
class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    /**
     * 监听事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} options - 选项 {once: boolean}
     */
    on(event, callback, options = {}) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        const wrapper = options.once ? (...args) => {
            callback(...args);
            this.off(event, wrapper);
        } : callback;
        
        wrapper._original = callback;
        this.events.get(event).push(wrapper);
        return this;
    }

    /**
     * 监听一次事件
     */
    once(event, callback) {
        return this.on(event, callback, { once: true });
    }

    /**
     * 移除事件监听
     */
    off(event, callback) {
        const callbacks = this.events.get(event);
        if (!callbacks) return this;

        if (!callback) {
            this.events.delete(event);
        } else {
            const index = callbacks.findIndex(cb => cb === callback || cb._original === callback);
            if (index > -1) {
                callbacks.splice(index, 1);
                if (callbacks.length === 0) {
                    this.events.delete(event);
                }
            }
        }
        return this;
    }

    /**
     * 触发事件
     */
    emit(event, ...args) {
        const callbacks = this.events.get(event);
        if (!callbacks) return false;

        callbacks.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Event ${event} callback error:`, error);
            }
        });
        return true;
    }
}

/**
 * DOM缓存管理器
 * 缓存常用的DOM元素，提高性能
 */
class DOMCache {
    constructor() {
        this.cache = new Map();
        this.observers = new Map();
    }

    /**
     * 获取元素（带缓存）
     * @param {string} selector - 选择器
     * @param {boolean} force - 强制重新查询
     * @returns {jQuery} 元素
     */
    get(selector, force = false) {
        if (force || !this.cache.has(selector)) {
            const element = $(selector);
            this.cache.set(selector, element);
            
            // 监听元素变化，自动清理缓存
            this.watchElement(selector, element);
        }
        return this.cache.get(selector);
    }

    /**
     * 批量获取元素
     * @param {Array<string>} selectors - 选择器数组
     * @returns {Object} 元素对象
     */
    getBatch(selectors) {
        const result = {};
        selectors.forEach(selector => {
            const key = selector.replace(/[#.]/g, '').replace(/\s+/g, '_');
            result[key] = this.get(selector);
        });
        return result;
    }

    /**
     * 监听元素变化
     */
    watchElement(selector, element) {
        if (this.observers.has(selector) || element.length === 0) return;

        const observer = new MutationObserver(() => {
            this.invalidate(selector);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.observers.set(selector, observer);
    }

    /**
     * 使缓存失效
     * @param {string} selector - 选择器
     */
    invalidate(selector) {
        this.cache.delete(selector);
        const observer = this.observers.get(selector);
        if (observer) {
            observer.disconnect();
            this.observers.delete(selector);
        }
    }

    /**
     * 清理所有缓存
     */
    clear() {
        this.cache.clear();
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

/**
 * 工具函数集合
 */
class Utils {
    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间
     * @param {boolean} immediate - 是否立即执行
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} limit - 限制时间
     */
    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 深度克隆对象
     * @param {any} obj - 要克隆的对象
     * @returns {any} 克隆后的对象
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = Utils.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    /**
     * 安全的JSON解析
     * @param {string} str - JSON字符串
     * @param {any} defaultValue - 默认值
     * @returns {any} 解析结果
     */
    static safeJsonParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            console.warn('JSON解析失败:', error);
            return defaultValue;
        }
    }

    /**
     * 格式化时间
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间
     */
    static formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的大小
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 生成唯一ID
     * @param {string} prefix - 前缀
     * @returns {string} 唯一ID
     */
    static generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 检测设备类型
     * @returns {Object} 设备信息
     */
    static getDeviceInfo() {
        const width = $(window).width();
        return {
            isMobile: width <= 480,
            isTablet: width > 480 && width <= 768,
            isDesktop: width > 768,
            width,
            height: $(window).height()
        };
    }

    /**
     * 等待函数
     * @param {number} ms - 等待毫秒数
     * @returns {Promise} Promise对象
     */
    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 重试函数
     * @param {Function} fn - 要重试的函数
     * @param {number} maxRetries - 最大重试次数
     * @param {number} delay - 重试间隔
     * @returns {Promise} Promise对象
     */
    static async retry(fn, maxRetries = 3, delay = 1000) {
        let lastError;
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i === maxRetries) break;
                await Utils.wait(delay * Math.pow(2, i)); // 指数退避
            }
        }
        throw lastError;
    }
}

/**
 * 存储管理器
 * 统一管理本地存储
 */
class StorageManager {
    constructor(prefix = 'member-') {
        this.prefix = prefix;
    }

    /**
     * 设置值
     * @param {string} key - 键
     * @param {any} value - 值
     * @param {number} ttl - 过期时间（毫秒）
     */
    set(key, value, ttl = null) {
        const data = {
            value,
            timestamp: Date.now(),
            ttl
        };
        
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(data));
        } catch (error) {
            console.warn('存储设置失败:', error);
        }
    }

    /**
     * 获取值
     * @param {string} key - 键
     * @param {any} defaultValue - 默认值
     * @returns {any} 值
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return defaultValue;

            const data = JSON.parse(item);
            
            // 检查是否过期
            if (data.ttl && Date.now() - data.timestamp > data.ttl) {
                this.remove(key);
                return defaultValue;
            }
            
            return data.value;
        } catch (error) {
            console.warn('存储获取失败:', error);
            return defaultValue;
        }
    }

    /**
     * 移除值
     * @param {string} key - 键
     */
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (error) {
            console.warn('存储移除失败:', error);
        }
    }

    /**
     * 清理过期数据
     */
    cleanup() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    const item = localStorage.getItem(key);
                    if (item) {
                        const data = JSON.parse(item);
                        if (data.ttl && Date.now() - data.timestamp > data.ttl) {
                            localStorage.removeItem(key);
                        }
                    }
                }
            });
        } catch (error) {
            console.warn('存储清理失败:', error);
        }
    }
}

/**
 * 错误处理器
 */
class ErrorHandler {
    constructor() {
        this.errorCallbacks = [];
        this.setupGlobalHandlers();
    }

    /**
     * 设置全局错误处理
     */
    setupGlobalHandlers() {
        // 捕获JavaScript错误
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // 捕获Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                error: event.reason
            });
            event.preventDefault();
        });
    }

    /**
     * 添加错误回调
     * @param {Function} callback - 错误回调函数
     */
    onError(callback) {
        this.errorCallbacks.push(callback);
    }

    /**
     * 处理错误
     * @param {Object} errorInfo - 错误信息
     */
    handleError(errorInfo) {
        console.error('错误处理:', errorInfo);
        
        this.errorCallbacks.forEach(callback => {
            try {
                callback(errorInfo);
            } catch (error) {
                console.error('错误回调执行失败:', error);
            }
        });
    }

    /**
     * 手动报告错误
     * @param {Error} error - 错误对象
     * @param {Object} context - 上下文信息
     */
    reportError(error, context = {}) {
        this.handleError({
            type: 'manual',
            message: error.message,
            error,
            context
        });
    }
}

// 导出工具类
window.MemberBase = {
    EventEmitter,
    DOMCache,
    Utils,
    StorageManager,
    ErrorHandler
}; 