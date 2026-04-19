use chrono::Local;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Serialize, Deserialize)]
struct Note {
    #[serde(default)]
    id: String,
    time: String,
    title: String,
    content: String,
}

fn generate_note_id(index: usize) -> String {
    let now = Local::now().format("%Y%m%d%H%M%S%3f").to_string();

    format!("{}{}", now, index)
}

fn get_notes_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|error| error.to_string())?;

    fs::create_dir_all(&app_data_dir).map_err(|error| error.to_string())?;

    Ok(app_data_dir.join("notes.json"))
}

fn read_notes(app: &tauri::AppHandle) -> Result<Vec<Note>, String> {
    let notes_path = get_notes_path(app)?;

    if !notes_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(notes_path).map_err(|error| error.to_string())?;

    if content.trim().is_empty() {
        return Ok(Vec::new());
    }

    let mut notes: Vec<Note> = serde_json::from_str(&content).map_err(|error| error.to_string())?;

    let mut changed = false;

    for (index, note) in notes.iter_mut().enumerate() {
        if note.id.trim().is_empty() {
            note.id = generate_note_id(index);
            changed = true;
        }
    }

    if changed {
        write_notes(app, &notes)?;
    }

    Ok(notes)
}

fn write_notes(app: &tauri::AppHandle, notes: &[Note]) -> Result<(), String> {
    let notes_path = get_notes_path(app)?;

    let content = serde_json::to_string_pretty(notes).map_err(|error| error.to_string())?;

    fs::write(notes_path, content).map_err(|error| error.to_string())
}

#[tauri::command]
fn save_note(app: tauri::AppHandle, title: &str, content: &str) -> Result<String, String> {
    let mut notes = read_notes(&app)?;
    let now = Local::now();

    let note = Note {
        id: now.format("%Y%m%d%H%M%S%3f").to_string(),
        time: now.format("%Y-%m-%d %H:%M:%S").to_string(),
        title: title.to_string(),
        content: content.to_string(),
    };

    notes.push(note);
    write_notes(&app, &notes)?;

    Ok("笔记已保存到 JSON 文件".to_string())
}

#[tauri::command]
fn load_notes(app: tauri::AppHandle) -> Result<String, String> {
    let notes = read_notes(&app)?;

    if notes.is_empty() {
        return Ok("[]".to_string());
    }

    serde_json::to_string(&notes).map_err(|error| error.to_string())
}

#[tauri::command]
fn clear_notes(app: tauri::AppHandle) -> Result<String, String> {
    write_notes(&app, &[])?;

    Ok("全部笔记已清空".to_string())
}

#[tauri::command]
fn delete_note(app: tauri::AppHandle, id: &str) -> Result<String, String> {
    let mut notes = read_notes(&app)?;
    let original_len = notes.len();

    notes.retain(|note| note.id != id);

    if notes.len() == original_len {
        return Err("要删除的笔记不存在".to_string());
    }

    write_notes(&app, &notes)?;

    Ok("笔记已删除".to_string())
}

#[tauri::command]
fn update_note(
    app: tauri::AppHandle,
    id: &str,
    title: &str,
    content: &str,
) -> Result<String, String> {
    let mut notes = read_notes(&app)?;

    let note = notes
        .iter_mut()
        .find(|note| note.id == id)
        .ok_or_else(|| "要更新的笔记不存在".to_string())?;

    note.title = title.to_string();
    note.content = content.to_string();
    note.time = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    write_notes(&app, &notes)?;

    Ok("笔记已更新".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_note, 
            load_notes, 
            clear_notes, 
            delete_note, 
            update_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
