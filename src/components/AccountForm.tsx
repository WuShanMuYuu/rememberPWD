import { useState, useEffect, useRef } from 'react';
import type { Account } from '../types';
import type { AccountTypeOption } from './SettingsModal';

interface AccountFormProps {
  account?: Account | null;
  typeOptions?: string[];
  typeLabels?: AccountTypeOption[];
  onSave: (account: Account) => void;
  onCancel: () => void;
}

const EMPTY_ACCOUNT: Account = {
  type: '',
  name: '',
  address: '',
  port: null,
  username: '',
  password: '',
  remark: '',
};

export function AccountForm({ account, typeOptions = [], typeLabels = [], onSave, onCancel }: AccountFormProps) {
  const [form, setForm] = useState<Account>(EMPTY_ACCOUNT);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const options = typeOptions.length > 0 ? typeOptions : ['website', 'ssh', 'windows'];
  const getLabel = (value: string) => typeLabels.find((t) => t.value === value)?.label || value;

  useEffect(() => {
    if (account) {
      setForm({ ...account });
    } else {
      setForm({ ...EMPTY_ACCOUNT, type: options[0] || '' });
    }
  }, [account, options]);

  const handleChange = (field: keyof Account, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleChange('password', result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 bg-cyber-panel border-b border-cyber-border" data-tauri-drag-region>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors"
            title="返回"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white tracking-wide">
            {account ? '编辑' : '新增'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors"
            title="保存"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zM7 5h6v4H7V5zm8 14H9v-6h6v6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors"
            title="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 cyber-grid">
        <div>
          <label className="block text-sm text-cyber-muted mb-2">类型</label>
          <select
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-4 py-2.5 bg-cyber-card border border-cyber-border text-white focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b8594'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
          >
            {options.map((t) => (
              <option key={t} value={t} className="bg-cyber-card text-white">
                {getLabel(t)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-cyber-muted mb-2">
            {form.type === 'website' ? '站点名称' : '主机名称'}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={form.type === 'website' ? '例如：GitHub' : '例如：测试服务器'}
            className="w-full px-4 py-2.5 bg-cyber-card border border-cyber-border text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm text-cyber-muted mb-2">
            {form.type === 'website' ? '地址 / URL' : '主机地址 / IP'}
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder={form.type === 'website' ? 'https://github.com' : '192.168.1.1'}
            className="w-full px-4 py-2.5 bg-cyber-card border border-cyber-border text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all"
          />
        </div>

        {form.type === 'ssh' && (
          <div>
            <label className="block text-sm text-cyber-muted mb-2">端口</label>
            <input
              type="number"
              value={form.port || ''}
              onChange={(e) => handleChange('port', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="22"
              className="w-full px-4 py-2.5 bg-cyber-card border border-cyber-border text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-cyber-muted mb-2">
            {form.type === 'website' ? '账号 / 邮箱' : '用户名'}
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="username"
            className="w-full px-4 py-2.5 bg-cyber-card border border-cyber-border text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm text-cyber-muted mb-2">密码</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-24 bg-cyber-card border border-cyber-border text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="p-1.5 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors"
                title="生成随机密码"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-cyber-muted mb-2">备注</label>
          <textarea
            value={form.remark}
            onChange={(e) => handleChange('remark', e.target.value)}
            placeholder="可选备注信息"
            rows={3}
            className="w-full px-4 py-2.5 bg-cyber-card border border-cyber-border text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 py-4 bg-cyber-panel border-t border-cyber-border">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 bg-cyber-card border border-cyber-border text-cyber-muted hover:text-white hover:border-cyber-cyan/50 transition-all"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 bg-cyber-cyan/10 border border-cyber-cyan/60 text-cyber-cyan font-semibold hover:bg-cyber-cyan/20 hover:border-cyber-cyan hover:shadow-[0_0_16px_rgba(0,240,255,0.3)] transition-all"
        >
          保存
        </button>
      </div>
    </form>
  );
}
