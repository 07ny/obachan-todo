const express = require('express');
const cors = require('cors');
const comments = require('./comments');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

// 1️⃣【追加】フロントエンド（HTML/JS/画像）をブラウザに表示させる設定
app.use(express.static(__dirname)); 

function pickRandom(arr = []) {
  if (arr.length === 0) return "……ちょっと待ちなさい";
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectCategory(taskText = "") {
  for (const key of Object.keys(comments)) {
    const category = comments[key];
    if (!category.keywords) continue;
    if (category.keywords.some(k => taskText.includes(k))) return category;
  }
  return comments.default;
}

app.post('/api/message', (req, res) => {
  const { taskText = "", type, isFirstVisit } = req.body || {};
  if (!type) return res.status(400).json({ message: "invalid request" });

  if (type === "init") {
    return res.json({
      message: isFirstVisit
        ? "はじめましてやな〜。今日からおばちゃんが見といたるで"
        : "また来たんやね。今日は何するん？"
    });
  }

  const category = detectCategory(taskText);
  const list = category[type] || comments.default[type];
  res.json({ message: pickRandom(list) });
});

// 2️⃣【修正】Vercel（本番環境）では app.listen を動かさないようにする
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log("Server running on http://127.0.0.1:3000");
  });
}

// 3️⃣【追加】Vercelがサーバーを読み込めるようにエクスポート
module.exports = app;