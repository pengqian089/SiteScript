"use strict";

(function(){
    // 评论查看更多
    $(document).delegate(".comments-area .load-more button", "click", function () {
        let $area = $(this).parents(".comments-area");
        let $loadMore = $(this).parent();
        let $commentCount = $(this).parents().find(".comment-count span")
        let src = $(this).parent().data("loadingIco");
        $loadMore.html(`<img src="${src}" class="comment-loading" alt="loading"/>`);
        let pageIndex = parseInt($(this).data("pageIndex"));
        let pageSize = parseInt($(this).data("pageSize"));
        // let count = parseInt($(this).data("itemCount"));
        // let pageCount = parseInt($(this).data("pageCount"));
        // let node = $(this).data("node");
        // let relation = $(this).data("relation");
        let request = $(this).data("pageRequest");
        let $that = $(this);
        $.ajax({
            url: request,
            type: "get",
            data: { pageIndex: pageIndex + 1, pageSize: pageSize }
        }).done(function (result, _, xhr) {
            //let nextPage = $(result).find(".comments-area").html();
            $area.append(result);
            $loadMore.remove();
            $commentCount.text(xhr.getResponseHeader("commentCount"));
            $("time.timeago").relativeTime();
            lightCode();
        }).fail(ajaxFail);
    });

    $(document).delegate("form.comment-form :input:not(textarea)", "keydown", function (e) {
        return e.key != "Enter";
    });

    // 提交评论
    $(document).delegate("form.comment-form", "submit", function () {
        event.preventDefault();
        let data = new FormData(this);
        let $that = $(this);
        let $commentCount = $(this).parents(".comment-block").find(".comment-count span");
        $(this)
            .find("button.layui-btn.layui-btn-sm")
            .addClass("layui-btn-disabled")
            .attr("disabled", "disabled")
            .html(`<i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop layui-font-12"></i> 发送`);
        $.ajax({
            url: $that.attr("action"),
            processData: false,
            contentType: false,
            data: data,
            type: "post"
        }).done(function (result, _, xhr) {
            if (result.hasOwnProperty("success") && result["success"] === false) {
                layer.msg(result.msg, { icon: 2, anim: 6 });
            } else {
                let $form = $that.clone();
                let $commentBlock = $that.parents(".comment-block");
                let $area = $commentBlock.find(".comments-area:first");
                $commentBlock.find(".comments-area").html(result);
                $that.remove();

                $form.find("textarea").val("");
                $form
                    .find("button.layui-btn.layui-btn-sm")
                    .removeClass("layui-btn-disabled")
                    .removeAttr("disabled")
                    .html("发送");
                $form.find("input[name=replyId]").val("");
                $form.find(".comment-btn-close").hide();
                $form.find(".comment-btn-close").unbind("click");
                $area.before($form);
                $commentCount.text(xhr.getResponseHeader("commentCount"));
                $("time.timeago").relativeTime();
                lightCode();
            }
        }).always(function () {
            $that
                .find("button.layui-btn.layui-btn-sm")
                .removeClass("layui-btn-disabled")
                .removeAttr("disabled")
                .html("发送");
        });
    });

    // 刷新评论
    $(document).delegate(".comment-count button.refresh", "click", function () {
        let $area = $(this).parents(".comment-block").find(".comments-area");
        let request = $(this).data("refresh") + "?t=" + new Date().getTime();
        let $commentCount = $(this).parent().find("span");
        let index = layer.load();
        $.ajax({
            url: request,
            type: "get"
        }).done(function (result, _, xhr) {
            $area.html(result);
            $commentCount.text(xhr.getResponseHeader("commentCount"));
            $("time.timeago").relativeTime();
            lightCode();
        }).fail(ajaxFail).always(function () {
            layer.close(index);
        });
    });

    // 添加网络图片
    $(document).delegate(".footer-action-item[data-image]", "click", function () {
        let $editor = $(this).parents().find("textarea.comment-form-editor");
        layer.prompt({
            title: "请输入网络图片地址",
        }, function (value, index) {
            let url;
            try {
                url = new URL(value);
            } catch {
                layer.msg("请输入正确的地址嗷~");
                return;
            }
            if (url.protocol !== "https:") {
                layer.msg("使用https协议的网络图片嗷~");
                return;
            }
            let markdownImg = `![](${url.toString()})`;
            $editor.val($editor.val() + "\r\n" + markdownImg);
            layer.close(index);
        });
    });

    // 回复按钮事件
    $(document).delegate(".comments-area blockquote.comment-item button.btn-reply", "click", function () {
        //debugger;
        let $form = $(this).parents(".comment-block").find("form.comment-form");
        let $formClone = $form.clone();
        $form.remove();
        let $that = $(this);
        $formClone.find("input[name=replyId]").val($(this).data("replyId"));
        $formClone.find(".comment-btn-close").show();
        $formClone.find(".comment-btn-close").bind("click", function () {
            $formClone.find("input[name=replyId]").val("");
            $that.parents(".comments-area").before($formClone);
            $(this).hide();
            $(this).unbind("click");
        });
        $(this).parents(".comment-block blockquote.comment-item:first").find(".detail > .comment-content:first").after($formClone);
    });

})();