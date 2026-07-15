use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::{password_hash::SaltString, Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use rand::rngs::OsRng;
use rand::RngCore;
use std::sync::Mutex;

pub struct CryptoState {
    pub key: Mutex<Option<[u8; 32]>>,
}

impl CryptoState {
    pub fn new() -> Self {
        Self {
            key: Mutex::new(None),
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum CryptoError {
    #[error("密钥未初始化")]
    KeyNotSet,
    #[error("加密失败")]
    EncryptFailed,
    #[error("解密失败")]
    DecryptFailed,
    #[error("哈希验证失败")]
    HashVerifyFailed,
    #[error("哈希生成失败")]
    HashFailed,
}

pub fn hash_master_password(password: &str) -> Result<String, CryptoError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|_| CryptoError::HashFailed)?;
    Ok(password_hash.to_string())
}

pub fn verify_master_password(password: &str, hash: &str) -> Result<bool, CryptoError> {
    let parsed_hash = PasswordHash::new(hash).map_err(|_| CryptoError::HashVerifyFailed)?;
    let argon2 = Argon2::default();
    Ok(argon2
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

pub fn derive_key(password: &str, salt: &[u8]) -> [u8; 32] {
    let mut key = [0u8; 32];
    let argon2 = Argon2::default();
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .expect("密钥派生失败");
    key
}

pub fn encrypt_with_key(plaintext: &str, key: &[u8; 32]) -> Result<String, CryptoError> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| CryptoError::EncryptFailed)?;
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|_| CryptoError::EncryptFailed)?;

    let mut result = Vec::new();
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);

    Ok(base64::encode(result))
}

pub fn decrypt_with_key(ciphertext: &str, key: &[u8; 32]) -> Result<String, CryptoError> {
    let data = base64::decode(ciphertext).map_err(|_| CryptoError::DecryptFailed)?;
    if data.len() < 12 {
        return Err(CryptoError::DecryptFailed);
    }

    let (nonce_bytes, encrypted) = data.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| CryptoError::DecryptFailed)?;
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, encrypted)
        .map_err(|_| CryptoError::DecryptFailed)?;

    String::from_utf8(plaintext).map_err(|_| CryptoError::DecryptFailed)
}
