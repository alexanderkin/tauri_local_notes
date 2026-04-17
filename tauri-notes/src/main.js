const { invoke } = window.__TAURI__.core;

const titleInput = document.querySelector("#note-title");
const contentInput = document.querySelector("#note-content");
const saveButton = document.querySelector("#save-btn");
const clearButton = document.querySelector("#clear-btn");
const message = document.querySelector("#message");
const notesList = document.querySelector("#notes-list");

async function refreshNotes() {
  try {
    const result = await invoke("load_notes");

    if (result === "还没有保存任何笔记。") {
      notesList.innerHTML = '<div class="empty-notes">还没有保存任何笔记。</div>';
      return;
    }

    const notes = result
      .split("--------------------")
      .map((item) => item.trim())
      .filter((item) => item);

    notesList.innerHTML = notes
      .map((note) => {
        const lines = note.split("\n");

        const timeLine = lines.find((line) => line.startsWith("时间：")) || "时间：未记录";
        const titleLine = lines.find((line) => line.startsWith("标题：")) || "标题：无标题";
        const contentLine = lines.find((line) => line.startsWith("内容：")) || "内容：无内容";

        return `
          <div class="note-card">
            <p>${timeLine}</p>
            <p><strong>${titleLine}</strong></p>
            <p>${contentLine}</p>
          </div>
        `;
      })
      .join("");
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
    const result = await invoke("save_note", { title, content });
    message.textContent = result;

    // 保存成功后，重新读取最新笔记内容
    await refreshNotes();

    // 保存成功后清空输入框，方便继续记录下一条
    titleInput.value = "";
    contentInput.value = "";
    titleInput.focus();
  } catch (error) {
    message.textContent = `保存失败：${error}`;
  }
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


// 页面一打开，就先读取一次已有笔记
refreshNotes();
