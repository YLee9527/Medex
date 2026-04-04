export function DownloadingView() {
  return (
    <div className="text-center animate-fade-in">
      {/* Loading Animation */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-500 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
        </div>
      </div>
      <h2 className="text-lg font-medium mb-2">正在下载更新...</h2>
      <p className="text-gray-400 text-sm">请稍候，不要关闭窗口</p>
    </div>
  );
}
