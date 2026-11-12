#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // The window loads the Next.js app. There is no price ticker in this process.
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running Trading Terminal");
}
