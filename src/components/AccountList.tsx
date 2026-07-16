import { useState } from 'react';
import type { Account } from '../types';
import type { AccountTypeOption } from './SettingsModal';
import { ConfirmModal } from './ConfirmModal';

interface AccountListProps {
  accounts: Account[];
  selectedId?: number;
  typeLabels?: AccountTypeOption[];
  onSelect: (account: Account) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onShare: (account: Account) => void;
  onCopy: (text: string) => void;
  onLaunch: (account: Account) => void;
}

export function AccountList({ accounts, selectedId, typeLabels = [], onSelect, onEdit, onDelete, onShare, onCopy, onLaunch }: AccountListProps) {
  const [expandedId, setExpandedId] = useState<number | undefined>(selectedId);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const getTypeLabel = (value: string) => typeLabels.find((t) => t.value === value)?.label || value;
  const getTypeColor = (value: string) => {
    const v = value.toLowerCase();
    if (v === 'website') return 'border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/10';
    if (v === 'ssh') return 'border-cyber-success/50 text-cyber-success bg-cyber-success/10';
    if (v === 'sftp') return 'border-cyber-warning/50 text-cyber-warning bg-cyber-warning/10';
    if (v === 'windows' || v === 'rdp') return 'border-cyber-pink/50 text-cyber-pink bg-cyber-pink/10';
    return 'border-cyber-purple/50 text-cyber-purple bg-cyber-purple/10';
  };

  const getTypeIcon = (value: string) => {
    const v = value.toLowerCase();
    if (v === 'website') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
    }
    if (v === 'ssh') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (v === 'sftp') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      );
    }
    if (v === 'windows') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    if (v === 'rdp') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l4 4m0 0l-4 4m4-4H9" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    );
  };

  const handleToggle = (account: Account) => {
    const id = account.id!;
    if (expandedId === id) {
      setExpandedId(undefined);
    } else {
      setExpandedId(id);
      onSelect(account);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
    }
    setDeleteTarget(null);
  };

  const maskPassword = (password: string) => {
    return password ? '•'.repeat(Math.min(password.length, 12)) : '未设置';
  };

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-cyber-muted">
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">暂无账号密码记录</p>
        <p className="text-xs mt-1 opacity-70">点击下方新增按钮开始记录</p>
      </div>
    );
  }

  return (
    <div>
      {accounts.map((account) => {
        const isExpanded = expandedId === account.id;
        const typeLabel = getTypeLabel(account.type);

        return (
          <div key={account.id} className="group">
            <button
              onClick={() => handleToggle(account)}
              className="w-full px-5 py-4 flex items-center gap-3 hover:bg-cyber-card/60 transition-colors text-left"
            >
              <div className={`w-9 h-9 flex items-center justify-center text-xs font-semibold border ${getTypeColor(account.type)}`}>
                {getTypeIcon(account.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white truncate">{account.name}</h3>
                  <span className="text-xs px-1.5 py-0.5 border border-cyber-border bg-cyber-card text-cyber-muted">
                    {typeLabel}
                  </span>
                </div>
                <p className="text-xs text-cyber-muted truncate mt-0.5">
                  {account.username || account.address || '无额外信息'}
                </p>
              </div>

              <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onLaunch(account); }}
                    className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors"
                    title="打开"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(account); }}
                    className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors"
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onShare(account); }}
                    className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors"
                    title="分享"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(account); }}
                    className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-danger hover:border-cyber-danger/50 transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

              <svg
                className={`w-4 h-4 text-cyber-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="px-5 pb-4 pt-0 bg-cyber-card/30">
                <div className="space-y-3 pl-12">
                  {account.address && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-cyber-muted">
                          {account.type === 'website' ? '地址' : '主机'}
                        </p>
                        <p className="text-sm text-white truncate">{account.address}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCopy(account.address); }}
                        className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors shrink-0"
                        title="复制地址"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {account.port && (
                    <div>
                      <p className="text-xs text-cyber-muted">端口</p>
                      <p className="text-sm text-white">{account.port}</p>
                    </div>
                  )}

                  {account.username && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-cyber-muted">账号</p>
                        <p className="text-sm text-white truncate">{account.username}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCopy(account.username); }}
                        className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors shrink-0"
                        title="复制账号"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-cyber-muted">密码</p>
                      <p className="text-sm text-white font-mono truncate">{maskPassword(account.password)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onCopy(account.password); }}
                      className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors shrink-0"
                      title="复制密码"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>

                  {account.remark && (
                    <div>
                      <p className="text-xs text-cyber-muted">备注</p>
                      <p className="text-sm text-white whitespace-pre-wrap">{account.remark}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {deleteTarget && (
        <ConfirmModal
          title="确认删除"
          message={`确定要删除「${deleteTarget.name}」吗？此操作不可恢复。`}
          confirmText="删除"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
