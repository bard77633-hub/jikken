import { initGame, updateParams, setRestartCallback, resetGame } from './app.js';

// --- Helper Functions for generating math questions ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generator: Units (Bits/Bytes)
function generateUnitQuestions(count = 16) {
  const qs = [];
  for(let i=0; i<count; i++) {
    const type = randomInt(0, 3);
    if(type === 0) {
      const bits = [4, 8, 16, 32, 64][randomInt(0, 4)];
      qs.push({
        q: `${bits}ビットで表現できる情報の種類は何通り？`,
        options: [`${2**(bits-1)}通り`, `${2**bits}通り`, `${bits*2}通り`, `${bits**2}通り`],
        a: 1
      });
    } else if (type === 1) {
      const bytes = randomInt(1, 10);
      qs.push({
        q: `${bytes}バイトは何ビット？`,
        options: [`${bytes*4}ビット`, `${bytes*8}ビット`, `${bytes*16}ビット`, `${bytes+8}ビット`],
        a: 1
      });
    } else if (type === 2) {
      const kb = randomInt(1, 5);
      // Simplify 1KB = 1000 or 1024 context usually depends, but let's stick to standard 1024 bytes for Info I
      qs.push({
        q: `${kb}KB (キロバイト) は何バイト？ (1KB=1024Bとする)`,
        options: [`${kb*1000}`, `${kb*1024}`, `${kb*8}`, `${kb*100}`],
        a: 1
      });
    } else {
       const colors = [1, 4, 8, 16, 24];
       const c = colors[randomInt(0,4)];
       qs.push({
         q: `${c}ビットカラーで表現できる色数は？`,
         options: [`${2**c}`, `${c*2}`, `${c*c}`, `無限`],
         a: 0
       });
    }
  }
  return qs;
}

// Generator: Base Conversion
function generateBaseConvQuestions(count = 16) {
  const qs = [];
  for(let i=0; i<count; i++) {
    const type = randomInt(0, 2);
    if(type === 0) { // Bin -> Dec
      const val = randomInt(3, 31);
      const bin = val.toString(2);
      qs.push({
        q: `2進数「${bin}」を10進数に変換すると？`,
        options: [(val-1).toString(), val.toString(), (val+1).toString(), (val+2).toString()],
        a: 1
      });
    } else if (type === 1) { // Dec -> Bin
      const val = randomInt(3, 31);
      const bin = val.toString(2);
      const fake1 = (val+1).toString(2);
      const fake2 = (val-1).toString(2);
      const fake3 = (val+2).toString(2);
      qs.push({
        q: `10進数「${val}」を2進数に変換すると？`,
        options: [fake2, bin, fake1, fake3],
        a: 1
      });
    } else { // Hex -> Dec
      const val = randomInt(10, 255);
      const hex = val.toString(16).toUpperCase();
      qs.push({
        q: `16進数「${hex}」を10進数で表すと？`,
        options: [(val-1).toString(), val.toString(), (val+10).toString(), (val*2).toString()],
        a: 1
      });
    }
  }
  return qs;
}

// Generator: Calculation
function generateCalcQuestions(count = 16) {
  const qs = [];
  for(let i=0; i<count; i++) {
    const a = randomInt(1, 7);
    const b = randomInt(1, 7);
    const sum = a + b;
    const aBin = a.toString(2).padStart(4,'0');
    const bBin = b.toString(2).padStart(4,'0');
    const sumBin = sum.toString(2).padStart(4,'0');
    
    // Create wrong answers
    const w1 = (sum+1).toString(2).padStart(4,'0');
    const w2 = (sum-1).toString(2).padStart(4,'0');
    const w3 = (sum+2).toString(2).padStart(4,'0');
    
    qs.push({
      q: `2進数の計算： ${aBin} + ${bBin} = ?`,
      options: [w2, sumBin, w1, w3],
      a: 1
    });
  }
  return qs;
}

// Generator: Logic Gates
function generateLogicQuestions(count = 16) {
  const qs = [];
  const gates = ['AND', 'OR', 'XOR', 'NAND'];
  for(let i=0; i<count; i++) {
    const gate = gates[randomInt(0, 3)];
    const a = randomInt(0, 1);
    const b = randomInt(0, 1);
    let ans = 0;
    if(gate === 'AND') ans = a & b;
    if(gate === 'OR') ans = a | b;
    if(gate === 'XOR') ans = a ^ b;
    if(gate === 'NAND') ans = (a & b) ? 0 : 1;
    
    qs.push({
      q: `論理回路：入力A=${a}, 入力B=${b} のとき、${gate}回路の出力は？`,
      options: ["0", "1", "不定", "Z"],
      a: ans === 0 ? 0 : 1
    });
  }
  return qs;
}


