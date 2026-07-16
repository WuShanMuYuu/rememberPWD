import { useState, useMemo } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import * as api from '../api';
import type { AccountTypeOption } from './SettingsModal';

interface CsvImportModalProps {
  typeOptions: string[];
  typeLabels: AccountTypeOption[];
  onClose: () => void;
  onImported: () => void;
}

const FIELD_DEFINITIONS = [
  { key: 'name', label: '名称', required: true },
  { key: 'address', label: '地址 / URL', required: true },
  { key: 'username', label: '账号 / 用户名', required: true },
  { key: 'password', label: '密码', required: false },
  { key: 'remark', label: '备注', required: false },
  { key: 'type', label: '类型（可选）', required: false },
] as const;

type FieldKey = (typeof FIELD_DEFINITIONS)[number]['key'];

const HEADER_ALIASES: Record<FieldKey, string[]> = {
  name: ['name', 'title', 'sitename', '站点名称', '名称', '名字'],
  address: ['url', 'address', 'host', 'website', '网址', '地址', '站点地址', '主机'],
  username: ['username', 'user', 'login', 'account', '账号', '用户名', '账户'],
  password: ['password', 'pass', 'pwd', '密码'],
  remark: ['remark', 'note', 'notes', 'comment', '备注', '说明'],
  type: ['type', 'kind', 'category', '类型', '分类'],
};

export function CsvImportModal({ typeOptions, typeLabels, onClose, onImported }: CsvImportModalProps) {
  const [path, setPath] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>(() => {
    const initial: Record<string, string> = {};
    for (const { key } of FIELD_DEFINITIONS) {
      initial[key] = '';
    }
    return initial as Record<FieldKey, string>;
  });
  const [defaultType, setDefaultType] = useState<string>(typeOptions[0] || 'website');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<api.CsvImportResult | null>(null);

  const getTypeLabel = (value: string) => typeLabels.find((t) => t.value === value)?.label || value;

  const guessMapping = (csvHeaders: string[]) => {
    const next: Record<string, string> = {};
    for (const { key } of FIELD_DEFINITIONS) {
      next[key] = '';
    }

    const lowerHeaders = csvHeaders.map((h) => h.toLowerCase().trim());

    for (const { key } of FIELD_DEFINITIONS) {
      const aliases = HEADER_ALIASES[key];
      for (const alias of aliases) {
        const idx = lowerHeaders.indexOf(alias.toLowerCase());
        if (idx >= 0) {
          next[key] = csvHeaders[idx];
          break;
        }
      }
    }

    return next as Record<FieldKey, string>;
  };

  const pickFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      });
      const filePath = Array.isArray(selected) ? selected[0] : selected;
      if (!filePath) return;

      setPath(filePath);
      setError(null);
      setResult(null);
      setHeaders([]);
      setPreview([]);

      const parsed = await api.parseCsvHeaders(filePath);
      setHeaders(parsed.headers);
      setPreview(parsed.preview);
      setMapping(guessMapping(parsed.headers));
    } catch (e) {
      setError(String(e));
    }
  };

  const handleMappingChange = (key: FieldKey, value: string) => {
    setMapping((prev) => ({ ...prev, [key]: value }));
  };

  const canImport = useMemo(() => {
    if (!path || headers.length === 0) return false;
    const hasName = mapping.name || mapping.address || mapping.username;
    return Boolean(hasName);
  }, [path, headers.length, mapping]);

  const handleImport = async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const csvMapping: api.CsvColumnMapping = {
        name: mapping.name || null,
        address: mapping.address || null,
        username: mapping.username || null,
        password: mapping.password || null,
        remark: mapping.remark || null,
        account_type: defaultType,
      };

      const res = await api.importAccountsFromCsv(path, csvMapping);
      setResult(res);
      if (res.imported > 0) {
        onImported();
      }
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
          <h2 className="text-base font-semibold text-white tracking-wide">导入 CSV</h2>
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
          <div className="space-y-2">
            <label className="block text-sm text-cyber-muted">CSV 文件</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={path || '尚未选择文件'}
                className="flex-1 min-w-0 px-3 py-2 bg-cyber-card border border-cyber-border text-sm text-white placeholder-cyber-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={pickFile}
                disabled={loading}
                className="px-3 py-2 border border-cyber-border bg-cyber-card text-sm text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors disabled:opacity-50"
              >
                选择文件
              </button>
            </div>
          </div>

          {headers.length > 0 && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">字段映射</h3>
                  <span className="text-xs text-cyber-muted">至少指定名称 / 地址 / 账号之一</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {FIELD_DEFINITIONS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-cyber-muted mb-1.5">{label}</label>
                      <select
                        value={mapping[key]}
                        onChange={(e) => handleMappingChange(key, e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-cyber-card border border-cyber-border text-sm text-white focus:outline-none focus:border-cyber-cyan transition-all appearance-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b8594'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1rem',
                        }}
                      >
                        <option value="" className="bg-cyber-card">-- 不导入 --</option>
                        {headers.map((h) => (
                          <option key={h} value={h} className="bg-cyber-card">
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-cyber-muted">默认账号类型</label>
                <select
                  value={defaultType}
                  onChange={(e) => setDefaultType(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-cyber-card border border-cyber-border text-sm text-white focus:outline-none focus:border-cyber-cyan transition-all appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b8594'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  {typeOptions.map((t) => (
                    <option key={t} value={t} className="bg-cyber-card">
                      {getTypeLabel(t)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-cyber-muted">
                  当 CSV 中未映射「类型」列时，所有记录将使用该类型。
                </p>
              </div>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white">预览（前 {preview.length} 行）</h3>
                  <div className="overflow-x-auto border border-cyber-border">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-cyber-card text-cyber-muted">
                        <tr>
                          {headers.map((h) => (
                            <th key={h} className="px-3 py-2 border-b border-cyber-border whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-b border-cyber-border last:border-b-0">
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-white whitespace-nowrap max-w-[8rem] truncate">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="px-3 py-2 border border-cyber-danger/50 bg-cyber-danger/10 text-cyber-danger text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="px-3 py-2 border border-cyber-success/50 bg-cyber-success/10 text-cyber-success text-sm">
                导入完成：成功 {result.imported} 条，跳过 {result.skipped} 条。
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto border border-cyber-border bg-cyber-card p-2 space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-cyber-danger">{err}</p>
                  ))}
                </div>
              )}
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
            onClick={handleImport}
            disabled={!canImport || loading}
            className="flex-1 py-2 bg-cyber-cyan/10 border border-cyber-cyan/60 text-cyber-cyan font-semibold hover:bg-cyber-cyan/20 hover:border-cyber-cyan transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '导入中...' : '开始导入'}
          </button>
        </div>
      </div>
    </div>
  );
}
