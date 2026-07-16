use crate::crypto::{self, CryptoState};
use crate::db::{self, Account};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State, WebviewWindow};
use tauri_plugin_shell::ShellExt;

const COLLAPSED_WIDTH: f64 = 48.0;
const COLLAPSED_HEIGHT: f64 = 144.0; // 与 SideGrip 按钮的 h-36（9rem）保持一致
const EXPANDED_WIDTH: f64 = 520.0;

pub fn position_window(window: &WebviewWindow, expanded: bool) {
    // 优先使用窗口当前所在显示器，回退到主显示器
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten());

    if let Some(monitor) = monitor {
        let scale = monitor.scale_factor();
        let work_area = monitor.work_area();
        let work_x = work_area.position.x as f64 / scale;
        let work_y = work_area.position.y as f64 / scale;
        let work_width = work_area.size.width as f64 / scale;
        let work_height = work_area.size.height as f64 / scale;

        let width = if expanded { EXPANDED_WIDTH } else { COLLAPSED_WIDTH };
        let height = if expanded { work_height } else { COLLAPSED_HEIGHT };
        let x = work_x + work_width - width;
        let y = if expanded {
            work_y
        } else {
            // 收起时按钮垂直居中，只占用按钮自身高度的区域
            work_y + (work_height - height) / 2.0
        };

        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));
    }
}

#[tauri::command]
pub fn set_collapsed_mode(window: WebviewWindow) -> Result<(), String> {
    position_window(&window, false);
    Ok(())
}

