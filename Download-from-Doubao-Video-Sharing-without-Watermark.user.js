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
// @grant           GM_xmlhttpRequest
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

    if (!videoUrl) {
        console.error('抱歉，获取视频播放信息失败');
        alert('抱歉，获取视频播放信息失败');

        return false;
    }

    let videoName = getVideoName();

    videoName = videoName + '-无水印.mp4';

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

    if (customPostfixName) {
        videoName = videoName + '-' + customPostfixName;
    }

    return videoName;
}

async function getUrlByVid(vid) {
    const videoModel = await getDoubaoVideoModelFromVideoId(vid);

    if (!videoModel) {

        return false;
    }

    const urlList = await getUrlByModel(videoModel);
    const randomPickedVideoUrl = urlList[Math.floor(Math.random() * urlList.length)];

    return randomPickedVideoUrl;
}

async function getDoubaoVideoModelFromVideoId(vid) {
    const response = await fetch('https://www.doubao.com/alice/resource/get_video_model', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            params: [{
                uri: vid,
            },],
        }),
    });

    const result = await response.json();

    if (result.code != 0) {
        console.log(result);
        alert(result.msg);

        return false;
    }

    let videoModel = JSON.parse(result.data.results[0].video_model_result.video_model);

    return videoModel;
}

async function getUrlByModel(videoModel) {
    const fallbackApi = videoModel.fallback_api;
    const url = getNoWatermarkApi(fallbackApi);

    const r = await GM.xmlHttpRequest({
        method: 'GET',
        url: url,
        referrer: '',
    }).catch(e => console.error(e));

    const response = JSON.parse(r.response);
    const videoInfoData = response.video_info.data;
    let urlList = await decipherUrlsFromVideoInfoData(videoInfoData);

    return urlList;
}

async function decipherUrlsFromVideoInfoData(videoInfoData) {
    const keySeed = videoInfoData.key_seed;
    const FPLAY_KDF_SALT = 'TdTC5rgxYgkOUrPHpnM7pByyRiuCmrWKGWs521cXdST0m69/COjWjSanLjfBqVovHwWlGJKu8pSXMrYqOKrdWA==';

    let urlListRaw = [];
    urlListRaw.push(videoInfoData.video_list.video_1.main_url);
    urlListRaw.push(videoInfoData.video_list.video_1.backup_url_1);

    let urlList = [];

    for (const urlRaw of urlListRaw) {
        try {
            const b64ToBytes = (v) => {
                const s = String(v || '');
                const base64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
                const bin = atob(base64);
                return Uint8Array.from(bin, c => c.charCodeAt(0));
            };

            const encrypted = b64ToBytes(urlRaw);
            const seed = b64ToBytes(keySeed);
            const ciphertext = encrypted.slice(4);
            const subtle = crypto.subtle;
            const firstHash = new Uint8Array(await subtle.digest('SHA-512', seed));
            const keyMaterial = new Uint8Array(128);
            const salt = b64ToBytes(FPLAY_KDF_SALT);
            keyMaterial.set(firstHash, 0);
            keyMaterial.set(salt, 64);
            const derived = new Uint8Array(await subtle.digest('SHA-512', keyMaterial));
            const keyBytes = derived.slice(0, 16);
            const iv = derived.slice(16, 32);
            const cryptoKey = await subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['decrypt']);
            const decrypted = new Uint8Array(
                await subtle.decrypt({name: 'AES-CBC', iv}, cryptoKey, ciphertext)
            );
            let end = decrypted.length;
            const pad = decrypted[end - 1];
            if (pad >= 1 && pad <= 16) {
                let valid = true;
                for (let i = 0; i < pad; i++) {
                    if (decrypted[end - 1 - i] !== pad) {
                        valid = false;
                        break;
                    }
                }
                if (valid) {
                    end -= pad;
                }
            }
            const rst = new TextDecoder().decode(decrypted.slice(0, end)).trim();
            urlList.push(rst);
        } catch (e) {
            console.log(e);
        }
    }

    return urlList;
}

function getNoWatermarkApi(fallback_api) {
    try {
        const url = new URL(fallback_api);
        if (!url.searchParams.get('key_seed')) {
            return false;
        }
        url.searchParams.delete('force_fids');
        url.searchParams.delete('logo_type');
        url.searchParams.set('codec_type', '1');

        return url.toString();
    } catch (e) {
        console.log(e);
    }
}