// --- Quiz Data Structure: 12 Genres based on "Info I" Curriculum ---
const genres = [
  {
    id: 'info_unit',
    title: '情報の単位と量',
    icon: '📏',
    description: 'ビット、バイト、情報量の計算',
    questions: [
      { q: "「1ビット」で表現できる情報の種類は何通り？", options: ["1通り", "2通り", "4通り", "8通り"], a: 1 },
      { q: "「1バイト」は何ビット？", options: ["4ビット", "8ビット", "16ビット", "32ビット"], a: 1 },
      { q: "1バイトで表現できる情報量は2の8乗で何通り？", options: ["128", "255", "256", "512"], a: 2 },
      { q: "nビットで表現できる情報の種類は？", options: ["2 × n", "nの2乗", "2のn乗", "n + 2"], a: 2 }
    ]
  },
  {
    id: 'base_conv',
    title: '基数変換',
    icon: '🔢',
    description: '2進数、10進数、16進数の変換',
    questions: [
      { q: "2進数の「1010」を10進数にすると？", options: ["8", "10", "12", "14"], a: 1 },
      { q: "10進数の「5」を2進数にすると？", options: ["100", "101", "110", "111"], a: 1 },
      { q: "16進数で「10」から「15」を表すのに使う文字は？", options: ["G〜L", "A〜F", "X〜Z", "α〜ω"], a: 1 },
      { q: "2進数「1111」は16進数でいくつ？", options: ["A", "C", "E", "F"], a: 3 }
    ]
  },
  {
    id: 'calc_comp',
    title: '数値の計算と補数',
    icon: '➕',
    description: '2進数の加減算、負の数の表現',
    questions: [
      { q: "コンピュータで「負の数」を表現する際によく使われる考え方は？", options: ["逆数", "補数", "虚数", "対数"], a: 1 },
      { q: "2進数の「0101 + 1001」の計算結果は？", options: ["1100", "1110", "1000", "1111"], a: 1 },
      { q: "2の補数を求める手順：ビットを反転させた後、どうする？", options: ["1を引く", "1を足す", "そのまま", "2倍する"], a: 1 },
      { q: "桁あふれ（オーバーフロー）とは何？", options: ["計算結果が桁数を超える", "計算が速すぎること", "ゼロで割ること", "電源が落ちること"], a: 0 }
    ]
  },
  {
    id: 'text_enc',
    title: '文字のデジタル表現',
    icon: '🔤',
    description: '文字コード、フォント',
    questions: [
      { q: "英数字や記号を扱う最も基本的な文字コードは？", options: ["Shift_JIS", "ASCII", "EUC-JP", "Unicode"], a: 1 },
      { q: "世界中の文字を統一して扱うための文字コードは？", options: ["ASCII", "Unicode (UTF-8等)", "JISコード", "EBCDIC"], a: 1 },
      { q: "文字の形状（デザイン）データのことを何と呼ぶ？", options: ["グリフ", "グラフ", "ビット", "ピクセル"], a: 0 },
      { q: "拡大してもギザギザにならないフォント形式は？", options: ["ビットマップフォント", "アウトラインフォント", "ドットフォント", "ラスターフォント"], a: 1 },
      { q: "日本語の文字コードとしてWindowsで標準的に使われてきたのは？", options: ["Shift_JIS", "EUC-JP", "ISO-2022-JP", "UTF-8"], a: 0 },
      { q: "Unicodeの符号化方式の一つで、Webで最も普及しているのは？", options: ["UTF-8", "UTF-16", "UTF-32", "Shift_JIS"], a: 0 },
      { q: "文字化けの原因として最も可能性が高いのは？", options: ["文字コードの不一致", "フォントサイズの違い", "画面の明るさ", "OSの種類"], a: 0 },
      { q: "「A」のASCIIコードは0x41。「B」のASCIIコードは？", options: ["0x40", "0x42", "0x43", "0x50"], a: 1 },
      { q: "アウトラインフォントは画像をどう記録している？", options: ["点の集まり", "輪郭線の座標計算式", "色の濃淡", "圧縮データ"], a: 1 },
      { q: "「改行」などの制御文字も文字コードに含まれる？", options: ["含まれる", "含まれない", "OSによる", "アプリによる"], a: 0 }
    ]
  },
  {
    id: 'sound_digi',
    title: '音のデジタル表現',
    icon: '🎵',
    description: '標本化、量子化、符号化',
    questions: [
      { q: "アナログ波形をデジタル化する3ステップの正しい順序は？", options: ["標本化→量子化→符号化", "量子化→標本化→符号化", "符号化→標本化→量子化", "標本化→符号化→量子化"], a: 0 },
      { q: "1秒間に波の高さを測定する回数（サンプリング周波数）の単位は？", options: ["dpi", "bps", "Hz", "fps"], a: 2 },
      { q: "電圧（波の高さ）を段階的な数値に変換することを何という？", options: ["標本化", "量子化", "符号化", "暗号化"], a: 1 },
      { q: "CDの音質など、音を圧縮せずに記録する方式は？", options: ["PCM方式", "MP3方式", "AAC方式", "MIDI方式"], a: 0 },
      { q: "ハイレゾ音源の特徴は？", options: ["CDよりサンプリング周波数が低い", "CDより情報量が多い", "モノラルである", "アナログレコードと同じ"], a: 1 },
      { q: "量子化ビット数を増やすとどうなる？", options: ["音の大小の段階が細かくなる", "音が高くなる", "再生速度が速くなる", "ノイズが増える"], a: 0 },
      { q: "人の可聴域（聞こえる周波数）はおよそ？", options: ["20Hz〜20kHz", "1Hz〜100Hz", "100kHz以上", "0Hz〜10kHz"], a: 0 },
      { q: "MP3などの非可逆圧縮でカットされるデータは？", options: ["人間が聞き取りにくい部分", "一番大きい音", "一番低い音", "ランダムな部分"], a: 0 },
      { q: "「MIDI」データが記録しているのは？", options: ["波形の音そのもの", "演奏情報（音程や長さ）", "歌詞", "ジャケット画像"], a: 1 },
      { q: "音の3要素は「大きさ」「高さ」とあと一つは？", options: ["音色", "速さ", "距離", "温度"], a: 0 }
    ]
  },
  {
    id: 'image_digi',
    title: '画像のデジタル表現',
    icon: '🖼️',
    description: '画素、三原色、ラスタ/ベクタ',
    questions: [
      { q: "ディスプレイなどで使われる「光の三原色」は？", options: ["CMY", "RGB", "HSV", "YUV"], a: 1 },
      { q: "光の三原色をすべて混ぜると何色になる？", options: ["黒", "白", "紫", "茶"], a: 1 },
      { q: "画像を点の集まり（画素）で表現する形式は？", options: ["ベクタ形式", "ラスタ形式", "数式形式", "パス形式"], a: 1 },
      { q: "画像の細かさを表す「解像度」の単位でよく使われるのは？", options: ["dpi", "Hz", "bps", "rpm"], a: 0 },
      { q: "印刷インクで使われる「色の三原色」は？", options: ["CMY", "RGB", "RYB", "BkWH"], a: 0 },
      { q: "1画素を24ビット（RGB各8ビット）で表現する場合、表現できる色数は？", options: ["約256色", "約65000色", "約1677万色", "無限"], a: 2 },
      { q: "画像を拡大するとぼやけたりギザギザになるのは？", options: ["ラスタ画像", "ベクタ画像", "アウトラインフォント", "SVG"], a: 0 },
      { q: "透明度を表すチャンネル（アルファチャンネル）を持つ画像形式は？", options: ["JPEG", "PNG", "BMP", "GIF(透過色のみ)"], a: 1 },
      { q: "CMY（シアン・マゼンタ・イエロー）を混ぜると何色に近づく？", options: ["白", "黒", "赤", "青"], a: 1 },
      { q: "1インチあたりのドット数を表すdpiは何の略？", options: ["dots per inch", "data per image", "digital pixel index", "display per inch"], a: 0 }
    ]
  },
  {
    id: 'video_digi',
    title: '動画のデジタル表現',
    icon: '🎬',
    description: 'フレームレート、データ量',
    questions: [
      { q: "動画が動いて見える原理は目の何を利用している？", options: ["錯覚現象", "残像現象", "焦点調節", "明暗順応"], a: 1 },
      { q: "1秒間に表示される画像の枚数を表す単位は？", options: ["dpi", "Hz", "fps", "bps"], a: 2 },
      { q: "30fpsの動画で、1分間に表示される静止画は何枚？", options: ["300枚", "600枚", "1800枚", "3600枚"], a: 2 },
      { q: "一般的に、動画のデータ量は静止画に比べてどうなる？", options: ["非常に小さい", "変わらない", "非常に大きい", "半減する"], a: 2 },
      { q: "動画データの入れ物（コンテナ）を表す拡張子は？", options: [".mp4", ".jpg", ".txt", ".html"], a: 0 },
      { q: "動画圧縮の基準となるフレーム（完全な画像）を何という？", options: ["キーフレーム", "サブフレーム", "デルタフレーム", "ヌルフレーム"], a: 0 },
      { q: "インターネットでの動画配信に適した技術は？", options: ["ストリーミング", "ダウンロードのみ", "フロッピーディスク", "FAX"], a: 0 },
      { q: "4K解像度はおよそどのくらい？", options: ["1920x1080", "3840x2160", "720x480", "800x600"], a: 1 },
      { q: "フレーム間の差分だけを記録する圧縮方式を何という？", options: ["フレーム間圧縮", "空間圧縮", "可逆圧縮", "ZIP圧縮"], a: 0 },
      { q: "アスペクト比「16:9」はどのような形状？", options: ["正方形", "横長（ワイド）", "縦長", "円形"], a: 1 }
    ]
  },
  {
    id: 'compression',
    title: 'データの圧縮',
    icon: '📦',
    description: '可逆圧縮、非可逆圧縮',
    questions: [
      { q: "圧縮したデータを元に戻したとき、完全に元の状態に戻る方式は？", options: ["可逆圧縮", "非可逆圧縮", "不可逆圧縮", "高圧縮"], a: 0 },
      { q: "JPEG形式の画像やMP3形式の音声は、一般的にどの圧縮方式？", options: ["可逆圧縮", "非可逆圧縮", "ZIP圧縮", "LZH圧縮"], a: 1 },
      { q: "「白白白黒黒」を「白3黒2」のように記録する圧縮方法は？", options: ["ハフマン符号化", "ランレングス圧縮", "辞書圧縮", "差分圧縮"], a: 1 },
      { q: "非可逆圧縮のメリットは？", options: ["画質が良くなる", "圧縮率を高くできる", "元に戻せる", "計算が不要"], a: 1 },
      { q: "出現頻度の高いデータに短いビット列を割り当てる手法は？", options: ["ハフマン符号化", "ランレングス法", "MP3", "JPEG"], a: 0 },
      { q: "ZIPファイルはどの圧縮方式？", options: ["可逆圧縮", "非可逆圧縮", "音声圧縮", "動画圧縮"], a: 0 },
      { q: "圧縮したデータを元に戻すことを何という？", options: ["解凍（伸張/展開）", "冷凍", "再圧縮", "インストール"], a: 0 },
      { q: "次のうち、可逆圧縮の画像形式は？", options: ["JPEG", "PNG", "MPEG", "HEIC(設定による)"], a: 1 },
      { q: "辞書圧縮法で利用するのは？", options: ["データの繰り返しパターン", "色の平均値", "音の高さ", "ファイル名"], a: 0 },
      { q: "データ量が半分になった場合、圧縮率は？", options: ["200%", "50%", "100%", "0%"], a: 1 }
    ]
  },
  {
    id: 'hardware',
    title: 'コンピュータの構成',
    icon: '🖥️',
    description: '5大装置、CPU、メモリ',
    questions: [
      { q: "コンピュータの「頭脳」にあたり、演算と制御を行う装置は？", options: ["HDD", "メモリ", "CPU", "マウス"], a: 2 },
      { q: "電源を切るとデータが消えてしまう主記憶装置（メモリ）は？", options: ["RAM", "ROM", "SSD", "DVD"], a: 0 },
      { q: "5大装置に含まれないものは？", options: ["入力装置", "出力装置", "通信装置", "記憶装置"], a: 2 },
      { q: "CPUの処理速度に関係する、動作のタイミングを合わせる信号は？", options: ["クロック信号", "デジタル信号", "アナログ信号", "Wi-Fi信号"], a: 0 },
      { q: "CPUと主記憶装置の速度差を埋めるための高速なメモリは？", options: ["キャッシュメモリ", "USBメモリ", "仮想メモリ", "フラッシュメモリ"], a: 0 },
      { q: "GPUが特に得意とする処理は？", options: ["OSの起動", "画像・映像の処理", "文書作成", "印刷"], a: 1 },
      { q: "SSDの特徴として正しいものは？", options: ["HDDより遅い", "衝撃に強い・高速", "磁気ディスクを使う", "容量が無限"], a: 1 },
      { q: "BIOS/UEFIが保存されているメモリは？", options: ["RAM", "ROM (フラッシュROM)", "HDD", "Cache"], a: 1 },
      { q: "周辺機器を接続する規格「USB」は何の略？", options: ["Universal Serial Bus", "Ultra Speed Board", "United System Base", "User Service Box"], a: 0 },
      { q: "主記憶装置の容量が足りない時にHDDなどを借りて使う仕組みは？", options: ["仮想メモリ", "キャッシュメモリ", "クラウド", "バックアップ"], a: 0 }
    ]
  },
  {
    id: 'software',
    title: 'ソフトウェアとOS',
    icon: '💿',
    description: 'OSの役割、GUI、ファイル',
    questions: [
      { q: "ハードウェアとアプリの間で管理を行う「基本ソフトウェア」は？", options: ["OS", "Webブラウザ", "表計算ソフト", "ドライバ"], a: 0 },
      { q: "マウスやアイコンを使って直感的に操作できる画面環境を何という？", options: ["CUI", "GUI", "API", "SNS"], a: 1 },
      { q: "ファイルを階層的に整理するための入れ物を何という？", options: ["ファイル", "ドライブ", "フォルダ（ディレクトリ）", "クラウド"], a: 2 },
      { q: "ファイル名の末尾につき、ファイルの種類を表す文字列（例 .jpg）は？", options: ["ドメイン", "プロトコル", "拡張子", "パス"], a: 2 },
      { q: "オープンソースのOSの代表例は？", options: ["Linux", "Windows", "macOS", "Excel"], a: 0 },
      { q: "新しいハードウェアを接続した時に必要な制御ソフトは？", options: ["デバイスドライバ", "デバイスマネージャ", "デバイスアプリ", "デバイスOS"], a: 0 },
      { q: "複数のタスクを同時に実行しているように見せる機能は？", options: ["マルチタスク", "シングルタスク", "マルチコア", "ハイパースレッド"], a: 0 },
      { q: "アプリ同士でデータをやり取りするためのコピー領域は？", options: ["クリップボード", "デスクトップ", "ごみ箱", "タスクバー"], a: 0 },
      { q: "OSが提供する機能を利用するためのプログラム部品群は？", options: ["API", "GUI", "CUI", "URL"], a: 0 },
      { q: "バックアップの目的は？", options: ["容量を増やす", "データの消失に備える", "動作を速くする", "電気代を節約する"], a: 1 }
    ]
  },
  {
    id: 'logic_circuit',
    title: '論理回路',
    icon: '🔌',
    description: 'AND, OR, NOT, 真理値表',
    questions: [
      { q: "2つの入力が「ともに1」のときだけ1を出力する回路は？", options: ["OR回路", "NOT回路", "AND回路", "NAND回路"], a: 2 },
      { q: "入力の「どちらか一方でも1」なら1を出力する回路は？", options: ["OR回路", "NOT回路", "AND回路", "NOR回路"], a: 0 },
      { q: "入力信号を反転させる（0なら1、1なら0にする）回路は？", options: ["OR回路", "NOT回路", "AND回路", "XOR回路"], a: 1 },
      { q: "1桁の2進数の足し算を行う回路を何という？", options: ["半加算器", "全加算器", "倍率器", "整流器"], a: 0 }
      // Dynamic logic questions added on init
    ]
  },
  {
    id: 'algorithm',
    title: 'アルゴリズム',
    icon: '🧩',
    description: '処理手順、フローチャート',
    questions: [
      { q: "問題を解決するための手順や計算方法を定式化したものは？", options: ["アルゴリズム", "プログラム", "パラダイム", "メカニズム"], a: 0 },
      { q: "アルゴリズムの基本構造3つに含まれないものは？", options: ["順次（順接）", "選択（分岐）", "反復（繰り返し）", "乱数（ランダム）"], a: 3 },
      { q: "処理の流れを図形で表したものを何という？", options: ["グラフ", "フローチャート", "マインドマップ", "ヒストグラム"], a: 1 },
      { q: "フローチャートで「判断（分岐）」を表す記号の形は？", options: ["長方形", "楕円", "ひし形", "平行四辺形"], a: 2 },
      { q: "データの探索で、先頭から順に探す方法は？", options: ["線形探索", "二分探索", "ハッシュ探索", "深さ優先探索"], a: 0 },
      { q: "データが整列されている時に使える高速な探索法は？", options: ["二分探索", "線形探索", "全探索", "ランダム探索"], a: 0 },
      { q: "フローチャートで「処理」を表す記号の形は？", options: ["長方形", "円", "ひし形", "平行四辺形"], a: 0 },
      { q: "「交換」「選択」「挿入」などが代表的なアルゴリズムの種類は？", options: ["整列（ソート）", "探索（サーチ）", "圧縮", "暗号化"], a: 0 },
      { q: "バグを取り除く作業を何という？", options: ["デバッグ", "コンパイル", "コーディング", "リンク"], a: 0 },
      { q: "プログラムのソースコードを機械語に変換するソフトは？", options: ["コンパイラ", "エディタ", "デバッガ", "OS"], a: 0 }
    ]
  }
];

