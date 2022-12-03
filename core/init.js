"use strict";

const dpzOption = {
    /**
     * webapi地址
     */
    webApiBaseAddress: document.querySelector("meta[name=web-api-base-address]").content,
    /**
     * cdn地址
     */
    CDNBaseAddress: document.querySelector("meta[name=cdn-base-address]").content,
    /**
     * 是否为 dark模式
     */
    isDark: window.matchMedia('(prefers-color-scheme: dark)').matches
};


(async function () {
    let userResponse = await fetch("/account/GetUserInfo");
    let userResult = await userResponse.json();
    if(userResult["success"]){
        $(".blog-user")
            .attr("href", "/account")
            .find("img")
            .attr({"src": `${userResult.data.avatar}`, "title": userResult.data.name});
    }

    let viewImages = ".article.shadow .article-left img,.mumble-list .mumble-item .mumble-content img,.article-detail-content img,#cd-timeline .content img";
    //图片查看
    $(document).delegate(viewImages, "click", function () {
        let index = layer.load(1);
        let images = $(viewImages);
        loadImages(images).then(x => {
            let items = [];
            for (let i = 0; i < x.length; i++) {
                let img = x[i];
                items.push({
                    src: img.src,
                    w: img.naturalWidth,
                    h: img.naturalHeight,
                    title: img.alt
                });
            }
            let imageIndex = images.index(this);
            let options = {
                index: imageIndex,
                bgOpacity: 0.7,
                showHideOpacity: true,
                history: true,
                getThumbBoundsFn: function (index) {
                    let thumbnail = document.querySelectorAll(viewImages)[index];
                    let pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
                    let rect = thumbnail.getBoundingClientRect();
                    return {x: rect.left, y: rect.top + pageYScroll, w: rect.width};
                }
            };
            let gallery = new PhotoSwipe(document.getElementById("gallery"), PhotoSwipeUI_Default, items, options);
            gallery.init();
        }).finally(() => layer.close(index));
    });

    // search
    $(document).delegate("#i-search", "submit", function () {
        const keyword = $("#i-keyword").val();
        let q = $(this).find("[name=q]");
        $(this).find("[name=q]").val(q.data("default") + " " + keyword);
    });

    $(document).delegate("#i-keyword", "keyup", function (e) {
        if (e.keyCode === 13) {
            $(this).parents("form").submit();
        }
    });

    $(document).delegate("#i-search a.search-btn", "click", function () {
        $(this).parents("form").submit();
    });

    $(document).delegate("[data-tips]", "touchend", function () {
        let tips = $(this).data("tips");
        layer.tips(tips, this, { tips: 3 });
    });

    $(document).delegate("time.timeago", "touchend", function () {
        let title = $(this).attr("title");
        layer.tips(title, this, { tips: 3 });
    });

    const ap = new APlayer({
        container: document.getElementById("aplayer"),
        lrcType: 3,
        fixed: true
    });

    let musicResponse = await fetch("/Music/Recommend");
    let musicResult = await musicResponse.json();
    ap.list.add(musicResult);

})();