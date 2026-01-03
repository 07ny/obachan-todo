const input = document.getElementById("todoInput");
const addButton = document.getElementById("addButton");
const activeList = document.getElementById("todoListActive");
const completedList = document.getElementById("todoListCompleted");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");
const msgElement = document.getElementById("aiMessage");
const avatar = document.getElementById("aiAvatar");
const isFirstVisit = !localStorage.getItem("visited");


localStorage.setItem("visited", "true");



const isFirstVisit = !localStorage.getItem("visited");

getAiMessage("", "init", isFirstVisit)
  .then(message => {
    msgElement.textContent = message;
  })
  .catch(() => {
    msgElement.textContent = "今日は何するん？";
  });

localStorage.setItem("visited", "true");


const AVATAR = {
  thinking: "thinking.png",
  talking: "talking.png",
  done : "done.png"
};

// データの読み込み
let todos = JSON.parse(localStorage.getItem("todos")) || [];
// 現在のフィルター状態 ('all', 'active', 'completed')
let currentFilter = 'all';

// ===== 初期設定 =====

// タブ切り替えイベントの設定
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-filter');
    render();
  });
});

// 追加ボタン（1回だけ登録）
addButton.addEventListener("click", addTodo);

// Enterキーでの追加
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

// 最初に一度描画
render();

// ===== メイン機能 =====

function addTodo() {
  const text = input.value.trim();
  if (!text) return;

  const todo = {
    id: Date.now(),
    text,
    completed: false
  };

  todos.push(todo);
  save();
  render();
  input.value = ""; 

  // AI考え中
  msgElement.textContent = "AIが考え中...";
  avatar.classList.add("thinking");
  avatar.src = AVATAR.thinking;

  getAiMessage(text, "added")
    .then(message => {
      avatar.src = AVATAR.talking;
      msgElement.classList.remove("ai-placeholder");
      msgElement.textContent = message;

      setTimeout(() => {
        avatar.src = AVATAR.done;
      }, 3000);
    })
    .catch(() => {
      avatar.src = AVATAR.done;
      msgElement.textContent = "AIからのメッセージの取得に失敗しました。";
    });
}



function render() {
  // リストをクリア
  activeList.innerHTML = "";
  completedList.innerHTML = "";

  // フィルター処理
  const filteredTodos = todos.filter(todo => {
    if (currentFilter === "active") return !todo.completed;
    if (currentFilter === "completed") return todo.completed;
    return true;
  });

  // 各TODOの生成
  filteredTodos.forEach(todo => {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "completed" : ""}`;

    // --- A. チェックボックス ---
    const label = document.createElement("label");
    label.className = "checkbox";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    const checkmark = document.createElement("span");
    checkmark.className = "checkmark";
    label.append(checkbox, checkmark);

    checkbox.addEventListener("change", () => {
      todo.completed = checkbox.checked;
      save();
      render();

      if(todo.completed) {
        const msgElement = document.getElementById("aiMessage");
        msgElement.textContent = "AIからのメッセージを取得中...";
        getAiMessage(todo.text, "completed").then(message => {
          msgElement.textContent = message;
        }).catch(() => {
          msgElement.textContent = "AIからのメッセージの取得に失敗しました。";
        });
      } 
    });

    // --- B. 中央コンテンツ（テキスト/編集入力） ---
    const contentBox = document.createElement("div");
    contentBox.className = "todo-content";
    contentBox.style.marginLeft = "12px";
    contentBox.style.flex = "1";
    contentBox.style.minWidth = "0"; // 折り返し対策

    const textSpan = document.createElement("span");
    textSpan.className = "todo-text";
    textSpan.textContent = todo.text;
    contentBox.appendChild(textSpan);

    // --- C. 操作ボタン ---
    const rightBox = document.createElement("div");
    rightBox.style.marginLeft = "auto";
    rightBox.style.display = "flex";
    rightBox.style.gap = "6px";

    const editBtn = document.createElement("button");
    editBtn.innerHTML = "<i class='fa-solid fa-pen'></i>";
    editBtn.className = "edit-btn";

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "<i class='fa-solid fa-trash'></i>";
    deleteBtn.className = "delete-btn";

    // 編集ロジック
    let editing = false;
    editBtn.onclick = () => {
      if (!editing) {
        editing = true;
        editBtn.textContent = "保存";
        const inputEdit = document.createElement("input");
        inputEdit.type = "text";
        inputEdit.className = "edit-input";
        inputEdit.value = todo.text;
        inputEdit.style.width = "100%";
        
        contentBox.replaceChild(inputEdit, textSpan);
        inputEdit.focus();

        // 保存実行関数
        const saveEdit = () => {
          const newText = inputEdit.value.trim();
          if (newText) todo.text = newText;
          editing = false;
          save();
          render();
        };

        editBtn.onclick = saveEdit;
        inputEdit.onkeydown = (e) => { if (e.key === "Enter") saveEdit(); };
      }
    };

    // 削除ロジック
    deleteBtn.onclick = () => {
      todos = todos.filter(t => t.id !== todo.id);
      save();
      render();
    };

    rightBox.append(editBtn, deleteBtn);
    li.append(label, contentBox, rightBox);

    // 適切なリストに振り分け
    if (todo.completed) {
      completedList.appendChild(li);
    } else {
      activeList.appendChild(li);
    }
  });

  // カウント更新
  activeCount.textContent = todos.filter(t => !t.completed).length;
  completedCount.textContent = todos.filter(t => t.completed).length;

  // セクション自体の表示/非表示をタブに合わせる
  const activeSection = activeList.parentElement;
  const completedSection = completedList.parentElement;
  activeSection.style.display = (currentFilter === "completed") ? "none" : "block";
  completedSection.style.display = (currentFilter === "active") ? "none" : "block";
}

function save() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

async function getAiMessage(taskText, type, isFirstVisit = false) {
  try {
    const response = await fetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskText, type, isFirstVisit })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Server Error");
    }

    const data = await response.json();
    return data.message;

  } catch (e) {
    console.error("--- 通信エラー詳細 ---");
    console.error("メッセージ:", e.message);
    console.error("原因:", e);
    throw e;
  }
}