// Special Comprehensive Genre Definition
const comprehensiveGenre = {
  id: 'comprehensive',
  title: '総合演習 (全範囲)',
  icon: '🎓',
  description: '全ジャンルから出題。問題数40問。獲得ステータスは半分(切り上げ)。',
  questions: [] // Populated dynamically
};


// --- State ---
let currentGenre = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let bonuses = { power: 10, loft: 20, wind: 0 };
let isQuestionsExpanded = false;

// --- DOM Elements ---
let els = {};

function init() {
  els = {
    menuContainer: document.getElementById('menu-container'),
    quizContainer: document.getElementById('quiz-container'),
    gameContainer: document.getElementById('game-container'),
    genreGrid: document.getElementById('genre-grid'),
    btnReset: document.getElementById('btn-reset'),
    btnTheme: document.getElementById('btn-theme'),
    valGlobalBest: document.getElementById('val-global-best')
  };

  if (!els.menuContainer || !els.genreGrid) {
    console.error("Initialization failed: Missing DOM elements.");
    return;
  }
  
  // Setup Theme
  initTheme();
  
  // Setup Controls
  if(els.btnReset) els.btnReset.onclick = resetProgress;
  if(els.btnTheme) els.btnTheme.onclick = toggleTheme;

  // Initialize game engine
  try {
    initGame();
  } catch(e) {
    console.warn("Game init error:", e);
  }

  // Setup restart callback from app.js
  setRestartCallback(returnToMenu);

  // Expand questions just once
  if (!isQuestionsExpanded) {
    expandQuestions();
    isQuestionsExpanded = true;
  }

  // Load stats and render menu
  renderMenu();
}

