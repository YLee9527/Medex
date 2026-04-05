import { ThemeColors } from '../../theme/theme';

interface IdleViewProps {
  onCheck: () => void;
  theme: ThemeColors;
}

export function IdleView({ onCheck, theme }: IdleViewProps) {
  return (
    <div className="text-center animate-fade-in">
      <h2 className="text-xl font-medium mb-2" style={{ color: theme.text }}>检查更新</h2>
      <p className="mb-6" style={{ color: theme.textSecondary }}>当前版本：1.0.0</p>
      <button
        onClick={onCheck}
        className="px-6 py-2 rounded-lg transition-colors shadow-md"
        style={{ 
          backgroundColor: '#3B82F6',
          color: '#FFFFFF'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2563EB';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#3B82F6';
        }}
      >
        检查更新
      </button>
    </div>
  );
}
