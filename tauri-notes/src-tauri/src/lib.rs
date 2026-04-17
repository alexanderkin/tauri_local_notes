use chrono::Local;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use tauri::Manager;

fn get_notes_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|error| error.to_string())?;

    fs::create_dir_all(&app_data_dir).map_err(|error| error.to_string())?;

    Ok(app_data_dir.join("notes.txt"))
}

#[tauri::command]
fn save_note(app: tauri::AppHandle, title: &str, content: &str) -> Result<String, String> {
    let notes_path = get_notes_path(&app)?;
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let text = format!(
        "时间：{}\n标题：{}\n内容：{}\n--------------------\n",
        now, title, content
    );

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(notes_path)
        .map_err(|error| error.to_string())?;

    file.write_all(text.as_bytes())
        .map_err(|error| error.to_string())?;

    Ok("笔记已保存到应用数据目录".to_string())
}

#[tauri::command]
fn load_notes(app: tauri::AppHandle) -> Result<String, String> {
    let notes_path = get_notes_path(&app)?;

    match fs::read_to_string(notes_path) {
        Ok(content) => Ok(content),
        Err(_) => Ok("还没有保存任何笔记。".to_string()),
    }
}

#[tauri::command]
fn clear_notes(app: tauri::AppHandle) -> Result<String, String> {
    let notes_path = get_notes_path(&app)?;

    fs::write(notes_path, "").map_err(|error| error.to_string())?;

    Ok("全部笔记已清空".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![save_note, load_notes, clear_notes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
