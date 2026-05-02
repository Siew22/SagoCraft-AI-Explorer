/**
 * SagoCraft AI Explorer - 核心交互脚本
 * 功能：多语言切换、页面导航、文件上传分析、实时摄像头追踪绘图
 */

// ==========================================
// 1. 全局配置
// ==========================================
// 在全栈模式下，直接使用相对路径即可。
// 如果是跨域调试，请改为 "http://127.0.0.1:8000/api/scan_frame"
const API_URL = "/api/scan_frame"; 

let currentLanguage = 'zh';
let liveInterval = null;
let stream = null;

// ==========================================
// 2. 多语言字典
// ==========================================
const translations = {
    zh: {
        nav_history: "历史与文化", nav_process: "制作工序", nav_ai: "智能探测", nav_map: "地理位置",
        hist_title: "马兰诺族与硕莪：<br>生命之源",
        hist_p1: "在马来西亚砂拉越中部的沿海沼泽地带（如 Mukah 与 Dalat），硕莪（Sago）不仅仅是一种植物，它是马兰诺（Melanau）族人数百年来的生命血脉。",
        proc_title: "传统工艺流程",
        proc_step1: "01. 摇筛 (MENGAYAK)", proc_desc1: "工人们反复摇晃藤编竹筛 (Nyiru)，过滤出最细腻的粉末。",
        proc_step2: "02. 烘烤 (MEMBAKAR)", proc_desc2: "在巨大的传统泥炉 (Belanga) 上，精确控制火候进行烘烤。",
        proc_step3: "03. 成品 (SAGU KOMBO)", proc_desc3: "金黄酥脆的 Sagu 颗粒，是马兰诺文化的珍贵馈赠。",
        ai_title: "SAGO <span>TRACKER</span>", ai_subtitle: "请选择照片/影片上传，或开启实时追踪模式进行现场探测。",
        ai_drop: "点击或拖拽上传", ai_format: "支持 JPG, PNG, MP4 格式",
        ai_can_detect: "🎯 可探测目标：", ai_target1: "传统泥炉 (Belanga)", ai_target2: "摇筛工具 (Nyiru)", ai_target3: "操作工人 (Worker)", ai_target4: "包装成品 (Sago Pack)",
        ai_btn: "开始分析",
        map_title: "SAGO FACTORY, KAMPUNG MEDONG", map_desc: "Dalat, Mukah, Sarawak"
    },
    en: {
        nav_history: "History & Heritage", nav_process: "Process", nav_ai: "AI Detection", nav_map: "Location",
        hist_title: "Melanau & Sago:<br>The Source of Life",
        hist_p1: "In the coastal regions of Mukah and Dalat, Sago is the lifeblood of the Melanau people.",
        proc_title: "CRAFTING PROCESS",
        proc_step1: "01. SIFTING (MENGAYAK)", proc_desc1: "Shaking the traditional Nyiru sieve to filter fine sago starch.",
        proc_step2: "02. ROASTING (MEMBAKAR)", proc_desc2: "Stir-roasting on massive Belanga clay ovens over wood fire.",
        proc_step3: "03. PRODUCT (SAGU KOMBO)", proc_desc3: "Crispy golden Sago pearls, a timeless gift from the Melanau.",
        ai_title: "SAGO <span>TRACKER</span>", ai_subtitle: "Upload media or start live tracking mode for instant AI analysis.",
        ai_drop: "Click or Drag to Upload", ai_format: "Supports JPG, PNG, MP4",
        ai_can_detect: "🎯 Detectable Targets:", ai_target1: "Clay Oven (Belanga)", ai_target2: "Bamboo Sieve (Nyiru)", ai_target3: "Worker", ai_target4: "Sago Pack",
        ai_btn: "START ANALYSIS",
        map_title: "SAGO FACTORY, KAMPUNG MEDONG", map_desc: "Dalat, Mukah, Sarawak"
    },
    ms: {
        nav_history: "Sejarah & Warisan", nav_process: "Proses", nav_ai: "Pengesanan AI", nav_map: "Lokasi",
        hist_title: "Melanau & Sagu:<br>Nadi Kehidupan",
        hist_p1: "Di pesisir Mukah dan Dalat, Sagu adalah nadi kehidupan masyarakat Melanau.",
        proc_title: "PROSES TRADISIONAL",
        proc_step1: "01. MENGAYAK", proc_desc1: "Menggunakan Nyiru tradisional untuk menapis kanji sagu yang halus.",
        proc_step2: "02. MEMBAKAR", proc_desc2: "Dibakar di atas ketuhar Belanga besar dengan kawalan api kayu.",
        proc_step3: "03. PRODUK (SAGU KOMBO)", proc_desc3: "Mutiara Sagu emas yang rangup, warisan kraf Melanau.",
        ai_title: "PENGESANAN <span>PINTAR</span>", ai_subtitle: "Muat naik media atau mulakan mod pengesanan masa nyata.",
        ai_drop: "Klik untuk Muat Naik", ai_format: "Format JPG, PNG, MP4",
        ai_can_detect: "🎯 Sasaran Pengesanan:", ai_target1: "Ketuhar (Belanga)", ai_target2: "Penapis (Nyiru)", ai_target3: "Pekerja", ai_target4: "Produk Sagu",
        ai_btn: "MULA ANALISIS",
        map_title: "SAGO FACTORY, KAMPUNG MEDONG", map_desc: "Dalat, Mukah, Sarawak"
    }
};

