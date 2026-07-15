# Remember Password Manager

[English README](README.en.md)

一款基于 Tauri + React + SQLite 的跨平台本地密码管理器。

## 功能特性

- 半透明悬浮按钮常驻桌面右侧，点击呼出侧边维护面板
- 支持站点地址、SSH 主机、SFTP、Windows 远程桌面等多种账号密码管理
- 本地 SQLite 数据库，AES-256-GCM 加密存储密码
- 主密码保护，支持锁定
- 搜索、筛选、一键复制账号 / 密码 / 地址
- 根据账号类型一键启动对应外部工具：浏览器、SSH 客户端、SFTP 客户端、mstsc 等
- 分类设置支持自定义类型与外部工具路径
- 随机密码生成
- 界面简洁美观，无 emoji

## 技术栈

- 桌面框架：Tauri 2.x
- 前端：React 19 + TypeScript + Tailwind CSS 3
- 后端：Rust
- 数据库：SQLite（rusqlite）
- 加密：Argon2id + AES-256-GCM

## 开发环境要求

- Node.js >= 20
- Rust >= 1.70
- Visual Studio 2022 Build Tools（含 C++ 桌面开发工作负载）或 Visual Studio 2022（C++ 组件）
- WebView2（Windows 10/11 通常已自带）

## 安装依赖

```bash
cd remember-password-manager
npm install
```

## 开发运行

```bash
npm run tauri:dev
```

## 构建安装包

```bash
npm run tauri:build
```

构建完成后，安装包位于：

```
src-tauri/target/release/bundle/nsis/RememberPasswordManager_1.0.0_x64-setup.exe
```

可执行程序位于：

```
src-tauri/target/release/RememberPasswordManager.exe
```

## GitHub Actions 自动构建

推送 `v*` 标签即可触发 GitHub Actions，自动构建 Windows、Linux、macOS 安装包：

```bash
git tag v0.0.2
git push origin v0.0.2
```

构建结果会作为 Draft Release 上传到 GitHub Releases 页面。

## 数据存储位置

数据库文件默认存储在：

```
%APPDATA%\RememberPasswordManager\data.db
```

## 安全说明

- 主密码使用 Argon2id 哈希存储验证数据，不保存明文密码。
- 账号密码使用 AES-256-GCM 加密，密钥由主密码通过 Argon2id 派生。
- 所有数据均存储在本地，不进行任何云端同步。
- 请牢记主密码，遗忘后将无法恢复数据。

## 许可证

[MIT](LICENSE)
