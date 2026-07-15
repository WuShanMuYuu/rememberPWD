use chrono::Utc;
use dirs::data_dir;
use once_cell::sync::OnceCell;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

static DB_CONN: OnceCell<Mutex<Connection>> = OnceCell::new();

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Account {
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

pub fn db_path() -> PathBuf {
    let mut path = data_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("RememberPasswordManager");
    std::fs::create_dir_all(&path).ok();
    path.push("data.db");
    path
}

pub fn init_db() -> SqlResult<()> {
    let conn = Connection::open(db_path())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            address TEXT NOT NULL DEFAULT '',
            port INTEGER,
            username TEXT NOT NULL DEFAULT '',
            password TEXT NOT NULL DEFAULT '',
            remark TEXT NOT NULL DEFAULT '',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            used_at INTEGER
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS master_key (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            salt BLOB NOT NULL,
            verifier TEXT NOT NULL
        )",
        [],
    )?;

    DB_CONN.set(Mutex::new(conn)).ok();
    Ok(())
}

fn conn() -> std::sync::MutexGuard<'static, Connection> {
    DB_CONN.get().unwrap().lock().unwrap()
}

pub fn has_master_password() -> SqlResult<bool> {
    let conn = conn();
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM master_key")?;
    let count: i64 = stmt.query_row([], |row| row.get(0))?;
    Ok(count > 0)
}

pub fn get_master_key() -> SqlResult<Option<(Vec<u8>, String)>> {
    let conn = conn();
    let mut stmt = conn.prepare("SELECT salt, verifier FROM master_key LIMIT 1")?;
    let result = stmt.query_row([], |row| {
        let salt: Vec<u8> = row.get(0)?;
        let verifier: String = row.get(1)?;
        Ok((salt, verifier))
    });
    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn set_master_password(salt: Vec<u8>, verifier: String) -> SqlResult<()> {
    let conn = conn();
    conn.execute(
        "INSERT INTO master_key (id, salt, verifier) VALUES (1, ?1, ?2)
         ON CONFLICT(id) DO UPDATE SET salt = ?1, verifier = ?2",
        params![salt, verifier],
    )?;
    Ok(())
}

pub fn insert_account(account: &Account) -> SqlResult<i64> {
    let now = Utc::now().timestamp();
    let conn = conn();
    conn.execute(
        "INSERT INTO accounts (type, name, address, port, username, password, remark, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            account.r#type,
            account.name,
            account.address,
            account.port,
            account.username,
            account.password,
            account.remark,
            now,
            now
        ],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn update_account(account: &Account) -> SqlResult<()> {
    let now = Utc::now().timestamp();
    let conn = conn();
    conn.execute(
        "UPDATE accounts SET type = ?1, name = ?2, address = ?3, port = ?4,
         username = ?5, password = ?6, remark = ?7, updated_at = ?8
         WHERE id = ?9",
        params![
            account.r#type,
            account.name,
            account.address,
            account.port,
            account.username,
            account.password,
            account.remark,
            now,
            account.id.unwrap_or(0)
        ],
    )?;
    Ok(())
}

pub fn delete_account(id: i64) -> SqlResult<()> {
    let conn = conn();
    conn.execute("DELETE FROM accounts WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_account(id: i64) -> SqlResult<Option<Account>> {
    let conn = conn();
    let mut stmt = conn.prepare(
        "SELECT id, type, name, address, port, username, password, remark, created_at, updated_at, used_at
         FROM accounts WHERE id = ?1"
    )?;
    let result = stmt.query_row(params![id], map_account);
    match result {
        Ok(account) => Ok(Some(account)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn list_accounts(account_type: Option<String>, keyword: Option<String>) -> SqlResult<Vec<Account>> {
    let conn = conn();
    let mut sql = String::from(
        "SELECT id, type, name, address, port, username, password, remark, created_at, updated_at, used_at
         FROM accounts WHERE 1=1"
    );
    let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(t) = account_type {
        if !t.is_empty() && t != "all" {
            sql.push_str(" AND type = ?");
            query_params.push(Box::new(t));
        }
    }

    if let Some(k) = keyword {
        if !k.is_empty() {
            let pattern = format!("%{}%", k);
            sql.push_str(" AND (name LIKE ? OR address LIKE ? OR username LIKE ? OR remark LIKE ?)");
            query_params.push(Box::new(pattern.clone()));
            query_params.push(Box::new(pattern.clone()));
            query_params.push(Box::new(pattern.clone()));
            query_params.push(Box::new(pattern));
        }
    }

    sql.push_str(" ORDER BY used_at DESC, updated_at DESC");

    let mut stmt = conn.prepare(&sql)?;
    let params_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(params_refs.as_slice(), map_account)?;

    let mut accounts = Vec::new();
    for row in rows {
        accounts.push(row?);
    }
    Ok(accounts)
}

fn map_account(row: &rusqlite::Row) -> SqlResult<Account> {
    Ok(Account {
        id: row.get(0)?,
        r#type: row.get(1)?,
        name: row.get(2)?,
        address: row.get(3)?,
        port: row.get(4)?,
        username: row.get(5)?,
        password: row.get(6)?,
        remark: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
        used_at: row.get(10)?,
    })
}

pub fn update_used_at(id: i64) -> SqlResult<()> {
    let now = Utc::now().timestamp();
    let conn = conn();
    conn.execute(
        "UPDATE accounts SET used_at = ?1 WHERE id = ?2",
        params![now, id],
    )?;
    Ok(())
}

pub fn get_setting(key: &str) -> SqlResult<Option<String>> {
    let conn = conn();
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
    let result = stmt.query_row(params![key], |row| row.get(0));
    match result {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn set_setting(key: &str, value: &str) -> SqlResult<()> {
    let conn = conn();
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = ?2",
        params![key, value],
    )?;
    Ok(())
}
