import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import type { Account } from './types';

const currentWindow = getCurrentWebviewWindow();

export async function setCollapsedMode(): Promise<void> {
  return invoke('set_collapsed_mode');
}

export async function setExpandedMode(): Promise<void> {
  return invoke('set_expanded_mode');
}

export function onToggleExpand(callback: () => void) {
  return currentWindow.listen('toggle-expand', callback);
}

export async function checkInitialized(): Promise<boolean> {
  return invoke('check_initialized');
}

export async function setupMasterPassword(password: string): Promise<void> {
  return invoke('setup_master_password', { password });
}

export async function verifyMasterPassword(password: string): Promise<boolean> {
  return invoke('verify_master_password', { password });
}

export async function lock(): Promise<void> {
  return invoke('lock');
}

export async function createAccount(account: Account): Promise<number> {
  return invoke('create_account', { account });
}

export async function updateAccount(account: Account): Promise<void> {
  return invoke('update_account', { account });
}

export async function deleteAccount(id: number): Promise<void> {
  return invoke('delete_account', { id });
}

export async function listAccounts(type?: string, keyword?: string): Promise<Account[]> {
  return invoke('list_accounts', { accountType: type, keyword });
}

export async function getAccount(id: number): Promise<Account | null> {
  return invoke('get_account', { id });
}

export async function touchAccount(id: number): Promise<void> {
  return invoke('touch_account', { id });
}

export async function writeClipboard(text: string): Promise<void> {
  return writeText(text);
}

export async function getSetting(key: string): Promise<string | null> {
  return invoke('get_setting', { key });
}

export async function setSetting(key: string, value: string): Promise<void> {
  return invoke('set_setting', { key, value });
}

export async function exitApp(): Promise<void> {
  return invoke('exit_app');
}

export async function launchAccountTool(account: Account): Promise<void> {
  return invoke('launch_account_tool', { account });
}