// ==========================================
// 3. 初始化与页面控制
// ==========================================
window.onload = () => {
    // 绑定语言
    const langSelector = document.getElementById('lang-switch');
    if(langSelector) langSelector.onchange = (e) => changeLanguage(e.target.value);

    // 绑定模式切换
    document.getElementById('btn-upload-mode').onclick = () => switchMode('upload');
    document.getElementById('btn-live-mode').onclick = () => switchMode('live');

    // 绑定文件上传
    const fileInput = document.getElementById('file-upload');
    const dropZone = document.getElementById('drop-zone');
    if(dropZone) dropZone.onclick = () => fileInput.click();

    fileInput.onchange = handleFileSelect;
    document.getElementById('analyze-btn').onclick = runUploadAnalysis;
};

function showPage(pageId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    if(event) event.currentTarget.classList.add('active');

    // 离开AI探测页面时自动关闭摄像头
    if (pageId !== 'ai') stopWebcam();
}

function changeLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(translations[lang][key]) el.innerHTML = translations[lang][key];
    });
}

// ==========================================
// 4. AI 检测核心逻辑 (通用绘图函数)
// ==========================================

/**
 * 在 Canvas 上绘制识别框
 * @param {HTMLVideoElement|HTMLImageElement} source 图像源
 * @param {HTMLCanvasElement} canvas 画布元素
 * @param {Object} data 后端返回的 JSON
 */
function drawDetections(source, canvas, data) {
    const ctx = canvas.getContext('2d');
    
    // 步骤1：对齐画布与显示尺寸 (解决框框跑偏问题)
    canvas.width = source.clientWidth || source.width;
    canvas.height = source.clientHeight || source.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 步骤2：计算缩放比例 (后端坐标是基于原图分辨率的)
    const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
    const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
    const scaleX = canvas.width / sourceWidth;
    const scaleY = canvas.height / sourceHeight;

    if (data.vision_details && data.vision_details.detected_objects) {
        data.vision_details.detected_objects.forEach(obj => {
            const [x1, y1, x2, y2] = obj.bounding_box;
            
            // 计算屏幕实际位置
            const rx = x1 * scaleX;
            const ry = y1 * scaleY;
            const rw = (x2 - x1) * scaleX;
            const rh = (y2 - y1) * scaleY;

            // 绘制绿色方框
            ctx.strokeStyle = "#00FF00";
            ctx.lineWidth = 3;
            ctx.strokeRect(rx, ry, rw, rh);

            // 绘制文字背景标签
            ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
            const gender = obj.attributes.gender ? ` | ${obj.attributes.gender}` : "";
            const idStr = obj.object_id ? ` ID:${obj.object_id}` : "";
            const label = `${obj.object_name}${idStr}${gender}`;
            
            ctx.font = "bold 14px Inter, Arial";
            const labelWidth = ctx.measureText(label).width;
            ctx.fillRect(rx, ry - 25, labelWidth + 10, 25);

            // 绘制文字
            ctx.fillStyle = "black";
            ctx.fillText(label, rx + 5, ry - 7);
        });
    }
}