function expandQuestions() {
  // Add dynamic questions to Math/Logic genres
  const unitQ = genres.find(g => g.id === 'info_unit');
  if(unitQ) unitQ.questions.push(...generateUnitQuestions(16));
  
  const baseQ = genres.find(g => g.id === 'base_conv');
  if(baseQ) baseQ.questions.push(...generateBaseConvQuestions(16));
  
  const calcQ = genres.find(g => g.id === 'calc_comp');
  if(calcQ) calcQ.questions.push(...generateCalcQuestions(16));
  
  const logicQ = genres.find(g => g.id === 'logic_circuit');
  if(logicQ) logicQ.questions.push(...generateLogicQuestions(16));
}

// --- Menu Logic ---
function getStats(genreId) {
  const key = `golf_stats_${genreId}`;
  const json = localStorage.getItem(key);
  return json ? JSON.parse(json) : { maxCorrect: 0, maxDistance: 0 };
}

function updateGlobalStats() {
  let maxShot = 0;
  // Check standard genres
  genres.forEach(g => {
    const s = getStats(g.id);
    if (s.maxDistance > maxShot) maxShot = s.maxDistance;
  });
  // Check comprehensive
  const cs = getStats('comprehensive');
  if(cs.maxDistance > maxShot) maxShot = cs.maxDistance;

  if (els.valGlobalBest) {
    els.valGlobalBest.textContent = maxShot.toFixed(1);
  }
}

