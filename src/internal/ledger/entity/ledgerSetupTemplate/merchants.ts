import type { LedgerSetupMerchantTemplate } from "./ledgerSetupTemplate";

// 商家只定义一次；regions 与 tagKeys 分别表示地区和分类。
export const ledgerSetupMerchants = [
  {
    key: "aeon",
    name: "永旺",
    aliases: [
      {
        alias: "イオン",
        locale: "ja",
      },
      {
        alias: "AEON",
        locale: "en",
      },
      {
        alias: "イオンスタイル",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.aeon.com/",
    regions: ["jp"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "ito_yokado",
    name: "伊藤洋华堂",
    aliases: [
      {
        alias: "イトーヨーカドー",
        locale: "ja",
      },
      {
        alias: "Ito-Yokado",
        locale: "en",
      },
      {
        alias: "ヨーカドー",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.itoyokado.co.jp/",
    regions: ["jp"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "seiyu",
    name: "西友",
    aliases: [
      {
        alias: "SEIYU",
        locale: "en",
      },
      {
        alias: "せいゆう",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.seiyu.co.jp/",
    regions: ["jp"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "life",
    name: "ライフ",
    aliases: [
      {
        alias: "LIFE",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.lifecorp.jp/",
    regions: ["jp"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "gyomu_super",
    name: "业务超市",
    aliases: [
      {
        alias: "業務スーパー",
        locale: "ja",
      },
      {
        alias: "業スー",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.gyomusuper.jp/",
    regions: ["jp"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "costco",
    name: "好市多",
    aliases: [
      {
        alias: "コストコ",
        locale: "ja",
      },
      {
        alias: "Costco",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.costco.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "maxvalu",
    name: "マックスバリュ",
    aliases: [
      {
        alias: "MaxValu",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.mv-tokai.co.jp/",
    regions: ["jp"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "coop",
    name: "コープ",
    aliases: [
      {
        alias: "生協",
        locale: "ja",
      },
      {
        alias: "CO-OP",
        locale: "en",
      },
      {
        alias: "コープこうべ",
        locale: "ja",
      },
      {
        alias: "パルシステム",
        locale: "ja",
      },
    ],
    websiteUrl: "https://jccu.coop/",
    regions: ["jp"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "seven_eleven",
    name: "711",
    aliases: [
      {
        alias: "セブン-イレブン",
        locale: "ja",
      },
      {
        alias: "7-Eleven",
        locale: "en",
      },
      {
        alias: "セブン",
        locale: "ja",
      },
      {
        alias: "セブンイレブン",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.sej.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["convenience_store"],
    generic: false,
  },
  {
    key: "familymart",
    name: "全家",
    aliases: [
      {
        alias: "ファミリーマート",
        locale: "ja",
      },
      {
        alias: "FamilyMart",
        locale: "en",
      },
      {
        alias: "ファミマ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.family.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["convenience_store"],
    generic: false,
  },
  {
    key: "lawson",
    name: "罗森",
    aliases: [
      {
        alias: "ローソン",
        locale: "ja",
      },
      {
        alias: "LAWSON",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.lawson.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["convenience_store"],
    generic: false,
  },
  {
    key: "ministop",
    name: "ミニストップ",
    aliases: [
      {
        alias: "MINISTOP",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.ministop.co.jp/",
    regions: ["jp"],
    tagKeys: ["convenience_store"],
    generic: false,
  },
  {
    key: "daily_yamazaki",
    name: "デイリーヤマザキ",
    aliases: [
      {
        alias: "Daily Yamazaki",
        locale: "en",
      },
      {
        alias: "デイリー",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.daily-yamazaki.jp/",
    regions: ["jp"],
    tagKeys: ["convenience_store"],
    generic: false,
  },
  {
    key: "mcdonalds",
    name: "麦当劳",
    aliases: [
      {
        alias: "マクドナルド",
        locale: "ja",
      },
      {
        alias: "McDonald's",
        locale: "en",
      },
      {
        alias: "マック",
        locale: "ja",
      },
      {
        alias: "マクド",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.mcdonalds.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "yoshinoya",
    name: "吉野家",
    aliases: [
      {
        alias: "Yoshinoya",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.yoshinoya.com/",
    regions: ["jp", "cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "sukiya",
    name: "すき家",
    aliases: [
      {
        alias: "Sukiya",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.sukiya.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "matsuya",
    name: "松屋",
    aliases: [
      {
        alias: "Matsuya",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.matsuyafoods.co.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "saizeriya",
    name: "萨莉亚",
    aliases: [
      {
        alias: "サイゼリヤ",
        locale: "ja",
      },
      {
        alias: "Saizeriya",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.saizeriya.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "gusto",
    name: "ガスト",
    aliases: [
      {
        alias: "Gusto",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.skylark.co.jp/gusto/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "sushiro",
    name: "寿司郎",
    aliases: [
      {
        alias: "スシロー",
        locale: "ja",
      },
      {
        alias: "Sushiro",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.akindo-sushiro.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "kura_sushi",
    name: "藏寿司",
    aliases: [
      {
        alias: "くら寿司",
        locale: "ja",
      },
      {
        alias: "Kura Sushi",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.kurasushi.co.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "hama_sushi",
    name: "滨寿司",
    aliases: [
      {
        alias: "はま寿司",
        locale: "ja",
      },
      {
        alias: "Hama Sushi",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.hama-sushi.co.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "marugame",
    name: "丸龟制面",
    aliases: [
      {
        alias: "丸亀製麺",
        locale: "ja",
      },
      {
        alias: "Marugame",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.marugame.com/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "coco_ichibanya",
    name: "CoCo壹番屋",
    aliases: [
      {
        alias: "CoCo壱番屋",
        locale: "ja",
      },
      {
        alias: "ココイチ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.ichibanya.co.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "kfc",
    name: "肯德基",
    aliases: [
      {
        alias: "ケンタッキーフライドチキン",
        locale: "ja",
      },
      {
        alias: "KFC",
        locale: "en",
      },
      {
        alias: "ケンタッキー",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.kfc.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "mos_burger",
    name: "摩斯汉堡",
    aliases: [
      {
        alias: "モスバーガー",
        locale: "ja",
      },
      {
        alias: "MOS BURGER",
        locale: "en",
      },
      {
        alias: "モス",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.mos.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "uber_eats",
    name: "Uber Eats",
    aliases: [
      {
        alias: "ウーバーイーツ",
        locale: "ja",
      },
      {
        alias: "优步外卖",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.ubereats.com/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "demaecan",
    name: "出前館",
    aliases: [
      {
        alias: "でまえかん",
        locale: "ja",
      },
      {
        alias: "Demaecan",
        locale: "en",
      },
    ],
    websiteUrl: "https://demae-can.com/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "wolt",
    name: "Wolt",
    aliases: [
      {
        alias: "ウォルト",
        locale: "ja",
      },
    ],
    websiteUrl: "https://wolt.com/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "menu",
    name: "menu",
    aliases: [
      {
        alias: "メニュー",
        locale: "ja",
      },
    ],
    websiteUrl: "https://menu.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "starbucks",
    name: "星巴克",
    aliases: [
      {
        alias: "スターバックス",
        locale: "ja",
      },
      {
        alias: "Starbucks",
        locale: "en",
      },
      {
        alias: "スタバ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.starbucks.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "doutor",
    name: "罗多伦",
    aliases: [
      {
        alias: "ドトールコーヒー",
        locale: "ja",
      },
      {
        alias: "DOUTOR",
        locale: "en",
      },
      {
        alias: "ドトール",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.doutor.co.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "komeda",
    name: "客美多",
    aliases: [
      {
        alias: "コメダ珈琲店",
        locale: "ja",
      },
      {
        alias: "Komeda",
        locale: "en",
      },
      {
        alias: "コメダ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.komeda.co.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "tullys",
    name: "タリーズコーヒー",
    aliases: [
      {
        alias: "Tully's",
        locale: "en",
      },
      {
        alias: "タリーズ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.tullys.co.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "mister_donut",
    name: "美仕唐纳滋",
    aliases: [
      {
        alias: "ミスタードーナツ",
        locale: "ja",
      },
      {
        alias: "Mister Donut",
        locale: "en",
      },
      {
        alias: "ミスド",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.misterdonut.jp/",
    regions: ["jp"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "matsumoto_kiyoshi",
    name: "松本清",
    aliases: [
      {
        alias: "マツモトキヨシ",
        locale: "ja",
      },
      {
        alias: "マツキヨ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.matsukiyo.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "cocokara_fine",
    name: "ココカラファイン",
    aliases: [
      {
        alias: "ココカラ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.matsukiyococokara.com/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "welcia",
    name: "威尔洗",
    aliases: [
      {
        alias: "ウエルシア",
        locale: "ja",
      },
      {
        alias: "Welcia",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.welcia.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "tsuruha",
    name: "鹤羽药妆",
    aliases: [
      {
        alias: "ツルハドラッグ",
        locale: "ja",
      },
      {
        alias: "ツルハ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.tsuruha.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "sugi",
    name: "杉药局",
    aliases: [
      {
        alias: "スギ薬局",
        locale: "ja",
      },
      {
        alias: "スギ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.sugi-net.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "sundrug",
    name: "サンドラッグ",
    aliases: [
      {
        alias: "SUNDRUG",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.sundrug.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "cosmos",
    name: "ドラッグストアコスモス",
    aliases: [
      {
        alias: "コスモス",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.cosmospc.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "daiso",
    name: "大创",
    aliases: [
      {
        alias: "ダイソー",
        locale: "ja",
      },
      {
        alias: "DAISO",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.daiso-sangyo.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "seria",
    name: "セリア",
    aliases: [
      {
        alias: "Seria",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.seria-group.com/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "cando",
    name: "キャンドゥ",
    aliases: [
      {
        alias: "Can★Do",
        locale: "en",
      },
      {
        alias: "Can Do",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.cando-web.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "nitori",
    name: "宜得利",
    aliases: [
      {
        alias: "ニトリ",
        locale: "ja",
      },
      {
        alias: "NITORI",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.nitori.co.jp/",
    regions: ["jp", "cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "muji",
    name: "无印良品",
    aliases: [
      {
        alias: "無印良品",
        locale: "ja",
      },
      {
        alias: "MUJI",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.muji.com/jp/",
    regions: ["jp", "cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "don_quijote",
    name: "堂吉诃德",
    aliases: [
      {
        alias: "ドン・キホーテ",
        locale: "ja",
      },
      {
        alias: "ドンキ",
        locale: "ja",
      },
      {
        alias: "Don Quijote",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.donki.com/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "loft",
    name: "ロフト",
    aliases: [
      {
        alias: "LoFt",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.loft.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "hands",
    name: "东急手创",
    aliases: [
      {
        alias: "ハンズ",
        locale: "ja",
      },
      {
        alias: "東急ハンズ",
        locale: "ja",
      },
      {
        alias: "HANDS",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.hands.net/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "ikea",
    name: "宜家",
    aliases: [
      {
        alias: "IKEA",
        locale: "en",
      },
      {
        alias: "イケア",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.ikea.com/",
    regions: ["jp", "cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "uniqlo",
    name: "优衣库",
    aliases: [
      {
        alias: "ユニクロ",
        locale: "ja",
      },
      {
        alias: "UNIQLO",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.uniqlo.com/jp/",
    regions: ["jp", "cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "gu",
    name: "GU",
    aliases: [
      {
        alias: "ジーユー",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.gu-global.com/jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "shimamura",
    name: "岛村",
    aliases: [
      {
        alias: "しまむら",
        locale: "ja",
      },
      {
        alias: "Shimamura",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.shimamura.gr.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "workman",
    name: "ワークマン",
    aliases: [
      {
        alias: "WORKMAN",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.workman.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "zara",
    name: "ZARA",
    aliases: [
      {
        alias: "ザラ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.zara.com/jp/",
    regions: ["jp", "cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "nishimatsuya",
    name: "西松屋",
    aliases: [
      {
        alias: "Nishimatsuya",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.24028.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "hm",
    name: "H&M",
    aliases: [
      {
        alias: "エイチ・アンド・エム",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.hm.com/",
    regions: ["jp", "cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "yodobashi",
    name: "友都八喜",
    aliases: [
      {
        alias: "ヨドバシカメラ",
        locale: "ja",
      },
      {
        alias: "ヨドバシ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.yodobashi.com/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "bic_camera",
    name: "必酷",
    aliases: [
      {
        alias: "ビックカメラ",
        locale: "ja",
      },
      {
        alias: "ビック",
        locale: "ja",
      },
      {
        alias: "BicCamera",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.biccamera.com/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "yamada_denki",
    name: "山田电机",
    aliases: [
      {
        alias: "ヤマダデンキ",
        locale: "ja",
      },
      {
        alias: "ヤマダ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.yamada-denki.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "edion",
    name: "爱电王",
    aliases: [
      {
        alias: "エディオン",
        locale: "ja",
      },
      {
        alias: "EDION",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.edion.com/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "ks_denki",
    name: "ケーズデンキ",
    aliases: [
      {
        alias: "K's",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.ksdenki.com/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "apple",
    name: "苹果",
    aliases: [
      {
        alias: "Apple",
        locale: "en",
      },
      {
        alias: "アップル",
        locale: "ja",
      },
      {
        alias: "App Store",
        locale: "en",
      },
      {
        alias: "iCloud",
        locale: "en",
      },
      {
        alias: "Apple Music",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.apple.com/jp/",
    regions: ["jp", "cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "amazon",
    name: "亚马逊",
    aliases: [
      {
        alias: "Amazon",
        locale: "en",
      },
      {
        alias: "アマゾン",
        locale: "ja",
      },
      {
        alias: "Amazonプライム",
        locale: "ja",
      },
      {
        alias: "Prime Video",
        locale: "en",
      },
      {
        alias: "亚马逊Prime",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.amazon.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "rakuten",
    name: "乐天",
    aliases: [
      {
        alias: "楽天",
        locale: "ja",
      },
      {
        alias: "Rakuten",
        locale: "en",
      },
      {
        alias: "楽天市場",
        locale: "ja",
      },
      {
        alias: "楽天モバイル",
        locale: "ja",
      },
      {
        alias: "楽天トラベル",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.rakuten.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping", "living_expenses"],
    generic: false,
  },
  {
    key: "yahoo_shopping",
    name: "雅虎购物",
    aliases: [
      {
        alias: "Yahoo!ショッピング",
        locale: "ja",
      },
      {
        alias: "ヤフショ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://shopping.yahoo.co.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "mercari",
    name: "煤炉",
    aliases: [
      {
        alias: "メルカリ",
        locale: "ja",
      },
      {
        alias: "Mercari",
        locale: "en",
      },
    ],
    websiteUrl: "https://jp.mercari.com/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "zozotown",
    name: "ZOZOTOWN",
    aliases: [
      {
        alias: "ゾゾタウン",
        locale: "ja",
      },
      {
        alias: "ZOZO",
        locale: "en",
      },
    ],
    websiteUrl: "https://zozo.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "netflix",
    name: "网飞",
    aliases: [
      {
        alias: "Netflix",
        locale: "en",
      },
      {
        alias: "ネットフリックス",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.netflix.com/jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "spotify",
    name: "Spotify",
    aliases: [
      {
        alias: "スポティファイ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.spotify.com/jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "google",
    name: "谷歌",
    aliases: [
      {
        alias: "Google",
        locale: "en",
      },
      {
        alias: "YouTube Premium",
        locale: "en",
      },
      {
        alias: "YouTube",
        locale: "en",
      },
      {
        alias: "Google Play",
        locale: "en",
      },
      {
        alias: "Google One",
        locale: "en",
      },
      {
        alias: "油管会员",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.google.com/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "disney_plus",
    name: "Disney+",
    aliases: [
      {
        alias: "ディズニープラス",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.disneyplus.com/ja-jp",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "u_next",
    name: "U-NEXT",
    aliases: [
      {
        alias: "ユーネクスト",
        locale: "ja",
      },
    ],
    websiteUrl: "https://video.unext.jp/",
    regions: ["jp"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "jr",
    name: "JR",
    aliases: [
      {
        alias: "JR東日本",
        locale: "ja",
      },
      {
        alias: "JR東海",
        locale: "ja",
      },
      {
        alias: "JR西日本",
        locale: "ja",
      },
      {
        alias: "JR九州",
        locale: "ja",
      },
      {
        alias: "JR北海道",
        locale: "ja",
      },
      {
        alias: "JR四国",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.jreast.co.jp/",
    regions: ["jp"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "go_taxi",
    name: "打车",
    aliases: [
      {
        alias: "GO",
        locale: "en",
      },
      {
        alias: "GOタクシー",
        locale: "ja",
      },
    ],
    websiteUrl: "https://go.goinc.jp/",
    regions: ["jp"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "eneos",
    name: "加油站",
    aliases: [
      {
        alias: "ENEOS",
        locale: "en",
      },
      {
        alias: "エネオス",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.eneos.co.jp/",
    regions: ["jp"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "idemitsu",
    name: "出光",
    aliases: [
      {
        alias: "出光興産",
        locale: "ja",
      },
      {
        alias: "apollostation",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.idemitsu.com/jp/",
    regions: ["jp"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "docomo",
    name: "docomo",
    aliases: [
      {
        alias: "ドコモ",
        locale: "ja",
      },
      {
        alias: "NTTドコモ",
        locale: "ja",
      },
      {
        alias: "ahamo",
        locale: "en",
      },
      {
        alias: "アハモ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.docomo.ne.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "au",
    name: "au",
    aliases: [
      {
        alias: "エーユー",
        locale: "ja",
      },
      {
        alias: "KDDI",
        locale: "en",
      },
      {
        alias: "UQ mobile",
        locale: "en",
      },
      {
        alias: "UQモバイル",
        locale: "ja",
      },
      {
        alias: "povo",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.au.com/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "softbank",
    name: "软银",
    aliases: [
      {
        alias: "SoftBank",
        locale: "en",
      },
      {
        alias: "ソフトバンク",
        locale: "ja",
      },
      {
        alias: "Y!mobile",
        locale: "en",
      },
      {
        alias: "ワイモバイル",
        locale: "ja",
      },
      {
        alias: "LINEMO",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.softbank.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "tepco",
    name: "东京电力",
    aliases: [
      {
        alias: "東京電力",
        locale: "ja",
      },
      {
        alias: "TEPCO",
        locale: "en",
      },
      {
        alias: "東京電力エナジーパートナー",
        locale: "ja",
      },
      {
        alias: "電気代",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.tepco.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "kepco",
    name: "关西电力",
    aliases: [
      {
        alias: "関西電力",
        locale: "ja",
      },
      {
        alias: "KEPCO",
        locale: "en",
      },
      {
        alias: "関電",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.kepco.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "chuden",
    name: "中部电力",
    aliases: [
      {
        alias: "中部電力",
        locale: "ja",
      },
      {
        alias: "中部電力ミライズ",
        locale: "ja",
      },
      {
        alias: "中電",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.chuden.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "kyuden",
    name: "九州电力",
    aliases: [
      {
        alias: "九州電力",
        locale: "ja",
      },
      {
        alias: "九電",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.kyuden.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "tohoku_epco",
    name: "东北电力",
    aliases: [
      {
        alias: "東北電力",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.tohoku-epco.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "tokyo_gas",
    name: "东京燃气",
    aliases: [
      {
        alias: "東京ガス",
        locale: "ja",
      },
      {
        alias: "Tokyo Gas",
        locale: "en",
      },
      {
        alias: "ガス代",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.tokyo-gas.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "osaka_gas",
    name: "大阪燃气",
    aliases: [
      {
        alias: "大阪ガス",
        locale: "ja",
      },
      {
        alias: "Osaka Gas",
        locale: "en",
      },
      {
        alias: "大ガス",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.osakagas.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "toho_gas",
    name: "东邦燃气",
    aliases: [
      {
        alias: "東邦ガス",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.tohogas.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "water_bureau",
    name: "自来水",
    aliases: [
      {
        alias: "水道局",
        locale: "ja",
      },
      {
        alias: "水道代",
        locale: "ja",
      },
      {
        alias: "上下水道",
        locale: "ja",
      },
    ],
    websiteUrl: null,
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: true,
  },
  {
    key: "nhk",
    name: "日本放送协会",
    aliases: [
      {
        alias: "NHK",
        locale: "en",
      },
      {
        alias: "受信料",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.nhk.or.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "nippon_life",
    name: "日本生命",
    aliases: [
      {
        alias: "ニッセイ",
        locale: "ja",
      },
      {
        alias: "Nippon Life",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.nissay.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "dai_ichi_life",
    name: "第一生命",
    aliases: [
      {
        alias: "Dai-ichi Life",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.dai-ichi-life.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "sumitomo_life",
    name: "住友生命",
    aliases: [
      {
        alias: "スミセイ",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.sumitomolife.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "meiji_yasuda",
    name: "明治安田生命",
    aliases: [
      {
        alias: "Meiji Yasuda",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.meijiyasuda.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "tokio_marine",
    name: "東京海上日動",
    aliases: [
      {
        alias: "东京海上",
        locale: "zh",
      },
      {
        alias: "Tokio Marine",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.tokiomarine-nichido.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "sompo_japan",
    name: "損保ジャパン",
    aliases: [
      {
        alias: "损保日本",
        locale: "zh",
      },
      {
        alias: "Sompo",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.sompo-japan.co.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "mitsui_sumitomo_insurance",
    name: "三井住友海上",
    aliases: [
      {
        alias: "MS&AD",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.ms-ins.com/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "prefectural_mutual_aid",
    name: "都道府県民共済",
    aliases: [
      {
        alias: "県民共済",
        locale: "ja",
      },
      {
        alias: "都民共済",
        locale: "ja",
      },
      {
        alias: "府民共済",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.kyosai-cc.or.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "coop_insurance",
    name: "コープ共済",
    aliases: [
      {
        alias: "CO-OP共済",
        locale: "ja",
      },
      {
        alias: "生協の共済",
        locale: "ja",
      },
    ],
    websiteUrl: "https://coopkyosai.coop/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "ja_insurance",
    name: "JA共済",
    aliases: [
      {
        alias: "農協共済",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.ja-kyosai.or.jp/",
    regions: ["jp"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "property_management",
    name: "管理会社",
    aliases: [
      {
        alias: "家賃",
        locale: "ja",
      },
      {
        alias: "管理費",
        locale: "ja",
      },
      {
        alias: "大家",
        locale: "ja",
      },
      {
        alias: "房租",
        locale: "zh",
      },
      {
        alias: "物业",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["jp", "cn"],
    tagKeys: ["living_expenses"],
    generic: true,
  },
  {
    key: "hospital",
    name: "医院",
    aliases: [
      {
        alias: "病院",
        locale: "ja",
      },
      {
        alias: "クリニック",
        locale: "ja",
      },
      {
        alias: "診療所",
        locale: "ja",
      },
    ],
    websiteUrl: null,
    regions: ["jp", "cn"],
    tagKeys: ["public_service"],
    generic: true,
  },
  {
    key: "pharmacy",
    name: "药局",
    aliases: [
      {
        alias: "薬局",
        locale: "ja",
      },
      {
        alias: "調剤薬局",
        locale: "ja",
      },
    ],
    websiteUrl: null,
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: true,
  },
  {
    key: "school",
    name: "学校",
    aliases: [
      {
        alias: "学費",
        locale: "ja",
      },
      {
        alias: "给食费",
        locale: "zh",
      },
      {
        alias: "学费",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["jp", "cn"],
    tagKeys: ["public_service"],
    generic: true,
  },
  {
    key: "nursery",
    name: "保育園",
    aliases: [
      {
        alias: "保育园",
        locale: "zh",
      },
      {
        alias: "幼稚園",
        locale: "ja",
      },
      {
        alias: "幼儿园",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: true,
  },
  {
    key: "cram_school",
    name: "学習塾",
    aliases: [
      {
        alias: "塾",
        locale: "ja",
      },
      {
        alias: "补习班",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: true,
  },
  {
    key: "kumon",
    name: "公文式",
    aliases: [
      {
        alias: "KUMON",
        locale: "en",
      },
      {
        alias: "くもん",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.kumon.ne.jp/",
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: false,
  },
  {
    key: "city_office",
    name: "市政府",
    aliases: [
      {
        alias: "市区町村役所",
        locale: "ja",
      },
      {
        alias: "市役所",
        locale: "ja",
      },
      {
        alias: "区役所",
        locale: "ja",
      },
      {
        alias: "町役場",
        locale: "ja",
      },
      {
        alias: "住民税",
        locale: "ja",
      },
      {
        alias: "国民健康保険",
        locale: "ja",
      },
    ],
    websiteUrl: null,
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: true,
  },
  {
    key: "prefectural_tax_office",
    name: "府政府",
    aliases: [
      {
        alias: "都道府県税事務所",
        locale: "ja",
      },
      {
        alias: "県税事務所",
        locale: "ja",
      },
      {
        alias: "都税事務所",
        locale: "ja",
      },
      {
        alias: "自動車税",
        locale: "ja",
      },
      {
        alias: "县政府",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: true,
  },
  {
    key: "tax_office",
    name: "确定申报",
    aliases: [
      {
        alias: "税務署",
        locale: "ja",
      },
      {
        alias: "国税庁",
        locale: "ja",
      },
      {
        alias: "所得税",
        locale: "ja",
      },
      {
        alias: "確定申告",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.nta.go.jp/",
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: false,
  },
  {
    key: "japan_pension_service",
    name: "养老金",
    aliases: [
      {
        alias: "日本年金機構",
        locale: "ja",
      },
      {
        alias: "年金",
        locale: "ja",
      },
      {
        alias: "国民年金",
        locale: "ja",
      },
      {
        alias: "厚生年金",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.nenkin.go.jp/",
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: false,
  },
  {
    key: "immigration_services_agency",
    name: "出入国管理局",
    aliases: [
      {
        alias: "出入国在留管理庁",
        locale: "ja",
      },
      {
        alias: "入管",
        locale: "ja",
      },
      {
        alias: "入国管理局",
        locale: "ja",
      },
      {
        alias: "签证",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.moj.go.jp/isa/",
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: false,
  },
  {
    key: "post_office",
    name: "邮局",
    aliases: [
      {
        alias: "郵便局",
        locale: "ja",
      },
      {
        alias: "日本郵便",
        locale: "ja",
      },
      {
        alias: "Japan Post",
        locale: "en",
      },
      {
        alias: "ゆうパック",
        locale: "ja",
      },
    ],
    websiteUrl: "https://www.post.japanpost.jp/",
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: false,
  },
  {
    key: "hello_work",
    name: "ハローワーク",
    aliases: [
      {
        alias: "公共職業安定所",
        locale: "ja",
      },
      {
        alias: "劳动局",
        locale: "zh",
      },
      {
        alias: "Hello Work",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.hellowork.mhlw.go.jp/",
    regions: ["jp"],
    tagKeys: ["public_service"],
    generic: false,
  },
  {
    key: "hema",
    name: "盒马",
    aliases: [
      {
        alias: "盒马鲜生",
        locale: "zh",
      },
      {
        alias: "Freshippo",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.freshippo.com/",
    regions: ["cn"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "yonghui",
    name: "永辉超市",
    aliases: [
      {
        alias: "永辉",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.yonghui.com.cn/",
    regions: ["cn"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "walmart",
    name: "沃尔玛",
    aliases: [
      {
        alias: "Walmart",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.walmart.cn/",
    regions: ["cn"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "rt_mart",
    name: "大润发",
    aliases: [
      {
        alias: "RT-Mart",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.rt-mart.com.cn/",
    regions: ["cn"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "sams_club",
    name: "山姆会员店",
    aliases: [
      {
        alias: "Sam's Club",
        locale: "en",
      },
      {
        alias: "山姆",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.samsclub.cn/",
    regions: ["cn"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "wumart",
    name: "物美",
    aliases: [],
    websiteUrl: "https://www.wumart.com/",
    regions: ["cn"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "carrefour",
    name: "家乐福",
    aliases: [
      {
        alias: "Carrefour",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.carrefour.cn/",
    regions: ["cn"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "cr_vanguard",
    name: "华润万家",
    aliases: [],
    websiteUrl: "https://www.crv.com.cn/",
    regions: ["cn"],
    tagKeys: ["supermarket"],
    generic: false,
  },
  {
    key: "meiyijia",
    name: "美宜佳",
    aliases: [],
    websiteUrl: "https://www.meiyijia.com.cn/",
    regions: ["cn"],
    tagKeys: ["convenience_store"],
    generic: false,
  },
  {
    key: "bianlifeng",
    name: "便利蜂",
    aliases: [],
    websiteUrl: "https://www.bianlifeng.com/",
    regions: ["cn"],
    tagKeys: ["convenience_store"],
    generic: false,
  },
  {
    key: "easy_joy",
    name: "易捷",
    aliases: [
      {
        alias: "中石化易捷",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.ejoy365.com/",
    regions: ["cn"],
    tagKeys: ["convenience_store"],
    generic: false,
  },
  {
    key: "haidilao",
    name: "海底捞",
    aliases: [
      {
        alias: "Haidilao",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.haidilao.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "xibei",
    name: "西贝莜面村",
    aliases: [
      {
        alias: "西贝",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.xibei.com.cn/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "laoxiangji",
    name: "老乡鸡",
    aliases: [],
    websiteUrl: "https://www.lxjchina.com.cn/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "pizza_hut",
    name: "必胜客",
    aliases: [
      {
        alias: "Pizza Hut",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.pizzahut.com.cn/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "wallace",
    name: "华莱士",
    aliases: [],
    websiteUrl: "https://www.cnhls.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "kungfu",
    name: "真功夫",
    aliases: [],
    websiteUrl: "https://www.zkungfu.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "meituan_waimai",
    name: "美团外卖",
    aliases: [
      {
        alias: "美团",
        locale: "zh",
      },
      {
        alias: "Meituan",
        locale: "en",
      },
    ],
    websiteUrl: "https://waimai.meituan.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "eleme",
    name: "饿了么",
    aliases: [
      {
        alias: "Ele.me",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.ele.me/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "luckin",
    name: "瑞幸咖啡",
    aliases: [
      {
        alias: "瑞幸",
        locale: "zh",
      },
      {
        alias: "luckin coffee",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.lkcoffee.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "cotti",
    name: "库迪咖啡",
    aliases: [
      {
        alias: "库迪",
        locale: "zh",
      },
      {
        alias: "COTTI",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.cotti.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "heytea",
    name: "喜茶",
    aliases: [
      {
        alias: "HEYTEA",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.heytea.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "mixue",
    name: "蜜雪冰城",
    aliases: [
      {
        alias: "MIXUE",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.mxbc.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "chagee",
    name: "霸王茶姬",
    aliases: [
      {
        alias: "CHAGEE",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.chagee.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "nayuki",
    name: "奈雪的茶",
    aliases: [
      {
        alias: "奈雪",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.naixue.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "guming",
    name: "古茗",
    aliases: [],
    websiteUrl: "https://www.gumingnc.com/",
    regions: ["cn"],
    tagKeys: ["restaurant"],
    generic: false,
  },
  {
    key: "watsons",
    name: "屈臣氏",
    aliases: [
      {
        alias: "Watsons",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.watsons.com.cn/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "lbx_pharmacy",
    name: "老百姓大药房",
    aliases: [
      {
        alias: "老百姓",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.lbxdrugs.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "yifeng",
    name: "益丰大药房",
    aliases: [
      {
        alias: "益丰",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.yfdyf.cn/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "dashenlin",
    name: "大参林",
    aliases: [],
    websiteUrl: "https://www.dslyy.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "miniso",
    name: "名创优品",
    aliases: [
      {
        alias: "MINISO",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.miniso.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "anta",
    name: "安踏",
    aliases: [
      {
        alias: "ANTA",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.anta.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "li_ning",
    name: "李宁",
    aliases: [
      {
        alias: "Li-Ning",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.lining.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "hla",
    name: "海澜之家",
    aliases: [
      {
        alias: "HLA",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.hla.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "xiaomi",
    name: "小米",
    aliases: [
      {
        alias: "Xiaomi",
        locale: "en",
      },
      {
        alias: "Mi",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.mi.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "huawei",
    name: "华为",
    aliases: [
      {
        alias: "HUAWEI",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.huawei.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "suning",
    name: "苏宁易购",
    aliases: [
      {
        alias: "苏宁",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.suning.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "jd_electronics",
    name: "京东电器",
    aliases: [],
    websiteUrl: "https://www.jd.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "taobao",
    name: "淘宝",
    aliases: [
      {
        alias: "Taobao",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.taobao.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "tmall",
    name: "天猫",
    aliases: [
      {
        alias: "Tmall",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.tmall.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "jd",
    name: "京东",
    aliases: [
      {
        alias: "JD",
        locale: "en",
      },
      {
        alias: "京东商城",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.jd.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "pinduoduo",
    name: "拼多多",
    aliases: [
      {
        alias: "PDD",
        locale: "en",
      },
      {
        alias: "Temu",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.pinduoduo.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "douyin_mall",
    name: "抖音商城",
    aliases: [
      {
        alias: "抖音",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.douyin.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "xianyu",
    name: "闲鱼",
    aliases: [],
    websiteUrl: "https://www.goofish.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "vipshop",
    name: "唯品会",
    aliases: [
      {
        alias: "VIP",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.vip.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "iqiyi",
    name: "爱奇艺",
    aliases: [
      {
        alias: "iQIYI",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.iqiyi.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "tencent_video",
    name: "腾讯视频",
    aliases: [
      {
        alias: "WeTV",
        locale: "en",
      },
    ],
    websiteUrl: "https://v.qq.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "youku",
    name: "优酷",
    aliases: [
      {
        alias: "Youku",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.youku.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "bilibili",
    name: "哔哩哔哩",
    aliases: [
      {
        alias: "B站",
        locale: "zh",
      },
      {
        alias: "bilibili",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.bilibili.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "qq_music",
    name: "QQ音乐",
    aliases: [],
    websiteUrl: "https://y.qq.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "netease_music",
    name: "网易云音乐",
    aliases: [],
    websiteUrl: "https://music.163.com/",
    regions: ["cn"],
    tagKeys: ["shopping"],
    generic: false,
  },
  {
    key: "didi",
    name: "滴滴出行",
    aliases: [
      {
        alias: "滴滴",
        locale: "zh",
      },
      {
        alias: "DiDi",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.didiglobal.com/",
    regions: ["cn"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "amap_taxi",
    name: "高德打车",
    aliases: [
      {
        alias: "高德",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.amap.com/",
    regions: ["cn"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "railway_12306",
    name: "铁路12306",
    aliases: [
      {
        alias: "12306",
        locale: "en",
      },
      {
        alias: "中国铁路",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.12306.cn/",
    regions: ["cn"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "air_china",
    name: "中国国航",
    aliases: [
      {
        alias: "Air China",
        locale: "en",
      },
      {
        alias: "国航",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.airchina.com.cn/",
    regions: ["cn"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "china_eastern",
    name: "东方航空",
    aliases: [
      {
        alias: "东航",
        locale: "zh",
      },
      {
        alias: "China Eastern",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.ceair.com/",
    regions: ["cn"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "china_southern",
    name: "南方航空",
    aliases: [
      {
        alias: "南航",
        locale: "zh",
      },
      {
        alias: "China Southern",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.csair.com/",
    regions: ["cn"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "hello_bike",
    name: "哈啰",
    aliases: [
      {
        alias: "哈啰单车",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.hello-inc.com/",
    regions: ["cn"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "sinopec",
    name: "中国石化",
    aliases: [
      {
        alias: "中石化",
        locale: "zh",
      },
      {
        alias: "Sinopec",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.sinopec.com/",
    regions: ["cn"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "petrochina",
    name: "中国石油",
    aliases: [
      {
        alias: "中石油",
        locale: "zh",
      },
      {
        alias: "PetroChina",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.petrochina.com.cn/",
    regions: ["cn"],
    tagKeys: ["transport"],
    generic: false,
  },
  {
    key: "china_mobile",
    name: "中国移动",
    aliases: [
      {
        alias: "China Mobile",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.10086.cn/",
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "china_unicom",
    name: "中国联通",
    aliases: [
      {
        alias: "China Unicom",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.10010.com/",
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "china_telecom",
    name: "中国电信",
    aliases: [
      {
        alias: "China Telecom",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.189.cn/",
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "state_grid",
    name: "国家电网",
    aliases: [
      {
        alias: "电费",
        locale: "zh",
      },
      {
        alias: "State Grid",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.sgcc.com.cn/",
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "cn_water",
    name: "自来水公司",
    aliases: [
      {
        alias: "水费",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: true,
  },
  {
    key: "cn_gas",
    name: "燃气公司",
    aliases: [
      {
        alias: "燃气费",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: true,
  },
  {
    key: "china_life",
    name: "中国人寿",
    aliases: [
      {
        alias: "China Life",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.chinalife.com.cn/",
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "ping_an",
    name: "中国平安",
    aliases: [
      {
        alias: "平安保险",
        locale: "zh",
      },
      {
        alias: "Ping An",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.pingan.com/",
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "cpic",
    name: "太平洋保险",
    aliases: [
      {
        alias: "CPIC",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.cpic.com.cn/",
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "zhongan",
    name: "众安保险",
    aliases: [
      {
        alias: "众安",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.zhongan.com/",
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: false,
  },
  {
    key: "cn_property_management",
    name: "物业公司",
    aliases: [
      {
        alias: "物业费",
        locale: "zh",
      },
      {
        alias: "房东",
        locale: "zh",
      },
      {
        alias: "房租",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["cn"],
    tagKeys: ["living_expenses"],
    generic: true,
  },
  {
    key: "cn_pharmacy",
    name: "药房",
    aliases: [
      {
        alias: "调剂药房",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["cn"],
    tagKeys: ["public_service"],
    generic: true,
  },
  {
    key: "cn_nursery",
    name: "幼儿园",
    aliases: [
      {
        alias: "托儿所",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["cn"],
    tagKeys: ["public_service"],
    generic: true,
  },
  {
    key: "cn_training",
    name: "培训班",
    aliases: [
      {
        alias: "补习班",
        locale: "zh",
      },
      {
        alias: "兴趣班",
        locale: "zh",
      },
    ],
    websiteUrl: null,
    regions: ["cn"],
    tagKeys: ["public_service"],
    generic: true,
  },
  {
    key: "new_oriental",
    name: "新东方",
    aliases: [
      {
        alias: "New Oriental",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.neworiental.org/",
    regions: ["cn"],
    tagKeys: ["public_service"],
    generic: false,
  },
  {
    key: "tal",
    name: "学而思",
    aliases: [],
    websiteUrl: "https://www.xueersi.com/",
    regions: ["cn"],
    tagKeys: ["public_service"],
    generic: false,
  },
  {
    key: "cn_tax_office",
    name: "税务局",
    aliases: [
      {
        alias: "个税",
        locale: "zh",
      },
      {
        alias: "个人所得税",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.chinatax.gov.cn/",
    regions: ["cn"],
    tagKeys: ["public_service"],
    generic: false,
  },
  {
    key: "cn_social_security",
    name: "社保",
    aliases: [
      {
        alias: "社会保险",
        locale: "zh",
      },
      {
        alias: "医保",
        locale: "zh",
      },
      {
        alias: "公积金",
        locale: "zh",
      },
    ],
    websiteUrl: "https://www.12333.gov.cn/",
    regions: ["cn"],
    tagKeys: ["public_service"],
    generic: false,
  },
  {
    key: "china_post",
    name: "中国邮政",
    aliases: [
      {
        alias: "邮局",
        locale: "zh",
      },
      {
        alias: "China Post",
        locale: "en",
      },
    ],
    websiteUrl: "https://www.chinapost.com.cn/",
    regions: ["cn"],
    tagKeys: ["public_service"],
    generic: false,
  },
] as const satisfies readonly LedgerSetupMerchantTemplate[];
