import { useState, useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { CheckingView } from './views/CheckingView';
import { AvailableView } from './views/AvailableView';
import { LatestView } from './views/LatestView';
import { DownloadingView } from './views/DownloadingView';
import { ReadyView } from './views/ReadyView';
import { ErrorView } from './views/ErrorView';
import { IdleView } from './views/IdleView';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'latest'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateInfo {
  version: string;
  body: string;
}

const CURRENT_VERSION = '1.0.0';

export default function UpdatePage() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    try {
      setStatus('checking');
      setUpdateInfo(null);
      setErrorMessage('');

      const update = await check();

      if (update) {
        setUpdateInfo({
          version: update.version,
          body: update.body ?? '',
        });
        setStatus('available');
      } else {
        setStatus('latest');
      }
    } catch (error) {
      console.error('check update failed:', error);
      setErrorMessage(error instanceof Error ? error.message : '检查更新失败');
      setStatus('error');
    }
  }

  async function handleUpdate() {
    try {
      setStatus('downloading');

      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        setStatus('downloaded');
      } else {
        setStatus('error');
        setErrorMessage('未找到可用更新');
      }
    } catch (error) {
      console.error('update failed:', error);
      setErrorMessage(error instanceof Error ? error.message : '更新失败');
      setStatus('error');
    }
  }

  function restartApp() {
    window.location.reload();
  }

  function renderContent() {
    switch (status) {
      case 'idle':
        return <IdleView onCheck={checkForUpdates} />;
      case 'checking':
        return <CheckingView />;
      case 'available':
        return (
          <AvailableView
            currentVersion={CURRENT_VERSION}
            updateInfo={updateInfo!}
            onUpdate={handleUpdate}
            onLater={() => setStatus('idle')}
          />
        );
      case 'latest':
        return <LatestView onRecheck={checkForUpdates} />;
      case 'downloading':
        return <DownloadingView />;
      case 'downloaded':
        return <ReadyView onRestart={restartApp} />;
      case 'error':
        return <ErrorView message={errorMessage} onRetry={checkForUpdates} />;
      default:
        return <IdleView onCheck={checkForUpdates} />;
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#e0e0e0] items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Content */}
        <div className="transition-all duration-300 ease-in-out">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