function resetProgress() {
  if(!confirm("すべての成績と記録をリセットしますか？\nAre you sure you want to reset all progress?")) return;
  
  genres.forEach(g => {
    localStorage.removeItem(`golf_stats_${g.id}`);
  });
  localStorage.removeItem(`golf_stats_comprehensive`);
  renderMenu();
}

// --- Theme Logic ---
function initTheme() {
  const stored = localStorage.getItem('app_theme');
  const html = document.documentElement;
  // Default to dark if not set
  if (stored === 'light') {
    html.classList.remove('dark');
    updateThemeIcon(false);
  } else {
    html.classList.add('dark');
    updateThemeIcon(true);
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('app_theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  if(els.btnTheme) els.btnTheme.textContent = isDark ? '☀️' : '🌙';
  
  // Update Game Sky decoration
  const deco = document.getElementById('sky-deco');
  if(deco) {
    deco.textContent = isDark ? '🌕' : '☀️';
  }
}

function renderMenu() {
  els.menuContainer.classList.remove('hidden');
  els.quizContainer.classList.add('hidden');
  els.gameContainer.classList.add('blur-md');
  
  els.gameContainer.style.zIndex = '0';
  els.menuContainer.style.zIndex = '50';
  
  updateGlobalStats();
  
  els.genreGrid.innerHTML = '';

  // Render Standard Genres
  genres.forEach(genre => renderGenreCard(genre));

  // Render Comprehensive Card
  renderGenreCard(comprehensiveGenre, true);
}

function renderGenreCard(genre, isComprehensive = false) {
  const stats = getStats(genre.id);
  const totalQ = isComprehensive ? 40 : genre.questions.length; // Approximate/Target for comprehensive
  
  const card = document.createElement('div');
  const borderClass = isComprehensive ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-700';
  const hoverClass = isComprehensive ? 'hover:border-amber-500 hover:shadow-amber-500/20' : 'hover:border-emerald-500 hover:shadow-emerald-500/20';
  
  card.className = `bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg ${borderClass} ${hoverClass} hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between h-full`;
  card.onclick = () => startQuiz(genre);

  card.innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-4">
        <span class="text-3xl bg-slate-100 dark:bg-slate-700 p-3 rounded-xl group-hover:scale-110 transition-transform">${genre.icon}</span>
        <div class="text-right">
           <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cleared</div>
           <div class="font-bold text-emerald-600 dark:text-emerald-400 text-xl leading-none">${stats.maxCorrect} <span class="text-slate-400 dark:text-slate-500 text-xs">/ ${totalQ}</span></div>
        </div>
      </div>
      <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 leading-tight ${isComprehensive ? 'text-amber-600 dark:text-amber-500' : 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400'} transition-colors">${genre.title}</h3>
      <p class="text-slate-500 dark:text-slate-400 text-xs mb-4 line-clamp-2">${genre.description}</p>
    </div>
    
    <div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 flex justify-between items-center mt-auto border border-slate-100 dark:border-slate-800">
      <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Best Record</span>
      <span class="font-mono font-bold text-amber-500 dark:text-amber-400 text-md">${stats.maxDistance.toFixed(1)}m</span>
    </div>
  `;
  els.genreGrid.appendChild(card);
}

function returnToMenu() {
  document.getElementById('msg-finished').classList.add('hidden');
  renderMenu();
}

// --- Quiz Logic ---

function startQuiz(genre) {
  currentGenre = genre;
  
  if (genre.id === 'comprehensive') {
    // Collect questions from ALL genres
    let allQuestions = [];
    genres.forEach(g => {
        allQuestions.push(...g.questions);
    });
    // Shuffle and pick 40
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, 40);
  } else {
    // Normal Genre: Shuffle and take up to 20
    const shuffled = [...genre.questions].sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, 20);
  }
  
  currentQuestionIndex = 0;
  score = 0;
  bonuses = { power: 10, loft: 20, wind: 0 }; 

  els.menuContainer.classList.add('hidden');
  els.quizContainer.classList.remove('hidden');
  
  renderQuizStructure();
  renderQuestion();
}

function renderQuizStructure() {
  const isComp = currentGenre.id === 'comprehensive';
  const headerGradient = isComp ? 'from-amber-500 to-orange-500' : 'from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700';

  els.quizContainer.innerHTML = `
    <div class="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-600 overflow-hidden fade-in mx-4">
      <div class="bg-gradient-to-r ${headerGradient} p-6 text-white text-center shadow-md relative">
        <button id="btn-quit-quiz" class="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white font-bold text-sm bg-black/20 px-3 py-1 rounded-full hover:bg-black/30 transition">✕ MENU</button>
        <h1 class="text-xl font-bold tracking-tight mb-1">${currentGenre.title}</h1>
        <p class="text-white/80 text-xs font-medium uppercase tracking-widest">Question <span id="q-idx">1</span> / ${currentQuestions.length}</p>
      </div>
      <div class="p-6 md:p-8">
        <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-8">
          <div id="quiz-progress" class="${isComp ? 'bg-amber-500' : 'bg-emerald-500'} h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
        </div>
        <div id="question-area">
          <h2 id="question-text" class="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-8 text-center min-h-[3rem] flex items-center justify-center"></h2>
          <div id="options-grid" class="grid grid-cols-1 gap-3 mb-6"></div>
        </div>
        <div id="feedback-area" class="hidden text-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p id="feedback-text" class="text-lg font-bold mb-4"></p>
          <button id="btn-next-question" class="w-full md:w-auto px-10 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-lg border border-transparent dark:border-slate-600">Next</button>
        </div>
        <div id="result-area" class="hidden text-center space-y-6">
          <div class="text-5xl mb-4 animate-bounce">🎊</div>
          <h2 class="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Stage Clear!</h2>
          <p class="text-slate-500 dark:text-slate-400">Score: <span class="font-bold ${isComp ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'} text-2xl">${score}</span> / ${currentQuestions.length}</p>
          
          <div class="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl text-left text-sm text-slate-600 dark:text-slate-300 space-y-3 border border-slate-200 dark:border-slate-700 shadow-inner">
            <p class="font-bold text-center mb-4 text-base ${isComp ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}">Item Get!</p>
            <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span>⚡ Power Module</span> <span id="bonus-power" class="font-bold text-lg text-emerald-600 dark:text-emerald-400">+0</span>
            </div>
            <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span>📐 Angle Gear</span> <span id="bonus-loft" class="font-bold text-lg text-emerald-600 dark:text-emerald-400">+0°</span>
            </div>
            <div class="flex justify-between items-center">
              <span>💨 Assist Fan</span> <span id="bonus-wind" class="font-bold text-lg text-emerald-600 dark:text-emerald-400">+0</span>
            </div>
          </div>

          <button id="btn-start-game" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-600 dark:to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg hover:translate-y-[-2px] transition-all border border-emerald-500/50">
            PLAY BONUS GAME 🤖
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('btn-next-question').onclick = nextQuestion;
  document.getElementById('btn-start-game').onclick = transitionToGame;
  document.getElementById('btn-quit-quiz').onclick = returnToMenu;
}

function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  
  document.getElementById('q-idx').textContent = currentQuestionIndex + 1;
  document.getElementById('question-text').textContent = q.q;
  
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  
  const pct = (currentQuestionIndex / currentQuestions.length) * 100;
  document.getElementById('quiz-progress').style.width = `${pct}%`;

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = `quiz-option w-full p-4 text-left border-2 border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-white bg-white dark:bg-slate-800 transition-all`;
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(idx);
    grid.appendChild(btn);
  });
}