// ==========================================
// 5. 模式 A：文件上传分析
// ==========================================

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const preview = document.getElementById('preview-container');
    
    // 清空并创建新的预览元素 + Canvas
    preview.innerHTML = `
        <div style="position:relative; display:inline-block;">
            ${file.type.startsWith('image') 
                ? `<img id="upload-img" src="${url}" style="max-height:400px; border-radius:8px;">`
                : `<video id="upload-video" src="${url}" controls style="max-height:400px;"></video>`}
            <canvas id="upload-canvas" style="position:absolute; top:0; left:0; pointer-events:none;"></canvas>
        </div>
    `;
}

async function runUploadAnalysis() {
    const fileInput = document.getElementById('file-upload');
    const resultDiv = document.getElementById('upload-results');
    if (!fileInput.files[0]) return alert("请先上传文件");

    resultDiv.innerHTML = '<p style="color:var(--accent);">⌛ AI 模型正在深度分析中...</p>';
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await response.json();
        
        // 1. 在预览图上画框
        const img = document.getElementById('upload-img') || document.getElementById('upload-video');
        const canvas = document.getElementById('upload-canvas');
        if(img && canvas) drawDetections(img, canvas, data);

        // 2. 显示详细文字结果
        const prob = (data.bayesian_inference.quality_probability * 100).toFixed(1);
        resultDiv.innerHTML = `
            <div style="background:rgba(196,164,124,0.15); padding:20px; border-radius:8px; border-left:4px solid var(--accent);">
                <h3 style="margin:0; color:var(--accent)">工序推断: ${data.action_recognized}</h3>
                <p><b>预计质量分数:</b> <span style="color:#00FF00">${prob}%</span></p>
                <p><b>AI 建议:</b> ${data.bayesian_inference.insight}</p>
            </div>
        `;
    } catch (err) {
        resultDiv.innerHTML = `<p style="color:red">后端连接失败: ${err.message}</p>`;
    }
}

// ==========================================
// 6. 模式 B：实时摄像头追踪
// ==========================================

function switchMode(mode) {
    document.getElementById('upload-ui').style.display = mode === 'live' ? 'none' : 'block';
    document.getElementById('live-ui').style.display = mode === 'live' ? 'block' : 'none';
    
    document.getElementById('btn-upload-mode').classList.toggle('active', mode === 'upload');
    document.getElementById('btn-live-mode').classList.toggle('active', mode === 'live');

    if (mode === 'live') startWebcam(); else stopWebcam();
}

async function startWebcam() {
    const video = document.getElementById('webcam');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment", width: 1280, height: 720 } 
        });
        video.srcObject = stream;
        document.getElementById('live-results').innerHTML = "📡 AI 视觉引擎已连接...";
        
        // 每 600ms 捕获一帧并请求 AI
        liveInterval = setInterval(captureAndTrack, 600);
    } catch (err) {
        alert("摄像头开启失败: " + err.message);
    }
}

function stopWebcam() {
    if (liveInterval) clearInterval(liveInterval);
    if (stream) stream.getTracks().forEach(t => t.stop());
}

async function captureAndTrack() {
    const video = document.getElementById('webcam');
    const canvas = document.createElement('canvas');
    if (!video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');
        formData.append('track', 'true'); // 关键：告知后端启用追踪 ID

        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const data = await response.json();
            
            // 实时绘图
            const overlay = document.getElementById('canvas-overlay');
            drawDetections(video, overlay, data);

            // 更新状态文字
            const prob = (data.bayesian_inference.quality_probability * 100).toFixed(1);
            document.getElementById('live-results').innerHTML = `
                <b>${data.action_recognized}</b> <br> 
                质量估算: ${prob}%
            `;
        } catch (e) { console.error("Real-time API error"); }
    }, 'image/jpeg', 0.5);
}