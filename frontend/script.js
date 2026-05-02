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

let currentLanguage = 'en';
let liveInterval = null;
let stream = null;
let historyVideoIndex = 0;
let historyVideoTimer = null;
let historyVideoPlayer = null;
let historyVideoTitle = null;
let historyVideoRefLabel = null;
let historyVideoRef = null;

// ==========================================
// 2. 多语言字典
// ==========================================
const translations = {
    zh: {
        nav_history: "主页", nav_process: "制作工序", nav_ai: "智能探测", nav_map: "地理位置",
        hist_intro_title: "简介与历史",
        hist_intro_p1: "砂拉越的马兰诺族与硕莪树（rumbia）息息相关，他们是其主要的种植者和消费者。在1940年代日据时期，硕莪成为了当地重要的主食。沐胶是砂拉越最大的硕莪种植区，其他产区还包括达拉, 玛都, 达若和乌也。",
        hist_food_title: "传统硕莪美食",
        hist_food_item1: "硕莪粉与硕莪黏糊： 当地人将硕莪粉（lemantak）加入热水搅拌，制成硕莪黏糊 (linut) ——一种浓稠胶状的主食，通常搭配参巴峇拉煎 (sambal belacan) 和各种配菜食用，用来替代米饭。",
        hist_food_item2: "硕莪粒 (Bulu)： 这种花生般大小的传统硕莪粒非常适合作为小吃，通常搭配 umai 或烤鱼一起享用。虽然传统的制作过程复杂且耗时，但马兰诺族至今依然保留并传承着这项手艺。",
        melanau_title: "马兰诺族",
        melanau_p1: "马兰诺族是砂拉越的原住民，属于南岛语族，也是该州最早的内陆居民之一。根据 Morris（1991）的研究，他们在语言和社会上与 加影族 (Kajang)、加央族（Kayan）、肯雅族（Kenyah）和比达友族（Bidayuh）有着密切联系。沐胶河和乌也是他们从内陆向沿海地区迁徙的古老路线，如今他们的村落大多建在河畔和海边。",
        melanau_p2: "迁徙到沿海后，他们经历了两次主要的身份转变：首先是为了适应沿海环境而改变的文化习俗，其次是伊斯兰化的影响。如今，大多数马兰诺人信奉伊斯兰教，部分信奉基督教，但仍有少数人保留着对海神 “inah” 或 “ipok” 的传统信仰。",
        melanau_p3: "在过去，马兰诺族居住在独特的三层高脚屋中，以方便防御敌人的攻击。随着时代变迁，现代的马兰诺人已经改住独立的房屋。他们主要聚居在北部拉让河谷、依干、玛都-达若、沐胶、乌也和民都鲁等沿海地区，同时也分布在古晋、诗巫和美里等主要城市。",
        sago_title: "硕莪",
        sago_p1: "在过去，硕莪是马兰诺族的主要食物，也是他们替代米饭的日常主食。它有几种著名的当地种类，如沐胶、美冬和杜伯的硕莪。制作这项传统美食的原料包括硕莪粉、椰奶、细干椰丝、盐以及稻米粉。",
        additional_info_title: "观看视频",
        video_title_mukah: "关于沐胶的更多信息",
        video_title_melanau: "关于马兰诺族的更多信息",
        video_title_sagu: "关于硕莪的更多信息",
        process_video_name: "工序视频",
        video_reference_label: "参考:",
        process_video_title: "工序视频",
        mukah_title: "沐胶",
        mukah_p1: "沐胶 位于砂拉越中部，面朝南中国海，是砂拉越的第 10 省。其总面积为 6,997.61 平方公里，人口达 124,311 人（2008年），多数居民为马兰诺族。",
        mukah_p2: "沐胶 于 2002 年 3 月 1 日正式升格为省，行政中心设在 沐胶 县。目前，该省下辖 5 个县（沐胶, 达拉, 玛都, 达若和丹绒玛尼 ）以及 3 个副县（万年烟, 乌也和依干 ）。",
        mukah_p3: "沐胶 省内的所有地区均可通过陆路到达。前往 沐胶 镇非常方便，搭乘MasWings航班前往 古晋或美里均只需 1 小时航程。陆路方面，游客可从诗巫或民都鲁驱车前往，其中民都鲁距离最近，经沿海公路仅需 2 小时车程。此外，从诗巫乘坐快艇前往达拉镇也是一种选择，航程同样约 2 小时。",
        proc_title: "硕莪制作过程",
        proc_step1_title: "1. Tubeng Balau (砍伐)",
        proc_step1_desc: "硕莪树通常在开花前砍伐，因为此时其茎干内的淀粉含量最高。每棵硕莪树可产出 150 至 300 公斤的淀粉。",
        proc_step2_title: "2. Marut (削碎)",
        proc_step2_desc: "剥去树皮 (Ungun) 后，将髓心 (Sei Balau) 放置在由两根原木绑成的 Lagan 上。接着使用刨丝器 (Parut) 将其削成碎末状，称为 Pou。",
        proc_step3_title: "3. Menyak (提取)",
        proc_step3_desc: "将 Pou 带到名为 Nyanan（或 Jagen）的工坊，放在亚答叶席 (Idaih) 上。使用由硕莪叶柄 (Ukap balau) 制成的圆锥形水桶 (Terusueng) 舀取河水混合。工人们光着脚踩踏揉捏以提取生硕莪淀粉 (Sei)，淀粉会沉淀在容器 (Jalur) 底部，随后通过末端的小孔 (Serebut) 排出多余的水分。",
        proc_step4_title: "4. Mela'uek (清洗)",
        proc_step4_desc: "收集沉淀在底部的 Sei，将其放在木船 (Salui) 上的粗棉布 (Tapih) 中进行多次清洗和过滤，以彻底去除杂质。",
        proc_step5_title: "5. Mengulud (揉捏)",
        proc_step5_desc: "将洗净的 Sei 与椰丝 (Benyuh Parut)、米糠 (Dabou Padai) 和盐 (Sia) 混合。随后在特制的亚答叶席 (Kejangan) 上反复滚动揉捏。",
        proc_step6_title: "6. Mengugoh (成型)",
        proc_step6_desc: "经过揉捏后，使用悬挂在绳子上的漏勺 (Takueang) 进行筛分，使混合物形成圆润的小颗粒。",
        proc_step7_title: "7. Mu'ui (烹煮)",
        proc_step7_desc: "将生硕莪粒放在黏土炉 (Belanga) 上烤制，期间需不时摊开以确保受热均匀。冷却后存放在密封容器中，呈褐色的成品被称为 Sagok，通常搭配熏鱼 (Jekan Ipuong)、umai 或咖喱肉汁 (Keliseh) 一起享用。",
        proc_final_title: "即食",
        ai_title: "硕莪<span>追踪</span>", ai_subtitle: "请选择照片/影片上传，或开启实时追踪模式进行现场探测。",
        ai_drop: "点击或拖拽上传", ai_format: "支持 JPG, PNG, MP4 格式",
        ai_can_detect: "🎯 可探测目标：", ai_target1: "传统泥炉 (Belanga)", ai_target2: "摇筛工具 (Nyiru)", ai_target3: "操作工人 (Worker)", ai_target4: "包装成品 (Sago Pack)",
        ai_btn: "开始分析",ai_mode_upload: "文件上传模式", ai_mode_live: "实时追踪模式", ai_live_title: "实时数据反馈", ai_live_waiting: "等待检测结果...",
        map_title: "硕莪工厂", map_desc: "达拉, 沐胶, 砂拉越",
        map_text:"这里是硕莪文化保存最完整的地区，也是我们AI数据集采集的核心区域。"
    },
    en: {
        nav_history: "Home", nav_process: "Process", nav_ai: "AI Detection", nav_map: "Location",
        hist_intro_title: "Introduction & History",
        hist_intro_p1: "The Melanau community in Sarawak is deeply connected to the sago palm (rumbia), being its primary cultivators and consumers. During the 1940s Japanese occupation, sago became a crucial staple food. Today, Mukah is the largest sago cultivation area in Sarawak, alongside Matu Daro, Dalat, and Oya.",
        hist_food_title: "Traditional Sago Delicacies",
        hist_food_item1: "Lemantak & Linut: Sago flour (lemantak) is used to make linut, a thick, glue-like staple dish eaten with sambal belacan and side dishes as a substitute for rice.",
        hist_food_item2: "Sago Balls (Bulu): These traditional, peanut-sized sago beads are enjoyed as snacks, perfectly paired with umai or grilled fish. Although the traditional process is complex and time-consuming, the Melanau people proudly preserve this culinary heritage today.",
        melanau_title: "Melanau",
        melanau_p1: "The Melanau are an Austronesian indigenous group and among the earliest inland settlers of Sarawak. According to Morris (1991), they share linguistic and social ties with the Kajang, Kayan, Kenyah, and Bidayuh tribes. Batang Mukah and Oya served as their ancient migration routes from the inland to the coast, where their settlements are now mostly built along rivers and shorelines.",
        melanau_p2: "After migrating, they underwent two major identity shifts: adapting their culture to the coastal environment, and later, Islamization. Today, the majority of the Melanau are Muslims, with some practicing Christianity. However, a few still hold on to traditional beliefs in the sea spirit, known locally as \"inah\" or \"ipok\".",
        melanau_p3: "In the past, the Melanau built unique three-story tall houses for defense against enemy attacks. Today, they have adapted to modern lifestyles by living in separate, individual houses. Their population is concentrated in coastal areas such as the northern Rajang river valley, Igan, Matu-Daro, Mukah, Oya, and Bintulu, as well as in major cities like Kuching, Sibu, and Miri.",
        sago_title: "Sago",
        sago_p1: "In the past, sago was the primary staple food and the main substitute for rice among the Melanau community. There are several well-known local varieties, such as Sago Mukah, Sago Medong, and Sago tupek. This traditional delicacy is prepared using authentic ingredients including lemantak (sago flour), coconut milk, fine desiccated coconut, salt, and rice powder.",
        additional_info_title: "Watch the Video",
        video_title_mukah: "More info about Mukah",
        video_title_melanau: "More info about Melanau",
        video_title_sagu: "More info about Sagu",
        process_video_name: "Process Video",
        video_reference_label: "Reference:",
        process_video_title: "Process Video",
        mukah_title: "Mukah",
        mukah_p1: "Located in the central region of Sarawak facing the South China Sea, Mukah is the 10th administrative division of the state. It covers 6,997.61 square kilometers with a population of 124,311 (2008), predominantly made up of the Melanau ethnic group.",
        mukah_p2: "Mukah was officially elevated to a Division on March 1, 2002, with Mukah District as its administrative center. Currently, it consists of five districts—Mukah, Dalat, Matu, Daro, and Tanjung Manis—along with three sub-districts: Balingian, Oya, and Igan.",
        mukah_p3: "All districts in Mukah are fully accessible by road. The town of Mukah can be reached by air via MasWings flights connecting to Kuching and Miri, each taking about an hour. By land, it is accessible from Sibu and Bintulu, with Bintulu being the closest city at just a two-hour drive via the coastal road. Alternatively, a two-hour speedboat ride is available from Sibu to Dalat town.",
        proc_title: "Process of Making Sago",
        proc_step1_title: "1. Tubeng Balau (Felling)",
        proc_step1_desc: "The sago palm is felled just before flowering, when its stem is richest in starch. A single palm can yield between 150 to 300 kg of starch.",
        proc_step2_title: "2. Marut (Shredding)",
        proc_step2_desc: "After removing the bark (Ungun), the sago pith (Sei Balau) is placed on a Lagan (two tied logs with a small gap). A shredder (Parut) is then used to produce shredded pith called Pou.",
        proc_step3_title: "3. Menyak (Extraction)",
        proc_step3_desc: "The Pou is brought to an extraction house (Nyanan or Jagen) and placed onto a nypa leaf mat (Idaih). It is mixed with river water drawn using a conical bucket (Terusueng) made of a sago frond (Ukap balau). The extraction is done by trampling and kneading the wet Pou barefoot to produce raw sago starch (Sei). This settles at the bottom of a container (Jalur), and the excess water is drained through a small hole (Serebut).",
        proc_step4_title: "4. Mela'uek (Cleaning)",
        proc_step4_desc: "The settled Sei is collected and placed on a cheesecloth (Tapih) inside a boat (Salui). It is washed and strained repeatedly to remove any impurities.",
        proc_step5_title: "5. Mengulud (Kneading)",
        proc_step5_desc: "The raw Sei is mixed with shredded coconut (Benyuh Parut), rice bran (Dabou Padai), and salt (Sia). The mixture is repeatedly rolled and kneaded on a special nypa mat known as Kejangan.",
        proc_step6_title: "6. Mengugoh (Pearling)",
        proc_step6_desc: "Following the Mengulud process, the mixture is sifted using a rope-suspended colander (Takueang) to form small, round grains.",
        proc_step7_title: "7. Mu'ui (Cooking)",
        proc_step7_desc: "These raw sago pearls are cooked on a clay oven (Belanga) and must be spread occasionally to cook evenly. Once cooled, the brownish end product, known as Sagok, is stored in tight containers and perfectly enjoyed with smoked fish (Jekan Ipuong), umai, or curry gravy (Keliseh).",
        proc_final_title: "Ready-to-Eat",
        ai_title: "SAGO <span>TRACKER</span>", ai_subtitle: "Upload media or start live tracking mode for instant AI analysis.",
        ai_drop: "Click or Drag to Upload", ai_format: "Supports JPG, PNG, MP4",
        ai_can_detect: "🎯 Detectable Targets:", ai_target1: "Clay Oven (Belanga)", ai_target2: "Bamboo Sieve (Nyiru)", ai_target3: "Worker", ai_target4: "Sago Pack",
        ai_btn: "START ANALYSIS", ai_mode_upload: "File Upload Mode", ai_mode_live: "Live Tracking Mode", ai_live_title: "LIVE FEED DATA", ai_live_waiting: "Waiting for detection results...",
        map_title: "SAGO FACTORY", map_desc: "Dalat, Mukah, Sarawak",
        map_text:"This is the area where sago culture is best preserved, and it is also the core region for our AI dataset collection."
    },
    ms: {
        nav_history: "Laman Utama", nav_process: "Proses", nav_ai: "Pengesanan AI", nav_map: "Lokasi",
        hist_intro_title: "Pengenalan & Sejarah",
        hist_intro_p1: "Masyarakat Melanau di Sarawak sangat sinonim dengan pokok sagu (rumbia), sebagai penanam dan pengguna utamanya. Semasa pendudukan Jepun pada 1940-an, sagu menjadi makanan ruji yang penting bagi penduduk tempatan. Mukah merupakan kawasan penanaman sagu terbesar di Sarawak, selain Matu Daro, Dalat, dan Oya.",
        hist_food_title: "Hidangan Tradisional Sagu",
        hist_food_item1: "Lemantak & Linut: Tepung sagu (lemantak) dibancuh dengan air panas untuk membuat linut, hidangan pekat dan melekit yang dinikmati bersama sambal belacan dan lauk-pauk sebagai pengganti nasi.",
        hist_food_item2: "Bebola Sagu (Bulu): Bebola sagu tradisional bersaiz kacang tanah ini sesuai dijadikan snek dan dimakan bersama umai atau ikan bakar. Proses pembuatannya adalah rumit dan memakan masa, namun masyarakat Melanau masih mengekalkan kaedah tradisional ini sehingga kini.",
        melanau_title: "Melanau",
        melanau_p1: "Kaum Melanau merupakan penduduk asli Austronesia dan antara peneroka terawal di kawasan pedalaman Sarawak. Menurut Morris (1991), mereka mempunyai hubungan linguistik dan sosial dengan suku Kajang, Kayan, Kenyah, dan Bidayuh. Batang Mukah dan Oya menjadi jalur migrasi purba mereka dari kawasan hulu ke pesisir pantai, dan kini perkampungan mereka kebanyakannya dibina di tepi sungai dan berdekatan pantai.",
        melanau_p2: "Selepas berhijrah ke pesisir pantai, kaum Melanau melalui dua perubahan identiti utama: penyesuaian budaya dengan persekitaran baharu dan pengaruh Islamisasi. Kini, majoriti kaum Melanau beragama Islam dan sebahagiannya beragama Kristian. Walau bagaimanapun, masih terdapat segelintir yang mengekalkan kepercayaan tradisional terhadap tuhan laut yang dikenali sebagai \"inah\" atau \"ipok\".",
        melanau_p3: "Pada zaman dahulu, masyarakat Melanau tinggal di rumah tinggi tiga tingkat yang unik untuk memudahkan mereka mempertahankan diri daripada serangan musuh. Mengikut peredaran zaman, mereka kini mendiami rumah moden yang berasingan. Populasi mereka tertumpu di kawasan pesisir pantai seperti lembah utara Sungai Rajang, Igan, Matu-Daro, Mukah, Oya, dan Bintulu, serta boleh didapati di bandar utama seperti Kuching, Sibu, dan Miri.",
        sago_title: "Sagu",
        sago_p1: "Pada masa dahulu, sagu merupakan makanan ruji utama dan pengganti nasi bagi masyarakat Melanau. Terdapat beberapa variasi tempatan yang terkenal, seperti Sagu Mukah, Sagu Medong, dan Sagu tupek. Hidangan tradisional ini dihasilkan menggunakan adunan bahan-bahan asli termasuk lemantak (tepung sagu), santan, kelapa kering halus, garam, dan serbuk padi.",
        additional_info_title: "Tonton Video",
        video_title_mukah: "Maklumat lanjut tentang Mukah",
        video_title_melanau: "Maklumat lanjut tentang Melanau",
        video_title_sagu: "Maklumat lanjut tentang Sagu",
        process_video_name: "Video Proses",
        video_reference_label: "Rujukan:",
        process_video_title: "Video Proses",
        mukah_title: "Mukah",
        mukah_p1: "Bahagian Mukah terletak di wilayah tengah Sarawak dan menghadap Laut China Selatan. Ia merupakan bahagian ke-10 di Sarawak dengan keluasan 6,997.61 kilometer persegi dan populasi 124,311 orang (2008), di mana kaum Melanau merupakan penduduk majoriti.",
        mukah_p2: "Mukah rasmi menjadi sebuah Bahagian pada 1 Mac 2002 dengan pusat pentadbiran di Daerah Mukah. Kini, ia merangkumi lima daerah iaitu Mukah, Dalat, Matu, Daro, dan Tanjung Manis, serta tiga daerah kecil iaitu Balingian, Oya, dan Igan.",
        mukah_p3: "Semua daerah di Mukah kini mudah dihubungi melalui jalan raya. Bandar Mukah boleh diakses melalui penerbangan MasWings ke Kuching dan Miri yang masing-masing mengambil masa satu jam. Untuk perjalanan darat, ia boleh dihubungi dari Sibu atau Bintulu, di mana Bintulu merupakan bandar terdekat dengan jarak sekitar dua jam melalui jalan pesisir. Selain itu, pengunjung juga boleh menaiki bot laju dari Sibu ke pekan Dalat yang mengambil masa dua jam.",
        proc_title: "Proses Menghasilkan Sagu",
        proc_step1_title: "1. Tubeng Balau (Penebangan)",
        proc_step1_desc: "Pokok sagu ditebang sejurus sebelum berbunga apabila kandungan kanjinya paling tinggi. Setiap pokok mampu menghasilkan sekitar 150 hingga 300 kg kanji.",
        proc_step2_title: "2. Marut (Pemprosesan Empulur)",
        proc_step2_desc: "Selepas kulit kayu (Ungun) dibuang, empulur (Sei Balau) diletakkan di atas Lagan (dua batang kayu yang diikat dengan celah kecil). Alat pemarut (Parut) kemudiannya digunakan untuk menghasilkan empulur hancur yang dipanggil Pou.",
        proc_step3_title: "3. Menyak (Pengekstrakan Kanji)",
        proc_step3_desc: "Pou dibawa ke rumah perahan (Nyanan atau Jagen) dan diletakkan di atas tikar nipah (Idaih). Ia dicampur dengan air sungai menggunakan baldi kon (Terusueng) yang diperbuat daripada pelepah sagu (Ukap balau). Pou dipijak dan diuli tanpa alas kaki untuk mengekstrak campuran air dan kanji mentah (Sei). Campuran ini dikumpul dalam bekas mendapan (Jalur). Setelah Sei mendap, air dibuang melalui lubang kecil bernama Serebut.",
        proc_step4_title: "4. Mela'uek (Pembersihan)",
        proc_step4_desc: "Sei yang mendap dikumpul dan diletakkan di atas kain penapis (Tapih) di dalam perahu (Salui). Ia dibasuh dan ditapis berulang kali untuk membuang segala kotoran.",
        proc_step5_title: "5. Mengulud (Menguli Bahan)",
        proc_step5_desc: "Kanji mentah (Sei) dicampur dengan kelapa parut (Benyuh Parut), dedak padi (Dabou Padai), dan garam (Sia). Campuran ini digelek dan diuli berulang kali di atas tikar nipah khas yang dipanggil Kejangan.",
        proc_step6_title: "6. Mengugoh (Membentuk Bebola)",
        proc_step6_desc: "Selepas proses Mengulud, campuran diayak menggunakan penapis yang digantung dengan tali (Takueang) untuk membentuk butiran bulat yang kecil.",
        proc_step7_title: "7. Mu'ui (Memasak)",
        proc_step7_desc: "Bebola sagu mentah dimasak di atas ketuhar tanah liat (Belanga) dan diratakan sentiasa agar masak sekata. Selepas disejukkan, produk akhir berwarna kecoklatan yang dipanggil Sagok ini disimpan di dalam bekas kedap udara, sedia dinikmati bersama ikan salai (Jekan Ipuong), umai, atau kuah kari (Keliseh).",
        proc_final_title: "Sedia Dimakan",
        ai_title: "PENGESAN <span>SAGU</span>", ai_subtitle: "Muat naik media atau mulakan mod pengesanan masa nyata.",
        ai_drop: "Klik untuk Muat Naik", ai_format: "Format JPG, PNG, MP4",
        ai_can_detect: "🎯 Sasaran Pengesanan:", ai_target1: "Ketuhar (Belanga)", ai_target2: "Penapis (Nyiru)", ai_target3: "Pekerja", ai_target4: "Produk Sagu",
        ai_btn: "MULA ANALISIS", ai_mode_upload: "Mod Muat Naik Fail", ai_mode_live: "Mod Penjejakan Langsung", ai_live_title: "DATA MAKLUM BALAS LANGSUNG", ai_live_waiting: "Menunggu keputusan pengesanan...",
        map_title: "SAGO FACTORY", map_desc: "Dalat, Mukah, Sarawak",
        map_text: "Ini adalah kawasan di mana budaya sagu dipelihara dengan terbaik, dan ia juga merupakan wilayah teras bagi pengumpulan set data AI kami."
    }
};

