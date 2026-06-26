// ==UserScript==
// @name            从豆包分享页面下载无水印视频 Download-from-Doubao-Video-Sharing-without-Watermark
// @name:zh         从豆包分享页面下载无水印视频 Download-from-Doubao-Video-Sharing-without-Watermark
// @name:en         Download-from-Doubao-Video-Sharing-without-Watermark 从豆包分享页面下载无水印视频
// @namespace       https://github.com/catscarlet/Download-from-Doubao-Video-Sharing-without-Watermark
// @description     这是一个可以让你从豆包分享页面（https://www.doubao.com/video-sharing）下载无水印视频的用户脚本。 You can try this userscript to Download Video from <www.doubao.com/video-sharing> without Watermark.
// @description:zh  这是一个可以让你从豆包分享页面（https://www.doubao.com/video-sharing）下载无水印视频的用户脚本。 You can try this userscript to Download Video from <www.doubao.com/video-sharing> without Watermark.
// @description:en  You can try this userscript to Download Video from <www.doubao.com/video-sharing> without Watermark. 这是一个可以让你从豆包分享页面（https://www.doubao.com/video-sharing）下载无水印视频的用户脚本。
// @version         0.0.3
// @author          catscarlet
// @license         GNU Affero General Public License v3.0
// @match           https://www.doubao.com/video-sharing?*
// @run-at          document-end
// @grant           none
// ==/UserScript==

const customPostfixName = '';
const bannerClassName = '.banner-JSgbIO';
let isDownloading = false;

(function() {
    'use strict';

    let throttleTimer;
    let debounceTimer;
    const thresholdValue = 300;

    const observer = new MutationObserver((mutationsList) => {
        const now = Date.now();

        if (!throttleTimer || now - throttleTimer > thresholdValue) {
            throttleTimer = now;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        let bannerItem = document.querySelector(bannerClassName);

                        if (!bannerItem) {
                            return;
                        } else {
                            let link = createDownloadButtons(bannerItem);
                            bannerItem.append(link);
                            observer.disconnect();
                        }
                    }
                }
            }, thresholdValue);
        }
    });

    const config = {
        childList: true,
        attributes: false,
        subtree: true,
    };

    observer.observe(document.documentElement, config);
})();

function getVid() {
    let url = new URL(location.href);
    let vid = url.searchParams.get('video_id');

    if (!vid) {
        return false;
    }

    return vid;
}

function createDownloadButtons(bannerItem) {
    let bannerLayout = bannerItem.getBoundingClientRect();

    let vid = getVid();

    const links = document.createElement('div');
    links.style.position = 'absolute';
    const x = 0;
    const y = 0;
    const left = x + 'px';
    const top = 'calc(' + y + 'px + ' + bannerLayout.bottom + 'px)';

    links.style.left = left;
    links.style.top = top;

    let promptDownloadButton = createPromptDownloadButton();
    links.appendChild(promptDownloadButton);

    let rawVideoDownloadButton = createOneRawVideoDownloadButton(vid);
    links.appendChild(rawVideoDownloadButton);

    return links;
}

function createPromptDownloadButton() {
    const link = document.createElement('a');

    link.textContent = '点击将视频Prompt下载为TXT文档';
    link.style.whiteSpace = 'break-spaces';

    link.classList.add('doubao-nowatermark-555118');

    link.style.backgroundColor = 'green';
    link.style.color = 'white';
    link.style.padding = '7px 14px';
    link.style.border = '2px solid white';
    link.style.borderRadius = '5px';
    link.style.zIndex = 1;
    link.style.textDecoration = 'none';
    link.style.opacity = '0.8';
    link.style.display = 'block';

    link.addEventListener('mouseover', function() {
        if (this.style.cursor == 'wait') {
            return;
        }
        this.style.backgroundColor = 'lightgreen';
        this.style.cursor = 'pointer';
    });

    link.addEventListener('mouseout', function() {
        if (this.style.cursor == 'wait') {
            return;
        }
        this.style.backgroundColor = 'green';
        this.style.cursor = '';
    });

    link.addEventListener('click', async () => {
        downloadPromptAsTXT();
    });

    return link;
}

