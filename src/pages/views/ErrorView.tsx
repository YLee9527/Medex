interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <div className="text-center animate-fade-in">
      <div className="flex justify-center mb-4">
        <svg
          className="w-16 h-16 text-red-500"
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
      <h2 className="text-xl font-medium mb-2 text-red-400">检查更新失败</h2>
      <p className="text-gray-400 mb-6 text-sm">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
      >
        重试
      </button>
    </div>
  );
}