const historyVideos = [
    {
        src: "media/mukah.mp4",
        titleKey: "video_title_mukah",
        reference: "https://www.youtube.com/watch?v=9OTZleldBpQ"
    },
    {
        src: "media/melanau.mp4",
        titleKey: "video_title_melanau",
        reference: "https://www.youtube.com/watch?v=77vJ-iW2I38"
    },
    {
        src: "media/sagu.mp4",
        titleKey: "video_title_sagu",
        reference: "https://www.youtube.com/watch?v=Uj5SYO2e4Vo"
    }
];

// ==========================================
// 3. 初始化与页面控制
// ==========================================
window.onload = () => {
    // 绑定语言
    const langSelector = document.getElementById('lang-switch');
    if (langSelector) {
        langSelector.value = currentLanguage;
        langSelector.onchange = (e) => changeLanguage(e.target.value);
    }
    changeLanguage(currentLanguage);

    // 绑定模式切换
    document.getElementById('btn-upload-mode').onclick = () => switchMode('upload');
    document.getElementById('btn-live-mode').onclick = () => switchMode('live');

    // 绑定文件上传
    const fileInput = document.getElementById('file-upload');
    const dropZone = document.getElementById('drop-zone');
    if(dropZone) dropZone.onclick = () => fileInput.click();

    fileInput.onchange = handleFileSelect;
    document.getElementById('analyze-btn').onclick = runUploadAnalysis;

    initHistoryVideoCarousel();
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
    updateHistoryVideoMeta();
}

