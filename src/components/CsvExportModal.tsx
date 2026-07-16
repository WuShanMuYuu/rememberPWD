import { useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import * as api from '../api';

interface CsvExportModalProps {
  onClose: () => void;
}

export function CsvExportModal({ onClose }: CsvExportModalProps) {
  const [path, setPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const pickPath = async () => {
    try {
      const selected = await save({
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      });
      if (selected) {
        setPath(selected);
        setError(null);
        setCount(null);
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const handleExport = async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    setCount(null);

    try {
      const exported = await api.exportAccountsToCsv(path);
      setCount(exported);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-lg mx-4 border border-cyber-border bg-cyber-panel shadow-[0_0_30px_rgba(0,0,0,0.8)] max-h-[92%] flex flex-col">
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-cyber-cyan" />
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-cyber-cyan" />
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-cyber-cyan" />
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-cyber-cyan" />

        <div className="flex items-center justify-between px-5 py-3 border-b border-cyber-border shrink-0">
          <h2 className="text-base font-semibold text-white tracking-wide">导出 CSV</h2>
          <button
            onClick={onClose}
            className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="px-3 py-2 border border-cyber-warning/50 bg-cyber-warning/10 text-cyber-warning text-sm">
            注意：导出的 CSV 将包含明文密码，请妥善保管并在使用完毕后及时删除。
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-cyber-muted">保存位置</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={path || '尚未选择保存位置'}
                className="flex-1 min-w-0 px-3 py-2 bg-cyber-card border border-cyber-border text-sm text-white placeholder-cyber-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={pickPath}
                disabled={loading}
                className="px-3 py-2 border border-cyber-border bg-cyber-card text-sm text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors disabled:opacity-50"
              >
                选择位置
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white">导出列</h3>
            <p className="text-xs text-cyber-muted">type, name, address, username, password, remark</p>
          </div>

          {error && (
            <div className="px-3 py-2 border border-cyber-danger/50 bg-cyber-danger/10 text-cyber-danger text-sm">
              {error}
            </div>
          )}

          {count !== null && (
            <div className="px-3 py-2 border border-cyber-success/50 bg-cyber-success/10 text-cyber-success text-sm">
              导出完成：共 {count} 条账号密码已保存到 CSV。
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-cyber-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-white hover:border-cyber-cyan/50 transition-colors text-sm"
          >
            关闭
          </button>
          <button
            onClick={handleExport}
            disabled={!path || loading}
            className="flex-1 py-2 bg-cyber-cyan/10 border border-cyber-cyan/60 text-cyber-cyan font-semibold hover:bg-cyber-cyan/20 hover:border-cyber-cyan transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '导出中...' : '开始导出'}
          </button>
        </div>
      </div>
    </div>
  );
}
