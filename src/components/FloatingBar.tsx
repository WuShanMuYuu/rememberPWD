import { SideGrip } from './SideGrip';

interface FloatingBarProps {
  onExpand: () => void;
}

export function FloatingBar({ onExpand }: FloatingBarProps) {
  return (
    <div className="h-full w-full">
      <SideGrip expanded={false} onToggle={onExpand} />
    </div>
  );
}
