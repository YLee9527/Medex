import { ThemeColors } from '../../theme/theme';

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
  theme: ThemeColors;
}

export function ErrorView({ message, onRetry, theme }: ErrorViewProps) {
  return (
    <div className="text-center animate-fade-in">
      <div className="flex justify-center mb-4">
        <svg
          className="w-16 h-16"
          style={{ color: '#ef4444' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-medium mb-2" style={{ color: '#f87171' }}>检查更新失败</h2>
      <p className="mb-6 text-sm" style={{ color: theme.textSecondary }}>{message}</p>
      <button
        onClick={onRetry}
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
        重试
      </button>
    </div>
  );
}