function handleAnswer(selectedIndex) {
  const q = currentQuestions[currentQuestionIndex];
  const isCorrect = selectedIndex === q.a;
  const options = document.getElementById('options-grid').children;

  for (let btn of options) {
    btn.disabled = true;
    btn.classList.add('cursor-not-allowed', 'opacity-60');
  }

  const feedbackText = document.getElementById('feedback-text');
  
  if (isCorrect) {
    options[selectedIndex].classList.add('correct');
    options[selectedIndex].classList.remove('opacity-60');
    score++;
    
    // Bonus Logic
    let totalPoints = Math.floor(Math.random() * 5) + 4; // 4 to 8
    
    // Comprehensive Mode Logic: Double questions but half stats
    if (currentGenre.id === 'comprehensive') {
        totalPoints = Math.ceil(totalPoints * 0.5);
    }
    
    const dist = distributePoints(totalPoints);
    bonuses.power += dist.power;
    bonuses.loft += dist.loft;
    bonuses.wind += dist.wind;
    
    // Use Full Words (No Abbreviation)
    let bStr = [];
    if (dist.power > 0) bStr.push(`Power +${dist.power}`);
    if (dist.loft > 0) bStr.push(`Angle +${dist.loft}`);
    if (dist.wind > 0) bStr.push(`Assist +${dist.wind}`);

    feedbackText.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 block text-xl mb-1">Correct!</span><span class="text-amber-500 dark:text-amber-400 text-sm font-bold">✨ ${bStr.join(' ')}</span>`;
  } else {
    options[selectedIndex].classList.add('wrong');
    options[q.a].classList.add('correct');
    options[q.a].classList.remove('opacity-60');
    feedbackText.innerHTML = `<span class="text-rose-500 dark:text-rose-400 block text-xl">Incorrect...</span>`;
  }

  const fbArea = document.getElementById('feedback-area');
  fbArea.classList.remove('hidden');
  fbArea.classList.add('fade-in');
}