function initHistoryVideoCarousel() {
    historyVideoPlayer = document.getElementById('history-video-player');
    historyVideoTitle = document.getElementById('history-video-title');
    historyVideoRefLabel = document.getElementById('history-video-ref-label');
    historyVideoRef = document.getElementById('history-video-ref');

    if (!historyVideoPlayer || !historyVideoTitle || !historyVideoRefLabel || !historyVideoRef) {
        return;
    }

    const prevBtn = document.getElementById('history-video-prev');
    const nextBtn = document.getElementById('history-video-next');

    if (prevBtn) prevBtn.addEventListener('click', () => stepHistoryVideo(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => stepHistoryVideo(1));

    historyVideoPlayer.addEventListener('play', stopHistoryVideoTimer);
    historyVideoPlayer.addEventListener('ended', startHistoryVideoTimer);

    renderHistoryVideo();
    startHistoryVideoTimer();
}

function stepHistoryVideo(direction) {
    if (!historyVideos.length) return;
    historyVideoIndex = (historyVideoIndex + direction + historyVideos.length) % historyVideos.length;
    renderHistoryVideo();
    startHistoryVideoTimer();
}

function startHistoryVideoTimer() {
    if (historyVideoTimer) clearInterval(historyVideoTimer);
    if (historyVideos.length < 2) return;
    historyVideoTimer = setInterval(() => stepHistoryVideo(1), 5000);
}

function stopHistoryVideoTimer() {
    if (historyVideoTimer) {
        clearInterval(historyVideoTimer);
        historyVideoTimer = null;
    }
}

function renderHistoryVideo() {
    if (!historyVideoPlayer) return;
    const item = historyVideos[historyVideoIndex];
    historyVideoPlayer.pause();
    historyVideoPlayer.src = item.src;
    historyVideoPlayer.load();
    updateHistoryVideoMeta();
}

function updateHistoryVideoMeta() {
    if (!historyVideoTitle || !historyVideoRefLabel || !historyVideoRef) return;
    const item = historyVideos[historyVideoIndex];
    historyVideoTitle.textContent = translations[currentLanguage]?.[item.titleKey] || "";
    historyVideoRefLabel.textContent = translations[currentLanguage]?.video_reference_label || "Reference:";
    historyVideoRef.textContent = item.reference;
    historyVideoRef.href = item.reference;
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