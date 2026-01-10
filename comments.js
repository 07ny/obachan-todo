// ===== util =====
function combine(a = [], b = [], c = []) {
  const result = [];
  for (const x of a) {
    for (const y of b) {
      for (const z of c) {
        // 末尾の句点や空白、改行コードをすべて除去
        const cleanX = x.replace(/[。、\s\n]+$/, '');
        const cleanY = y.replace(/[。、\s\n]+$/, '');
        const cleanZ = z.replace(/^[。、\s\n]+/, ''); // zの先頭の句点を確実に消す

        // 1行目の最後に句点を打ち、<br>で改行して2行目をつなぐ
        let text = `${cleanX}${cleanY}。<br>${cleanZ}`;
        result.push(text);
      }
    }
  }
  return result;
}

// ===== カテゴリ定義（module.exports の外）=====

const shopping = {
  keywords: [
    "買う", "購入", "補充",
    "醤油", "コンソメ", "砂糖", "塩", "油",
    "ティッシュ", "トイレットペーパー",
    "洗剤", "シャンプー", "電池", "ラップ"
  ],
  added: combine(
    ["あー、", "それな、", "はいはい、"],
    [
      "切れそうなやつやな",
      "ないと困るやつや",
      "買い物行ったら忘れがちなやつ"
    ],
    [
      "書いといて正解",
      "あとで助かる",
      "今気づけたん偉い"
    ]
  ),
  completed: combine(
    ["お、", "よし、"],
    [
      "ちゃんと買えたな",
      "切れる前で助かったな"
    ],
    [
      "安心やな",
      "地味に偉いで"
    ]
  )
};

const cleaning = {
  keywords: ["掃除", "排水溝", "換気扇", "カビ", "風呂", "トイレ"],
  added: combine(
    ["うわ、", "それな、"],
    [
      "見て見ぬふりしてたやつやな",
      "気になってたとこや"
    ],
    [
      "今日は書いただけで十分",
      "余裕ある時でええ"
    ]
  ),
  completed: combine(
    ["やるやん、", "ほら、"],
    [
      "ちゃんと手ぇ付けたな",
      "気になってたの消えたな"
    ],
    [
      "スッキリしたやろ",
      "今日は勝ちや"
    ]
  )
};

const contact = {
  keywords: ["連絡", "電話", "LINE", "メール", "親", "実家"],
  added: combine(
    ["あ、", "それな、"],
    [
      "返さなあかんと思ってたやつや",
      "後回しにしがちな連絡やな"
    ],
    [
      "書いといたら安心",
      "今じゃなくてええ"
    ]
  ),
  completed: combine(
    ["よし、", "ちゃんと、"],
    [
      "返せたな",
      "一安心やな"
    ],
    [
      "気持ち軽なったやろ",
      "えらいで"
    ]
  )
};

const routine = {
  keywords: ["ゴミ", "カレンダー", "シーツ", "植物", "水やり"],
  added: combine(
    ["はいはい、", "それな、"],
    [
      "いつものやつやな",
      "忘れたら困るやつ"
    ],
    [
      "書いといて正解",
      "生活回すやつや"
    ]
  ),
  completed: combine(
    ["よし、", "ちゃんと、"],
    [
      "今日の分回せたな",
      "いつものが終わったな"
    ],
    [
      "安定やな",
      "今日はこれでOK"
    ]
  )
};

// ===== export（1回だけ）=====

module.exports = {
  init: {
    messages: [
      "あ、今ふと思い出したんやろ",
      "生活のやつは浮かんだ瞬間が正解や",
      "忘れる前に置いとこ"
    ]
  },

  shopping,
  cleaning,
  contact,
  routine,

  default: {
    added: combine(
      ["まあ、", "とりあえず、"],
      ["思い出せただけで十分や"],
      ["今日はそれで合格"]
    ),
    completed: combine(
      ["ほら、", "ちゃんと、"],
      ["一個片付いたな"],
      ["えらいで"]
    )
  }
};
