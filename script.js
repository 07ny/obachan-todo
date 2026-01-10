// ===== Firebase SDK =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  linkWithCredential
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===== Firebase 初期化 =====
const firebaseConfig = {
  apiKey: "AIzaSyBYu_A1W65jR4HNKf2db88FMH3WGNwUcH0",
  authDomain: "todo-app-demo-c79f6.firebaseapp.com",
  projectId: "todo-app-demo-c79f6",
  storageBucket: "todo-app-demo-c79f6.firebasestorage.app",
  messagingSenderId: "900463446882",
  appId: "1:900463446882:web:0feadb0908ef6adcbcba3b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== グローバル変数 =====
let currentUser = null;
let todos = [];
let currentFilter = 'all';
let authMode = 'signup'; // 'login' or 'signup'

// ===== DOM要素 =====
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authError = document.getElementById("authError");
const authTabs = document.querySelectorAll(".auth-tab");
const closeAuthBtn = document.getElementById("closeAuthBtn");
const registerBtn = document.getElementById("registerBtn");
const guestStatus = document.getElementById("guestStatus");
const userStatus = document.getElementById("userStatus");
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

const input = document.getElementById("todoInput");
const addButton = document.getElementById("addButton");
const activeList = document.getElementById("todoListActive");
const completedList = document.getElementById("todoListCompleted");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");
const msgElement = document.getElementById("aiMessage");
const avatar = document.getElementById("aiAvatar");

const AVATAR = {
  thinking: "thinking.png",
  talking: "talking.png",
  done: "done.png"
};

// ===== 初期化：自動匿名ログイン =====
signInAnonymously(auth).catch(error => {
  console.error('匿名ログインエラー:', error);
});

// ===== 認証状態の監視 =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("ログイン中 uid:", user.uid);
    
    // UI切り替え
    if (user.isAnonymous) {
      // ゲストユーザー
      guestStatus.style.display = 'block';
      userStatus.style.display = 'none';
    } else {
      // 本登録済みユーザー
      guestStatus.style.display = 'none';
      userStatus.style.display = 'block';
      userEmail.textContent = user.email;
    }
    
    // 初回訪問チェック
    const isFirstVisit = !localStorage.getItem(`visited_${user.uid}`);
    localStorage.setItem(`visited_${user.uid}`, "true");
    
    // AI初期メッセージ
    getAiMessage("", "init", isFirstVisit)
      .then(message => {
        msgElement.innerHTML = message;
      })
      .catch(() => {
        msgElement.innerHTML = "今日は何するん？";
      });
    
    // データ読み込み
    loadTodos();
  }
});

// ===== 認証関連イベント =====

// 登録ボタン（ゲスト→本登録モーダル表示）
registerBtn.addEventListener('click', () => {
  authModal.classList.add('show');
  authMode = 'signup';
  authTabs[0].classList.add('active');
  authTabs[1].classList.remove('active');
  authSubmitBtn.textContent = '新規登録';
  authError.textContent = '';
});

// モーダル閉じる
closeAuthBtn.addEventListener('click', () => {
  authModal.classList.remove('show');
  emailInput.value = '';
  passwordInput.value = '';
  authError.textContent = '';
});

// タブ切り替え
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    authMode = tab.dataset.mode;
    authSubmitBtn.textContent = authMode === 'login' ? 'ログイン' : '新規登録';
    authError.textContent = '';
  });
});

