const express = require('express');
const cors = require('cors');
const comments = require('./comments');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function pickRandom(arr = []) {
  if (arr.length === 0) {
    return "……ちょっと待ちなさい";
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectCategory(taskText = "") {
  for (const key of Object.keys(comments)) {
    const category = comments[key];
    if (!category.keywords) continue;
    if (category.keywords.some(k => taskText.includes(k))) {
      return category;
    }
  }
  return comments.default;
}

app.post('/api/message', (req, res) => {
  const { taskText = "", type, isFirstVisit } = req.body || {};

  if (!type) {
    return res.status(400).json({ message: "invalid request" });
  }

  // 👇 init 専用分岐
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


app.listen(3000, () => {
  console.log("Server running on http://127.0.0.1:3000");
});
