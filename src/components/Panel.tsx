import { useState, useEffect, useCallback } from 'react';
import type { Account } from '../types';
import * as api from '../api';
import { AccountList } from './AccountList';
import { AccountForm } from './AccountForm';
import { SettingsModal, type AccountTypeOption } from './SettingsModal';

const DEFAULT_TYPE_FILTERS: AccountTypeOption[] = [
  { value: 'website', label: '站点' },
  { value: 'ssh', label: 'SSH' },
  { value: 'windows', label: 'Windows' },
];

interface PanelProps {
  onCollapse: () => void;
  onLock: () => Promise<void>;
}

export function Panel({ onCollapse, onLock }: PanelProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [message, setMessage] = useState('');
  const [typeFilters, setTypeFilters] = useState<AccountTypeOption[]>(DEFAULT_TYPE_FILTERS);
  const [showSettings, setShowSettings] = useState(false);

  const filters = [{ value: 'all', label: '全部' }, ...typeFilters];

  const loadAccounts = useCallback(async () => {
    try {
      const data = await api.listAccounts(filter === 'all' ? undefined : filter, keyword || undefined);
      setAccounts(data);
    } catch (err) {
      console.error(err);
    }
  }, [filter, keyword]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const timer = setTimeout(() => loadAccounts(), 200);
    return () => clearTimeout(timer);
  }, [keyword, loadAccounts]);

  useEffect(() => {
    api.getSetting('account_types').then((value) => {
      if (value) {
        try {
          const parsed = JSON.parse(value) as AccountTypeOption[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTypeFilters(parsed);
          }
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const handleCopy = async (text: string) => {
    await api.writeClipboard(text);
    showMessage('已复制到剪贴板');
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  };

  const handleSave = async (account: Account) => {
    try {
      if (account.id) {
        await api.updateAccount(account);
      } else {
        await api.createAccount(account);
      }
      setShowForm(false);
      setEditingAccount(null);
      loadAccounts();
      showMessage('保存成功');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = async (account: Account) => {
    if (!account.id) return;
    try {
      await api.deleteAccount(account.id);
      loadAccounts();
      showMessage('删除成功');
    } catch (err) {
      showMessage('删除失败');
    }
  };

  const handleShare = async (account: Account) => {
    const typeLabel = typeFilters.find((t) => t.value === account.type)?.label || account.type;
    const lines = [
      `类型：${typeLabel}`,
      `名称：${account.name || '未命名'}`,
    ];
    if (account.address) lines.push(`${account.type === 'website' ? '地址' : '主机'}：${account.address}`);
    if (account.port) lines.push(`端口：${account.port}`);
    if (account.username) lines.push(`账号：${account.username}`);
    lines.push(`密码：${account.password}`);
    if (account.remark) lines.push(`备注：${account.remark}`);

    const text = lines.join('\n');
    await api.writeClipboard(text);
    showMessage('已复制完整信息');
  };

  const handleLaunch = async (account: Account) => {
    try {
      await api.launchAccountTool(account);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '打开工具失败');
    }
  };

  const handleClose = () => {
    onCollapse();
  };

  const handleLock = async () => {
    await onLock();
    handleClose();
  };

  const handleExit = async () => {
    await api.lock();
    await api.exitApp();
  };

  return (
    <div className="flex flex-col h-full w-full cyber-grid bg-cyber-bg border-l border-cyber-border shadow-[0_0_30px_rgba(0,0,0,0.6)]">
      {showForm ? (
        <AccountForm
          account={editingAccount}
          typeOptions={typeFilters.map((t) => t.value)}
          typeLabels={typeFilters}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingAccount(null);
          }}
        />
      ) : (
        <>
          <div
            className="flex items-center justify-between px-4 py-3 bg-cyber-panel border-b border-cyber-border shrink-0"
            data-tauri-drag-region
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center border border-cyber-cyan/60 bg-cyber-card shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <svg className="w-5 h-5 text-cyber-cyan drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-semibold text-white tracking-wide">密码管理器</h1>
                <p className="text-xs text-cyber-muted">{accounts.length} 条记录</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setEditingAccount(null); setShowForm(true); }}
                className="p-2 text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-card transition-colors"
                title="新增账号"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-card transition-colors"
                title="分类设置"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleLock}
                className="p-2 text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-card transition-colors"
                title="锁定"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
              <button
                onClick={handleExit}
                className="p-2 text-cyber-muted hover:text-cyber-danger hover:bg-cyber-card transition-colors"
                title="退出应用"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-5 py-3 space-y-3 border-b border-cyber-border bg-cyber-panel/40 shrink-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索名称、地址、账号、备注..."
                className="w-full pl-9 pr-4 py-2.5 bg-cyber-card border border-cyber-border text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {filters.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`px-3 py-1.5 text-xs font-semibold tracking-wide transition-all border ${
                    filter === item.value
                      ? 'bg-cyber-cyan/15 border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-cyber-card border-cyber-border text-cyber-muted hover:text-white hover:border-cyber-cyan/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <AccountList
              accounts={accounts}
              typeLabels={typeFilters}
              onSelect={(account) => {
                if (account.id) api.touchAccount(account.id);
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
              onCopy={handleCopy}
              onLaunch={handleLaunch}
            />
          </div>

          <div className="px-4 py-3 bg-cyber-panel border-t border-cyber-border shrink-0">
            <button
              onClick={() => { setEditingAccount(null); setShowForm(true); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyber-cyan/10 border border-cyber-cyan/60 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 hover:border-cyber-cyan hover:shadow-[0_0_16px_rgba(0,240,255,0.3)] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增
            </button>
          </div>
        </>
      )}

      {message && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyber-cyan/15 border border-cyber-cyan text-cyber-cyan text-sm shadow-[0_0_16px_rgba(0,240,255,0.3)]">
          {message}
        </div>
      )}

      {showSettings && (
        <SettingsModal
          types={typeFilters}
          onSave={(types) => {
            setTypeFilters(types);
            setFilter('all');
          }}
          onClose={() => setShowSettings(false)}
          onImport={loadAccounts}
        />
      )}
    </div>
  );
}
