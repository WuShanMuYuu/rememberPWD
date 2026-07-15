# Remember Password Manager

[A Chinese README is also available](README.md)

A cross-platform local password manager built with Tauri, React, and SQLite.

## Features

- Semi-transparent floating button docked to the right side of the desktop; click to open the side maintenance panel
- Manage credentials for websites, SSH hosts, SFTP, Windows Remote Desktop, and custom types
- Local SQLite database with AES-256-GCM encrypted password storage
- Master password protection with lock support
- Search, filter, and one-click copy of username / password / address
- Launch external tools by account type: browser, SSH client, SFTP client, mstsc, etc.
- Category settings support custom types and external tool paths
- Random password generation
- Clean and elegant UI without emojis

## Tech Stack

- Desktop framework: Tauri 2.x
- Frontend: React 19 + TypeScript + Tailwind CSS 3
- Backend: Rust
- Database: SQLite (rusqlite)
- Encryption: Argon2id + AES-256-GCM

## Development Requirements

- Node.js >= 20
- Rust >= 1.70
- Visual Studio 2022 Build Tools (with C++ desktop development workload) or Visual Studio 2022 (C++ components)
- WebView2 (usually pre-installed on Windows 10/11)

## Install Dependencies

```bash
cd remember-password-manager
npm install
```

## Development

```bash
npm run tauri:dev
```

## Build Installer

```bash
npm run tauri:build
```

After the build completes, the installer is located at:

```
src-tauri/target/release/bundle/nsis/RememberPasswordManager_1.0.0_x64-setup.exe
```

The executable is located at:

```
src-tauri/target/release/RememberPasswordManager.exe
```

## GitHub Actions Automated Builds

Push a `v*` tag to trigger GitHub Actions, which will automatically build installers for Windows, Linux, and macOS:

```bash
git tag v0.0.2
git push origin v0.0.2
```

The build artifacts will be uploaded as a Draft Release on the GitHub Releases page.

## Data Storage Location

The database file is stored at:

```
%APPDATA%\RememberPasswordManager\data.db
```

## Security Notes

- The master password is hashed with Argon2id for verification; the plaintext password is never stored.
- Account passwords are encrypted with AES-256-GCM; the encryption key is derived from the master password via Argon2id.
- All data is stored locally; no cloud synchronization is performed.
- Please remember your master password. If you forget it, your data cannot be recovered.

## License

[MIT](LICENSE)