// フォーム送信
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    if (authMode === 'signup' && currentUser && currentUser.isAnonymous) {
      // 匿名ユーザーを本アカウントに昇格
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(currentUser, credential);
      
      authModal.classList.remove('show');
      emailInput.value = '';
      passwordInput.value = '';
      alert('登録完了！これでデータが永久保存されます✨');
      
    } else if (authMode === 'signup') {
      // 通常の新規登録
      await createUserWithEmailAndPassword(auth, email, password);
      authModal.classList.remove('show');
      emailInput.value = '';
      passwordInput.value = '';
      
    } else {
      // ログイン
      await signInWithEmailAndPassword(auth, email, password);
      authModal.classList.remove('show');
      emailInput.value = '';
      passwordInput.value = '';
    }
  } catch (error) {
    console.error('認証エラー詳細:', error);
    console.error('エラーコード:', error.code);
    console.error('エラーメッセージ:', error.message);
    
    // エラーメッセージを日本語化
    let errorMsg = '認証に失敗しました';
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = 'このメールアドレスは既に使われています';
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = 'メールアドレスの形式が正しくありません';
    } else if (error.code === 'auth/weak-password') {
      errorMsg = 'パスワードは6文字以上にしてください';
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMsg = 'メールアドレスまたはパスワードが間違っています';
    } else if (error.code === 'auth/invalid-credential') {
      errorMsg = 'メールアドレスまたはパスワードが間違っています';
    } else if (error.code === 'auth/credential-already-in-use') {
      errorMsg = 'このメールアドレスは既に別のアカウントで使われています';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMsg = 'メール/パスワード認証が無効です。Firebase Consoleで有効化してください';
    } else if (error.code === 'auth/provider-already-linked') {
      errorMsg = 'このアカウントは既に登録済みです';
    }
    
    // デバッグ用：詳細エラーも表示
    authError.textContent = errorMsg + ` (${error.code})`;
  }
});

// ログアウト
logoutBtn.addEventListener('click', async () => {
  if (confirm('ログアウトすると、次回はメールアドレスでログインが必要になります。よろしいですか？')) {
    try {
      await signOut(auth);
      // ログアウト後、自動で匿名ログイン
      await signInAnonymously(auth);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  }
});

// ===== TODO関連イベント =====
addButton.addEventListener("click", addTodo);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-filter');
    render();
  });
});

// ===== Firestore操作 =====

// TODO追加
async function addTodo() {
  const text = input.value.trim();
  if (!text || !currentUser) return;

  try {
    // AI考え中表示
    msgElement.innerHTML = "AIが考え中...";
    avatar.src = AVATAR.thinking;

    // Firestoreに保存
    await addDoc(
      collection(db, "users", currentUser.uid, "todos"),
      {
        text,
        completed: false,
        createdAt: new Date()
      }
    );

    input.value = "";
    
    // データ再読み込み
    await loadTodos();

    // AIメッセージ取得
    getAiMessage(text, "added")
      .then(message => {
        avatar.src = AVATAR.talking;
        msgElement.innerHTML = message;
        setTimeout(() => {
          avatar.src = AVATAR.done;
        }, 3000);
      })
      .catch(() => {
        avatar.src = AVATAR.done;
        msgElement.innerHTML = "AIからのメッセージの取得に失敗しました。";
      });

  } catch (error) {
    console.error("TODO追加エラー:", error);
    alert("保存に失敗しました");
  }
}

