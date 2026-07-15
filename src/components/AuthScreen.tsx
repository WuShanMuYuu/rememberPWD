import { useState } from 'react';

interface AuthScreenProps {
  isSetup: boolean;
  onSuccess: () => void;
  onSetup: (password: string) => Promise<void>;
  onVerify: (password: string) => Promise<boolean>;
}

export function AuthScreen({ isSetup, onSuccess, onSetup, onVerify }: AuthScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSetup) {
        if (password.length < 6) {
          setError('主密码长度不能少于 6 位');
          return;
        }
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致');
          return;
        }
        await onSetup(password);
      } else {
        const valid = await onVerify(password);
        if (!valid) {
          setError('主密码错误');
          return;
        }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6 cyber-grid bg-cyber-bg overflow-y-auto">
      <div className="relative w-full max-w-sm p-6 my-4 border border-cyber-border bg-cyber-panel shadow-cyber-cyan">
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-cyber-cyan" />
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-cyber-cyan" />
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-cyber-cyan" />
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-cyber-cyan" />

        <div className="mb-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center border border-cyber-cyan/60 bg-cyber-card shadow-[0_0_16px_rgba(0,240,255,0.25)]">
            <svg className="w-7 h-7 text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-wide">
            {isSetup ? '设置主密码' : '验证主密码'}
          </h1>
          <p className="mt-2 text-xs text-cyber-muted">
            {isSetup ? '请设置一个安全的主密码，用于加密保护您的数据' : '请输入主密码以继续'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入主密码"
              className="w-full px-4 py-2.5 bg-cyber-card border border-cyber-border text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all"
              autoFocus
            />
          </div>
          {isSetup && (
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="确认主密码"
                className="w-full px-4 py-2.5 bg-cyber-card border border-cyber-border text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all"
              />
            </div>
          )}
          {error && (
            <p className="text-sm text-cyber-danger">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cyber-cyan/10 border border-cyber-cyan/60 text-cyber-cyan font-semibold tracking-wider hover:bg-cyber-cyan/20 hover:border-cyber-cyan hover:shadow-[0_0_18px_rgba(0,240,255,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : isSetup ? '创建并进入' : '解锁'}
          </button>
        </form>
      </div>
    </div>
  );
}
