import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import * as api from '../api';

export interface AccountTypeOption {
  value: string;
  label: string;
  toolPath?: string;
}

interface SettingsModalProps {
  types: AccountTypeOption[];
  onSave: (types: AccountTypeOption[]) => void;
  onClose: () => void;
}

const DEFAULT_TYPES: AccountTypeOption[] = [
  { value: 'website', label: '站点', toolPath: '' },
  { value: 'ssh', label: 'SSH', toolPath: '' },
  { value: 'windows', label: 'Windows', toolPath: '' },
];

export function SettingsModal({ types, onSave, onClose }: SettingsModalProps) {
  const [list, setList] = useState<AccountTypeOption[]>([]);

  useEffect(() => {
    setList(types.length > 0 ? [...types] : [...DEFAULT_TYPES]);
  }, [types]);

  const handleChange = (index: number, field: keyof AccountTypeOption, value: string) => {
    setList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const pickExecutable = async (index: number) => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Executable', extensions: ['exe'] }],
      });
      const path = Array.isArray(selected) ? selected[0] : selected;
      if (path) {
        handleChange(index, 'toolPath', path);
      }
    } catch {
      // ignore cancellation
    }
  };

  const fillMstsc = (index: number) => {
    handleChange(index, 'toolPath', 'C:\\Windows\\System32\\mstsc.exe');
  };

  const handleAdd = () => {
    setList((prev) => [...prev, { value: '', label: '' }]);
  };

  const handleRemove = (index: number) => {
    setList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setList([...DEFAULT_TYPES]);
  };

  const handleSave = async () => {
    const valid = list
      .map((item) => ({
        value: item.value.trim().toLowerCase().replace(/\s+/g, '_'),
        label: item.label.trim(),
        toolPath: (item.toolPath || '').trim(),
      }))
      .filter((item) => item.value && item.label);

    const unique: AccountTypeOption[] = [];
    const seen = new Set<string>();
    for (const item of valid) {
      if (!seen.has(item.value)) {
        seen.add(item.value);
        unique.push(item);
      }
    }

    await api.setSetting('account_types', JSON.stringify(unique));
    onSave(unique);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-sm mx-4 border border-cyber-border bg-cyber-panel shadow-[0_0_30px_rgba(0,0,0,0.8)] max-h-[90%] flex flex-col">
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-cyber-cyan" />
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-cyber-cyan" />
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-cyber-cyan" />
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-cyber-cyan" />

        <div className="flex items-center justify-between px-5 py-3 border-b border-cyber-border shrink-0">
          <h2 className="text-base font-semibold text-white tracking-wide">分类设置</h2>
          <button
            onClick={onClose}
            className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {list.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => handleChange(index, 'value', e.target.value)}
                  placeholder="标识"
                  className="flex-1 min-w-0 px-3 py-2 bg-cyber-card border border-cyber-border text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan transition-all"
                />
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => handleChange(index, 'label', e.target.value)}
                  placeholder="显示名"
                  className="flex-1 min-w-0 px-3 py-2 bg-cyber-card border border-cyber-border text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan transition-all"
                />
                <button
                  onClick={() => handleRemove(index)}
                  className="p-2 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-danger hover:border-cyber-danger/50 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.toolPath || ''}
                  onChange={(e) => handleChange(index, 'toolPath', e.target.value)}
                  placeholder="工具路径或命令（可选，留空使用默认）"
                  className="flex-1 min-w-0 px-3 py-2 bg-cyber-card border border-cyber-border text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan transition-all"
                />
                <button
                  type="button"
                  onClick={() => pickExecutable(index)}
                  className="p-2 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors shrink-0"
                  title="选择程序"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </button>
                {item.value === 'windows' && (
                  <button
                    type="button"
                    onClick={() => fillMstsc(index)}
                    className="px-2 py-2 border border-cyber-border bg-cyber-card text-xs text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors shrink-0"
                    title="自动填入 mstsc"
                  >
                    mstsc
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-cyber-border text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加分类
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-cyber-border shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-white hover:border-cyber-cyan/50 transition-colors text-sm"
          >
            重置
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-white hover:border-cyber-cyan/50 transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-cyber-cyan/10 border border-cyber-cyan/60 text-cyber-cyan font-semibold hover:bg-cyber-cyan/20 hover:border-cyber-cyan transition-all text-sm"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
