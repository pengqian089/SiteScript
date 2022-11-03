"use strict";

(function () {
    $.ajax({url: "/account/GetUserInfo"})
        .done(function (result) {
            if (result.success) {
                $(".blog-user")
                    .attr("href", "/account")
                    .find("img")
                    .attr({"src": `${result.data.avatar}`, "title": result.data.name});
            }
        }).fail(ajaxFail);

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
})();