// TODO読み込み
async function loadTodos() {
  if (!currentUser) return;

  try {
    const q = query(
      collection(db, "users", currentUser.uid, "todos"),
      orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(q);

    todos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    render();
  } catch (error) {
    console.error("TODO読み込みエラー:", error);
  }
}

// TODO更新（完了状態）
async function toggleTodo(todo) {
  if (!currentUser) return;

  try {
    const todoRef = doc(db, "users", currentUser.uid, "todos", todo.id);
    await updateDoc(todoRef, {
      completed: !todo.completed
    });

    // ローカルも更新
    todo.completed = !todo.completed;
    render();

    // 完了時のAIメッセージ
    if (todo.completed) {
      msgElement.innerHTML = "AIからのメッセージを取得中...";
      getAiMessage(todo.text, "completed")
        .then(message => {
          msgElement.innerHTML = message;
        })
        .catch(() => {
          msgElement.innerHTML = "AIからのメッセージの取得に失敗しました。";
        });
    }
  } catch (error) {
    console.error("TODO更新エラー:", error);
  }
}

// TODO更新（テキスト編集）
async function updateTodoText(todo, newText) {
  if (!currentUser || !newText.trim()) return;

  try {
    const todoRef = doc(db, "users", currentUser.uid, "todos", todo.id);
    await updateDoc(todoRef, {
      text: newText.trim()
    });

    // ローカルも更新
    todo.text = newText.trim();
    render();
  } catch (error) {
    console.error("TODO編集エラー:", error);
  }
}

// TODO削除
async function deleteTodo(todoId) {
  if (!currentUser) return;

  if (!confirm("これ、ほんまに消してええのん？")) return;

  try {
    const todoRef = doc(db, "users", currentUser.uid, "todos", todoId);
    await deleteDoc(todoRef);

    // ローカルからも削除
    todos = todos.filter(t => t.id !== todoId);
    render();
  } catch (error) {
    console.error("TODO削除エラー:", error);
  }
}

// ===== 画面描画 =====
function render() {
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

    // スワイプ操作用の変数
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;

    // タッチ開始
    li.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isSwiping = true;
    });

    // タッチ移動
    li.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;

      // 左スワイプのみ（右にスワイプしても何もしない）
      if (diffX < 0) {
        li.style.transform = `translateX(${diffX}px)`;
        li.style.transition = 'none';
      }
    });

    // タッチ終了
    li.addEventListener('touchend', () => {
      if (!isSwiping) return;
      isSwiping = false;

      const diffX = currentX - startX;

      // 100px以上左にスワイプしたら削除確認
      if (diffX < -100) {
        if (confirm("これ、ほんまに消してええのん？")) {
          deleteTodo(todo.id);
        }
      }

      // 元の位置に戻す
      li.style.transform = 'translateX(0)';
      li.style.transition = 'transform 0.3s ease';
    });

    // チェックボックス
    const label = document.createElement("label");
    label.className = "checkbox";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    const checkmark = document.createElement("span");
    checkmark.className = "checkmark";
    label.append(checkbox, checkmark);

    checkbox.addEventListener("change", () => {
      const wasCompleted = todo.completed;
      toggleTodo(todo);
      
      // 完了時の演出
      if (!wasCompleted) {
        li.classList.add('celebrate');
        setTimeout(() => li.classList.remove('celebrate'), 400);
      }
    });

    // テキスト表示エリア
    const contentBox = document.createElement("div");
    contentBox.className = "todo-content";
    contentBox.style.marginLeft = "12px";
    contentBox.style.flex = "1";
    contentBox.style.minWidth = "0";

    const textSpan = document.createElement("span");
    textSpan.className = "todo-text";
    textSpan.textContent = todo.text;
    contentBox.appendChild(textSpan);

    // 操作ボタン
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
    let isEditing = false;
    editBtn.addEventListener("click", () => {
      if (!isEditing) {
        isEditing = true;
        editBtn.innerHTML = "<i class='fa-solid fa-check'></i>";
        
        const inputEdit = document.createElement("input");
        inputEdit.type = "text";
        inputEdit.className = "edit-input";
        inputEdit.value = todo.text;
        inputEdit.style.width = "100%";
        
        contentBox.innerHTML = "";
        contentBox.appendChild(inputEdit);
        inputEdit.focus();

        const finishEditing = async () => {
          const newText = inputEdit.value.trim();
          if (newText && newText !== todo.text) {
            await updateTodoText(todo, newText);
          } else {
            render();
          }
          isEditing = false;
        };

        inputEdit.addEventListener("keydown", (e) => {
          if (e.key === "Enter") finishEditing();
        });
        
        inputEdit.addEventListener("blur", () => {
          setTimeout(finishEditing, 100);
        });
      }
    });

    // 削除ロジック
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    rightBox.append(editBtn, deleteBtn);
    li.append(label, contentBox, rightBox);

    if (todo.completed) {
      completedList.appendChild(li);
    } else {
      activeList.appendChild(li);
    }
  });

  // カウント更新
  activeCount.textContent = todos.filter(t => !t.completed).length;
  completedCount.textContent = todos.filter(t => t.completed).length;

  // セクション表示切り替え
  const activeSection = activeList.parentElement;
  const completedSection = completedList.parentElement;
  activeSection.style.display = (currentFilter === "completed") ? "none" : "block";
  completedSection.style.display = (currentFilter === "active") ? "none" : "block";
}

// ===== AI連携 =====
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