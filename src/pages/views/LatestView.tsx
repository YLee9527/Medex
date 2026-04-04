interface LatestViewProps {
  onRecheck: () => void;
}

export function LatestView({ onRecheck }: LatestViewProps) {
  return (
    <div className="text-center animate-fade-in">
      <div className="flex justify-center mb-4">
        <svg
          className="w-16 h-16 text-green-500"
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
      <h2 className="text-xl font-medium mb-2">已是最新版本</h2>
      <p className="text-gray-400 mb-6">当前版本：1.0.0</p>
      <button
        onClick={onRecheck}
        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
      >
        重新检查
      </button>
    </div>
  );
}
