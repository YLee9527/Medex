interface ReadyViewProps {
  onRestart: () => void;
}

export function ReadyView({ onRestart }: ReadyViewProps) {
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
      <h2 className="text-xl font-medium mb-2">更新已准备好</h2>
      <p className="text-gray-400 mb-6">需要重启应用以完成更新</p>
      <button
        onClick={onRestart}
        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md"
      >
        立即重启
      </button>
    </div>
  );
}
