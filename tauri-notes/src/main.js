const { invoke } = window.__TAURI__.core;

const titleInput = document.querySelector("#note-title");
const contentInput = document.querySelector("#note-content");
const saveButton = document.querySelector("#save-btn");
const cancelEditButton = document.querySelector("#cancel-edit-btn");
const clearButton = document.querySelector("#clear-btn");
const message = document.querySelector("#message");
const notesList = document.querySelector("#notes-list");
const searchInput = document.querySelector("#search-input");

let allNotes = [];
let editingNoteId = null;

function exitEditMode() {
  editingNoteId = null;
  titleInput.value = "";
  contentInput.value = "";
  saveButton.textContent = "保存笔记";
  cancelEditButton.hidden = true;
  titleInput.focus();
}

function renderNotes(notes, emptyMessage = "没有找到匹配的笔记。") {
  if (notes.length === 0) {
    notesList.innerHTML = `<div class="empty-notes">${emptyMessage}</div>`;
    return;
  }

  notesList.innerHTML = notes
    .map((note) => {
      return `
        <div class="note-card">
          <p>时间：${note.time}</p>
          <p><strong>标题：${note.title}</strong></p>
          <p>内容：${note.content}</p>
          <div class="note-actions">
            <button class="edit-note-btn" data-id="${note.id}">编辑</button>
            <button class="delete-note-btn" data-id="${note.id}">删除这条</button>
          </div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".edit-note-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const note = allNotes.find((item) => item.id === id);

      if (!note) {
        message.textContent = "要编辑的笔记不存在。";
        return;
      }

      editingNoteId = note.id;
      titleInput.value = note.title;
      contentInput.value = note.content;
      saveButton.textContent = "更新笔记";
      cancelEditButton.hidden = false;
      message.textContent = "正在编辑这条笔记。";
      titleInput.focus();
    });
  });

  document.querySelectorAll(".delete-note-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const confirmed = window.confirm("确定要删除这条笔记吗？这个操作不能撤销。");

      if (!confirmed) {
        message.textContent = "已取消删除操作。";
        return;
      }

      const id = button.dataset.id;

      try {
        const result = await invoke("delete_note", { id });
        message.textContent = result;
        await refreshNotes();
      } catch (error) {
        message.textContent = `删除失败：${error}`;
      }
    });
  });
}

async function refreshNotes() {
  try {
    const result = await invoke("load_notes");
    allNotes = JSON.parse(result);

    renderNotes(allNotes, "还没有保存任何笔记。");
  } catch (error) {
    notesList.textContent = `读取笔记失败：${error}`;
  }
}

saveButton.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    message.textContent = "请先把标题和内容都填写完整。";
    return;
  }

  try {
    let result;

    if (editingNoteId) {
      result = await invoke("update_note", {
        id: editingNoteId,
        title,
        content,
      });

      exitEditMode();
    } else {
      result = await invoke("save_note", { title, content });
    }

    message.textContent = result;
    await refreshNotes();

    titleInput.value = "";
    contentInput.value = "";
    titleInput.focus();
  } catch (error) {
    message.textContent = `操作失败：${error}`;
  }
});

cancelEditButton.addEventListener("click", () => {
  exitEditMode();
  message.textContent = "已取消编辑。";
});

clearButton.addEventListener("click", async () => {
  const confirmed = window.confirm("确定要清空全部笔记吗？这个操作不能撤销。");

  if (!confirmed) {
    message.textContent = "已取消清空操作。";
    return;
  }

  try {
    const result = await invoke("clear_notes");
    message.textContent = result;
    await refreshNotes();
  } catch (error) {
    message.textContent = `清空失败：${error}`;
  }
});

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.trim().toLowerCase();

  if (!keyword) {
    renderNotes(allNotes);
    return;
  }

  const filteredNotes = allNotes.filter((note) => {
    return (
      note.title.toLowerCase().includes(keyword) ||
      note.content.toLowerCase().includes(keyword)
    );
  });

  renderNotes(filteredNotes);
});


// 页面一打开，就先读取一次已有笔记
refreshNotes();
