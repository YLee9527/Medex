use crate::db;
use argon2::{Argon2, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher as _, PasswordVerifier as _, SaltString};

const PASSWORD_SETTING_KEY: &str = "app_password_hash";

#[tauri::command]
pub fn set_app_password(password: String) -> Result<(), String> {
    if password.len() < 6 || password.len() > 20 {
        return Err("Password length must be between 6 and 20 characters".into());
    }

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)
        .map_err(|err| format!("Failed to hash password: {}", err))?;

    db::set_setting(PASSWORD_SETTING_KEY, &password_hash.to_string()).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn verify_app_password(password: String) -> Result<bool, String> {
    let stored_hash = db::get_setting(PASSWORD_SETTING_KEY).map_err(|err| err.to_string())?;
    match stored_hash {
        Some(hash_str) => {
            let parsed_hash = PasswordHash::new(&hash_str)
                .map_err(|err| format!("Failed to parse hash: {}", err))?;
            let argon2 = Argon2::default();
            Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())
        },
        None => Ok(false),
    }
}

#[tauri::command]
pub fn app_password_exists() -> Result<bool, String> {
    let stored_hash = db::get_setting(PASSWORD_SETTING_KEY).map_err(|err| err.to_string())?;
    Ok(stored_hash.is_some())
}

#[tauri::command]
pub fn clear_app_password() -> Result<(), String> {
    db::remove_setting(PASSWORD_SETTING_KEY).map_err(|err| err.to_string())
}