function distributePoints(points) {
  const stats = ['power', 'loft', 'wind'];
  let dist = { power: 0, loft: 0, wind: 0 };
  for (let i = 0; i < points; i++) {
    dist[stats[Math.floor(Math.random() * 3)]]++;
  }
  return dist;
}

function nextQuestion() {
  currentQuestionIndex++;
  document.getElementById('feedback-area').classList.add('hidden');
  
  if (currentQuestionIndex < currentQuestions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  document.getElementById('question-area').classList.add('hidden');
  const resArea = document.getElementById('result-area');
  resArea.classList.remove('hidden');
  resArea.classList.add('fade-in');
  document.getElementById('quiz-progress').style.width = '100%';

  document.getElementById('bonus-power').textContent = `Lv. ${bonuses.power}`;
  document.getElementById('bonus-loft').textContent = `Lv. ${bonuses.loft}`;
  document.getElementById('bonus-wind').textContent = `Lv. ${bonuses.wind}`;

  // Save Quiz High Score (Correct count) immediately
  const stats = getStats(currentGenre.id);
  if (score > stats.maxCorrect) {
    stats.maxCorrect = score;
    localStorage.setItem(`golf_stats_${currentGenre.id}`, JSON.stringify(stats));
  }
}

function transitionToGame() {
  // CRITICAL: Reset game UI to ensure Launch button is enabled
  resetGame();

  // Pass Genre ID to App for High Score saving later
  updateParams({
    power: bonuses.power,
    loft: bonuses.loft,
    wind: bonuses.wind
  }, currentGenre.id);

  els.quizContainer.classList.add('hidden');
  els.menuContainer.classList.add('hidden'); // Explicitly hide menu
  
  els.gameContainer.classList.remove('blur-md');
  // Bring game container to front
  els.gameContainer.style.zIndex = '10';
}

// Directly call init since module script is deferred by default
init();