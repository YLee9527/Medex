import { useState, useEffect } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { listen } from '@tauri-apps/api/event'
import { useThemeContext } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { CheckingView } from './views/CheckingView'
import { AvailableView } from './views/AvailableView'
import { LatestView } from './views/LatestView'
import { DownloadingView } from './views/DownloadingView'
import { ReadyView } from './views/ReadyView'
import { ErrorView } from './views/ErrorView'
import { IdleView } from './views/IdleView'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'latest'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateInfo {
  version: string
  body: string
}

const CURRENT_VERSION = '1.0.0'

export default function UpdatePage() {
  const { theme } = useThemeContext()
  const { t } = useI18n()
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    checkForUpdates()
  }, [])

  // 多窗口场景下，接收语言变更事件并刷新页面以应用新语言
  useEffect(() => {
    let unlisten: (() => void) | null = null
    void (async () => {
      try {
        const u = await listen('medex:language-changed', () => {
          console.log('[update] language changed, reloading to apply new language')
          // 重新检查以确保翻译和文案刷新
          checkForUpdates()
        })
        unlisten = u
      } catch (err) {
        console.warn('[update] failed to attach language-changed listener', err)
      }
    })()

    const onLang = () => {
      console.log('[update] received local language-changed, reloading content')
      checkForUpdates()
    }
    window.addEventListener('medex:language-changed', onLang)

    return () => {
      if (unlisten) {
        try {
          unlisten()
        } catch {}
      }
      window.removeEventListener('medex:language-changed', onLang)
    }
  }, [])

  async function checkForUpdates() {
    try {
      setStatus('checking')
      setUpdateInfo(null)
      setErrorMessage('')

      const update = await check()

      if (update) {
        setUpdateInfo({
          version: update.version,
          body: update.body ?? '',
        })
        setStatus('available')
      } else {
        setStatus('latest')
      }
    } catch (error: any) {
      console.error('check update failed:', error)

      // 如果是 updater 未激活或没有 release，显示友好提示
      const errorMsg = error?.message || String(error)
      if (
        errorMsg.includes('not active') ||
        errorMsg.includes('Could not fetch')
      ) {
        setErrorMessage('当前版本尚未发布更新。请在发布新版本后重试。')
      } else {
        setErrorMessage(errorMsg)
      }
      setStatus('error')
    }
  }

  async function handleUpdate() {
    try {
      setStatus('downloading')

      const update = await check()
      if (update) {
        await update.downloadAndInstall()
        setStatus('downloaded')
      } else {
        setStatus('error')
        setErrorMessage('未找到可用更新')
      }
    } catch (error) {
      console.error('update failed:', error)
      setErrorMessage(error instanceof Error ? error.message : t('update.failed'))
      setStatus('error')
    }
  }

  function restartApp() {
    window.location.reload()
  }

  function renderContent() {
    switch (status) {
      case 'idle':
        return <IdleView onCheck={checkForUpdates} theme={theme} />
      case 'checking':
        return <CheckingView theme={theme} />
      case 'available':
        return (
          <AvailableView
            currentVersion={CURRENT_VERSION}
            updateInfo={updateInfo!}
            onUpdate={handleUpdate}
            onLater={() => setStatus('idle')}
            theme={theme}
          />
        )
      case 'latest':
        return <LatestView onRecheck={checkForUpdates} theme={theme} />
      case 'downloading':
        return <DownloadingView theme={theme} />
      case 'downloaded':
        return <ReadyView onRestart={restartApp} theme={theme} />
      case 'error':
        return (
          <ErrorView
            message={errorMessage}
            onRetry={checkForUpdates}
            theme={theme}
          />
        )
      default:
        return <IdleView onCheck={checkForUpdates} theme={theme} />
    }
  }

  return (
    <div
      className="flex flex-col h-screen items-center justify-center p-6"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      <div className="w-full max-w-md">
        {/* Content */}
        <div className="transition-all duration-300 ease-in-out">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