function createOneRawVideoDownloadButton(vid) {
    const link = document.createElement('a');

    link.dataset.vid = vid;

    link.textContent = '点击下载无水印视频';
    link.style.whiteSpace = 'break-spaces';

    link.classList.add('doubao-nowatermark-555118');

    link.style.backgroundColor = 'green';
    link.style.color = 'white';
    link.style.padding = '7px 14px';
    link.style.border = '2px solid white';
    link.style.borderRadius = '5px';
    link.style.zIndex = 1;
    link.style.textDecoration = 'none';
    link.style.opacity = '0.8';
    link.style.display = 'block';

    link.addEventListener('mouseover', function() {
        if (this.style.cursor == 'wait') {
            return;
        }
        this.style.backgroundColor = 'lightgreen';
        this.style.cursor = 'pointer';
    });

    link.addEventListener('mouseout', function() {
        if (this.style.cursor == 'wait') {
            return;
        }
        this.style.backgroundColor = 'green';
        this.style.cursor = '';
    });

    link.addEventListener('click', async () => {
        getCrossOriginVideo(link);
    });

    return link;
}

async function getPromptText() {
    let promptText = '';
    let expandBtn = document.querySelector('.semi-typography-ellipsis-expand');

    if (!expandBtn) {
        const promptNode = document.querySelector('.semi-typography');
        promptText = promptNode ? promptNode.textContent.trim() : '';

        return promptText;
    } else if (expandBtn.text == '收起') {
        const promptNode = expandBtn.previousSibling;
        promptText = promptNode ? promptNode.textContent.trim() : '';

        return promptText;
    } else if (expandBtn.text == '展开') {
        promptText = await clickExpandAndGetText(expandBtn);

        return promptText;
    } else {
        let textFromQuery = document.querySelector('.semi-typography-ellipsis').textContent;
        promptText = textFromQuery.replace(/收起$/, '');

        return promptText;
    }
}

async function downloadPromptAsTXT() {
    let text;
    const url = new URL(location.href);
    const promptText = await getPromptText();

    text = url + '\n\n' + promptText;

    const blob = new Blob([text], {type: 'text/plain'});

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);

    let promptName = getVideoName();
    if (customPostfixName) {
        promptName = promptName + '-' + customPostfixName;
    }
    promptName = promptName + '-prompt.txt';
    link.download = promptName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function clickExpandAndGetText(expandBtn) {
    expandBtn.click();

    return new Promise((resolve) => {
        setTimeout(() => {
            const promptNode = expandBtn.previousSibling;
            const text = promptNode ? promptNode.textContent.trim() : '';

            resolve(text);
        }, 100);
    });
}

async function getCrossOriginVideo(link) {
    if (isDownloading) {
        return;
    } else {
        isDownloading = true;
    }

    const btnOriginStyle = {};
    btnOriginStyle.cursor = link.style.cursor;
    btnOriginStyle.backgroundColor = link.style.backgroundColor;
    link.style.cursor = 'wait';
    link.style.backgroundColor = 'grey';

    const vid = link.dataset.vid;
    let videoUrl = await getUrlByVid(vid);

    let videoName = getVideoName();
    if (customPostfixName) {
        videoName = videoName + '-' + customPostfixName;
    }
    videoName = videoName + '-无水印.mp4';

    if (!videoUrl) {
        console.error('抱歉，获取视频播放信息失败');
        alert('抱歉，获取视频播放信息失败');
    }

    try {
        const response = await fetch(videoUrl, {mode: 'cors', referrer: ''});
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = videoName;
        a.style.display = 'none';
        document.body.appendChild(a);
        setTimeout(() => {
            a.click();
        }, 10);
        setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
            link.style.cursor = btnOriginStyle.cursor;
            link.style.backgroundColor = btnOriginStyle.backgroundColor;
            isDownloading = false;
        }, 1000);

    } catch (error) {
        console.error('加载失败，请确保服务器开启了 CORS 支持。');
        alert('加载失败，请确保服务器开启了 CORS 支持。');
        link.style.cursor = btnOriginStyle.cursor;
        link.style.backgroundColor = btnOriginStyle.backgroundColor;
    }

}

function getVideoName() {
    let url = new URL(location.href);
    let vid = url.searchParams.get('video_id');
    const videoName = 'video_id-' + vid;

    return videoName;
}

function getKeyFromUrl(url) {
    const UrlObj = new URL(url);
    const urlKey = UrlObj.pathname;

    return urlKey;
}

async function getUrlByVid(vid) {
    const url = 'https://www.doubao.com/samantha/media/get_play_info?version_code=20800&language=zh-CN&device_platform=web&aid=497858&real_aid=497858&pkg_type=release_version&device_id=&pc_version=2.51.7&region=&sys_region=&samantha_web=1&use-olympus-account=1&web_tab_id=';

    try {
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'origin': 'https://www.doubao.com',
            },
            referrer: '',
            body: JSON.stringify({key: vid}),
        });

        let result = await response.json();

        if (!result || !result.data) {

            return false;
        }

        let main_url = await result.data.original_media_info.main_url;

        return main_url;
    } catch (e) {
        console.error('获取视频播放信息失败:', e);

        return null;
    }
}
