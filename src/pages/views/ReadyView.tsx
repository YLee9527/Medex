import { ThemeColors } from '../../theme/theme';

interface ReadyViewProps {
  onRestart: () => void;
  theme: ThemeColors;
}

export function ReadyView({ onRestart, theme }: ReadyViewProps) {
  return (
    <div className="text-center animate-fade-in">
      <div className="flex justify-center mb-4">
        <svg
          className="w-16 h-16"
          style={{ color: '#22c55e' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-medium mb-2" style={{ color: theme.text }}>更新已准备好</h2>
      <p className="mb-6" style={{ color: theme.textSecondary }}>需要重启应用以完成更新</p>
      <button
        onClick={onRestart}
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
        立即重启
      </button>
    </div>
  );
}