#[tauri::command]
pub fn set_expanded_mode(window: WebviewWindow) -> Result<(), String> {
    position_window(&window, true);
    Ok(())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AccountDto {
    pub id: Option<i64>,
    pub r#type: String,
    pub name: String,
    pub address: String,
    pub port: Option<i32>,
    pub username: String,
    pub password: String,
    pub remark: String,
    pub created_at: Option<i64>,
    pub updated_at: Option<i64>,
    pub used_at: Option<i64>,
}

impl From<Account> for AccountDto {
    fn from(a: Account) -> Self {
        Self {
            id: a.id,
            r#type: a.r#type,
            name: a.name,
            address: a.address,
            port: a.port,
            username: a.username,
            password: a.password,
            remark: a.remark,
            created_at: a.created_at,
            updated_at: a.updated_at,
            used_at: a.used_at,
        }
    }
}

impl From<AccountDto> for Account {
    fn from(a: AccountDto) -> Self {
        Self {
            id: a.id,
            r#type: a.r#type,
            name: a.name,
            address: a.address,
            port: a.port,
            username: a.username,
            password: a.password,
            remark: a.remark,
            created_at: a.created_at,
            updated_at: a.updated_at,
            used_at: a.used_at,
        }
    }
}

#[tauri::command]
pub fn check_initialized() -> Result<bool, String> {
    db::has_master_password().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn setup_master_password(password: String, state: State<CryptoState>) -> Result<(), String> {
    if password.len() < 6 {
        return Err("主密码长度不能少于 6 位".into());
    }

    let mut salt = vec![0u8; 16];
    rand::thread_rng().fill_bytes(&mut salt);
    let verifier = crypto::hash_master_password(&password).map_err(|e| e.to_string())?;

    db::set_master_password(salt.clone(), verifier).map_err(|e| e.to_string())?;

    let key = crypto::derive_key(&password, &salt);
    *state.key.lock().unwrap() = Some(key);
    Ok(())
}

#[tauri::command]
pub fn verify_master_password(password: String, state: State<CryptoState>) -> Result<bool, String> {
    let (salt, verifier) = match db::get_master_key().map_err(|e| e.to_string())? {
        Some(data) => data,
        None => return Ok(false),
    };

    let valid = crypto::verify_master_password(&password, &verifier).map_err(|e| e.to_string())?;
    if valid {
        let key = crypto::derive_key(&password, &salt);
        *state.key.lock().unwrap() = Some(key);
    }
    Ok(valid)
}

#[tauri::command]
pub fn lock(state: State<CryptoState>) -> Result<(), String> {
    *state.key.lock().unwrap() = None;
    Ok(())
}

fn get_key(state: &State<CryptoState>) -> Result<[u8; 32], String> {
    let key_ref = state
        .key
        .lock()
        .unwrap()
        .as_ref()
        .ok_or_else(|| "未解锁")?
        .clone();
    Ok(key_ref)
}

#[tauri::command]
pub async fn create_account(
    account: AccountDto,
    state: State<'_, CryptoState>,
) -> Result<i64, String> {
    let key = get_key(&state)?;
    let mut account: Account = account.into();
    account.password = crypto::encrypt_with_key(&account.password, &key).map_err(|e| e.to_string())?;

    db::insert_account(&account).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_account(
    account: AccountDto,
    state: State<'_, CryptoState>,
) -> Result<(), String> {
    let key = get_key(&state)?;
    let mut account: Account = account.into();
    account.password = crypto::encrypt_with_key(&account.password, &key).map_err(|e| e.to_string())?;

    db::update_account(&account).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_account(id: i64) -> Result<(), String> {
    db::delete_account(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_accounts(
    account_type: Option<String>,
    keyword: Option<String>,
    state: State<'_, CryptoState>,
) -> Result<Vec<AccountDto>, String> {
    let key = get_key(&state)?;
    let accounts = db::list_accounts(account_type, keyword).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for mut account in accounts {
        account.password = crypto::decrypt_with_key(&account.password, &key).unwrap_or_default();
        result.push(account.into());
    }
    Ok(result)
}

#[tauri::command]
pub async fn get_account(id: i64, state: State<'_, CryptoState>) -> Result<Option<AccountDto>, String> {
    let key = get_key(&state)?;
    let account = db::get_account(id).map_err(|e| e.to_string())?;
    Ok(account.map(|mut a| {
        a.password = crypto::decrypt_with_key(&a.password, &key).unwrap_or_default();
        a.into()
    }))
}

#[tauri::command]
pub async fn touch_account(id: i64) -> Result<(), String> {
    db::update_used_at(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_setting(key: String) -> Result<Option<String>, String> {
    db::get_setting(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_setting(key: String, value: String) -> Result<(), String> {
    db::set_setting(&key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn exit_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

/// 根据账号类型和配置的工具路径，启动对应的外部工具。
#[tauri::command]
pub async fn launch_account_tool(account: AccountDto, app: AppHandle) -> Result<(), String> {
    let host = account.address.trim();
    if host.is_empty() {
        return Err("地址不能为空".into());
    }

    // 从设置中读取该类型配置的工具路径
    let tool_path = db::get_setting("account_types")
        .map_err(|e| e.to_string())?
        .and_then(|json| serde_json::from_str::<Vec<serde_json::Value>>(&json).ok())
        .and_then(|types| {
            types.into_iter().find(|t| {
                t.get("value").and_then(|v| v.as_str()) == Some(&account.r#type)
            })
        })
        .and_then(|t| t.get("toolPath").and_then(|v| v.as_str()).map(String::from))
        .unwrap_or_default();

    match account.r#type.as_str() {
        "website" => {
            let url = if host.starts_with("http://") || host.starts_with("https://") {
                host.to_string()
            } else {
                format!("https://{}", host)
            };
            app.shell().open(&url, None).map_err(|e| e.to_string())?;
        }

        "ssh" => {
            let port = account.port.unwrap_or(22);
            let target = format!("{}@{}", account.username, host);
            if !tool_path.is_empty() {
                // 自定义工具：按空格拆分，例如 "putty -ssh {username}@{host} -P {port}"
                let cmd = tool_path
                    .replace("{host}", host)
                    .replace("{port}", &port.to_string())
                    .replace("{username}", &account.username)
                    .replace("{password}", &account.password);
                run_command(&cmd)?;
            } else {
                std::process::Command::new("ssh")
                    .args(["-p", &port.to_string(), &target])
                    .spawn()
                    .map_err(|e| format!("启动 SSH 失败：{}", e))?;
            }
        }

        "sftp" => {
            let port = account.port.unwrap_or(22);
            if !tool_path.is_empty() {
                let cmd = tool_path
                    .replace("{host}", host)
                    .replace("{port}", &port.to_string())
                    .replace("{username}", &account.username)
                    .replace("{password}", &account.password);
                run_command(&cmd)?;
            } else {
                return Err("SFTP 类型需要先在分类设置中配置工具路径".into());
            }
        }

        "windows" | "rdp" => {
            let port = account.port.unwrap_or(3389);
            if !tool_path.is_empty() {
                let cmd = tool_path
                    .replace("{host}", host)
                    .replace("{port}", &port.to_string())
                    .replace("{username}", &account.username)
                    .replace("{password}", &account.password);
                run_command(&cmd)?;
            } else {
                std::process::Command::new("mstsc")
                    .arg(format!("/v:{}:{}", host, port))
                    .spawn()
                    .map_err(|e| format!("启动远程桌面失败：{}", e))?;
            }
        }

        _ => {
            if tool_path.is_empty() {
                return Err("未配置该类型对应的工具路径".into());
            }
            let cmd = tool_path
                .replace("{host}", host)
                .replace("{port}", &account.port.map(|p| p.to_string()).unwrap_or_default())
                .replace("{username}", &account.username)
                .replace("{password}", &account.password);
            run_command(&cmd)?;
        }
    }

    Ok(())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CsvColumnMapping {
    pub name: Option<String>,
    pub address: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub remark: Option<String>,
    pub account_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CsvParseResult {
    pub headers: Vec<String>,
    pub preview: Vec<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CsvImportResult {
    pub imported: usize,
    pub skipped: usize,
    pub errors: Vec<String>,
}

fn read_csv_text(path: &str) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("读取 CSV 文件失败：{}", e))?;
    decode_csv_bytes(&bytes)
}

fn decode_csv_bytes(bytes: &[u8]) -> Result<String, String> {
    // 去除 UTF-8 BOM
    let bytes = if bytes.starts_with(b"\xef\xbb\xbf") {
        &bytes[3..]
    } else {
        bytes
    };

    // 优先按 UTF-8 解码
    if let Ok(text) = std::str::from_utf8(bytes) {
        return Ok(text.to_string());
    }

    // UTF-8 失败则回退到 GB18030（兼容 GBK）
    let (cow, _, had_errors) = encoding_rs::GB18030.decode(bytes);
    if had_errors {
        return Err("CSV 文件编码无法识别，请保存为 UTF-8 或 GB18030/GBK".into());
    }
    Ok(cow.into_owned())
}

#[tauri::command]
pub fn parse_csv_headers(path: String) -> Result<CsvParseResult, String> {
    let text = read_csv_text(&path)?;
    let mut reader = csv::Reader::from_reader(text.as_bytes());
    let headers: Vec<String> = reader
        .headers()
        .map_err(|e| format!("读取列头失败：{}", e))?
        .iter()
        .map(|h| h.trim().to_string())
        .collect();

    let mut preview = Vec::new();
    for record in reader.records().take(8) {
        let record = record.map_err(|e| format!("读取行失败：{}", e))?;
        preview.push(record.iter().map(|v| v.to_string()).collect());
    }

    Ok(CsvParseResult { headers, preview })
}

#[tauri::command]
pub async fn import_accounts_from_csv(
    path: String,
    mapping: CsvColumnMapping,
    state: State<'_, CryptoState>,
) -> Result<CsvImportResult, String> {
    let key = get_key(&state)?;
    let text = read_csv_text(&path)?;
    let mut reader = csv::Reader::from_reader(text.as_bytes());
    let headers: Vec<String> = reader
        .headers()
        .map_err(|e| format!("读取列头失败：{}", e))?
        .iter()
        .map(|h| h.trim().to_string())
        .collect();

    let col_index = |name: &Option<String>| -> Option<usize> {
        name.as_ref()
            .and_then(|n| headers.iter().position(|h| h == n))
    };

    let name_idx = col_index(&mapping.name);
    let address_idx = col_index(&mapping.address);
    let username_idx = col_index(&mapping.username);
    let password_idx = col_index(&mapping.password);
    let remark_idx = col_index(&mapping.remark);

    let mut imported = 0usize;
    let mut skipped = 0usize;
    let mut errors = Vec::new();

    for (row_num, record) in reader.records().enumerate() {
        let row_idx = row_num + 2; // CSV 行号从 1 开始，第 1 行为列头
        let record = match record {
            Ok(r) => r,
            Err(e) => {
                errors.push(format!("第 {} 行读取失败：{}", row_idx, e));
                skipped += 1;
                continue;
            }
        };

        let get = |idx: Option<usize>| -> String {
            idx.map(|i| record.get(i).unwrap_or("").trim().to_string())
                .unwrap_or_default()
        };

        let name = get(name_idx);
        let address = get(address_idx);
        let username = get(username_idx);
        let password = get(password_idx);
        let remark = get(remark_idx);

        if name.is_empty() && username.is_empty() && address.is_empty() {
            skipped += 1;
            continue;
        }

        let encrypted_password = crypto::encrypt_with_key(&password, &key).map_err(|e| e.to_string())?;

        let account = db::Account {
            id: None,
            r#type: mapping.account_type.clone(),
            name,
            address,
            port: None,
            username,
            password: encrypted_password,
            remark,
            created_at: None,
            updated_at: None,
            used_at: None,
        };

        match db::insert_account(&account) {
            Ok(_) => imported += 1,
            Err(e) => {
                errors.push(format!("第 {} 行写入失败：{}", row_idx, e));
                skipped += 1;
            }
        }
    }

    Ok(CsvImportResult { imported, skipped, errors })
}

#[tauri::command]
pub async fn export_accounts_to_csv(
    path: String,
    state: State<'_, CryptoState>,
) -> Result<usize, String> {
    use std::io::Write;

    let key = get_key(&state)?;
    let accounts = db::list_accounts(None, None).map_err(|e| e.to_string())?;

    let mut file = std::fs::File::create(&path).map_err(|e| format!("创建 CSV 文件失败：{}", e))?;
    file.write_all(b"\xef\xbb\xbf")
        .map_err(|e| format!("写入文件头失败：{}", e))?;
    let mut writer = csv::Writer::from_writer(file);
    writer
        .write_record(&["type", "name", "address", "username", "password", "remark"])
        .map_err(|e| format!("写入列头失败：{}", e))?;

    let mut exported = 0usize;
    for account in accounts {
        let password = crypto::decrypt_with_key(&account.password, &key).unwrap_or_default();
        writer
            .write_record(&[
                &account.r#type,
                &account.name,
                &account.address,
                &account.username,
                &password,
                &account.remark,
            ])
            .map_err(|e| format!("写入行失败：{}", e))?;
        exported += 1;
    }

    writer.flush().map_err(|e| format!("刷新文件失败：{}", e))?;
    Ok(exported)
}

fn run_command(cmd: &str) -> Result<(), String> {
    let parts: Vec<&str> = cmd.split_whitespace().collect();
    if parts.is_empty() {
        return Err("工具路径无效".into());
    }
    std::process::Command::new(parts[0])
        .args(&parts[1..])
        .spawn()
        .map_err(|e| format!("启动工具失败：{}", e))?;
    Ok(())
}
