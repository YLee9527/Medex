import { ThemeColors } from '../../theme/theme';

interface LatestViewProps {
  onRecheck: () => void;
  theme: ThemeColors;
}

export function LatestView({ onRecheck, theme }: LatestViewProps) {
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
      <h2 className="text-xl font-medium mb-2" style={{ color: theme.text }}>已是最新版本</h2>
      <p className="mb-6" style={{ color: theme.textSecondary }}>当前版本：1.0.0</p>
      <button
        onClick={onRecheck}
        className="px-6 py-2 rounded-lg transition-colors"
        style={{ 
          backgroundColor: `${theme.text}18`,
          color: theme.textSecondary
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${theme.text}30`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${theme.text}18`;
        }}
      >
        重新检查
      </button>
    </div>
  );
}
