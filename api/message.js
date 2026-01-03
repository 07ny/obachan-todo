const comments = require('../comments');

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

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { taskText = "", type, isFirstVisit } = req.body || {};

  if (!type) {
    return res.status(400).json({ message: "invalid request" });
  }

  // init専用
if (type === "init") {
  const list = comments.init.messages;
  return res.json({ message: pickRandom(list) });
}


  const category = detectCategory(taskText);
  const list = category[type] || comments.default[type];

  res.json({ message: pickRandom(list) });
};
