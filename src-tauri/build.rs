fn main() {
    // 从项目根目录的 version.properties 读取版本号
    if let Ok(version_props) = std::fs::read_to_string("../version.properties") {
        for line in version_props.lines() {
            if line.starts_with("VERSION=") {
                let version = line.trim_start_matches("VERSION=").trim();
                // 设置环境变量供 Cargo.toml 使用
                println!("cargo:rustc-env=CARGO_PKG_VERSION={}", version);
                // 同时设置 CARGO_PKG_VERSION 环境变量
                std::env::set_var("CARGO_PKG_VERSION", version);
                break;
            }
        }
    }
    
    tauri_build::build()
}
