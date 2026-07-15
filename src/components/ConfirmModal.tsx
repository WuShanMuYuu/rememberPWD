interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-sm mx-4 border border-cyber-border bg-cyber-panel shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-cyber-cyan" />
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-cyber-cyan" />
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-cyber-cyan" />
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-cyber-cyan" />

        <div className="p-5">
          <h3 className="text-base font-semibold text-white tracking-wide mb-2">{title}</h3>
          <p className="text-sm text-cyber-muted">{message}</p>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-cyber-border">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-cyber-border bg-cyber-card text-cyber-muted hover:text-white hover:border-cyber-cyan/50 transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-cyber-danger/10 border border-cyber-danger/60 text-cyber-danger font-semibold hover:bg-cyber-danger/20 hover:border-cyber-danger transition-all text-sm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
