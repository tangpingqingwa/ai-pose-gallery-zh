import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'

const root = path.resolve(import.meta.dirname, '..')
const origin = 'http://127.0.0.1:5184'
const url = `${origin}/portraits`

async function ready() {
  try {
    const response = await fetch(`${origin}/library-assets/thumbs/P-NEW-001.webp`, { signal: AbortSignal.timeout(1200) })
    const ok = response.ok && response.headers.get('content-type')?.includes('image/webp')
    await response.body?.cancel()
    return ok
  } catch { return false }
}

if (!await ready()) {
  const vite = path.join(root, 'node_modules/vite/bin/vite.js')
  if (!fs.existsSync(vite)) throw new Error('请先在项目目录运行 pnpm install。')
  const logDir = path.join(root, 'backups')
  fs.mkdirSync(logDir, { recursive: true })
  const log = fs.openSync(path.join(logDir, 'gallery-preview.log'), 'a')
  // Detach from the launching terminal so the gallery stays available after it closes.
  const child = spawn(process.execPath, [vite, '--host', '127.0.0.1', '--port', '5184', '--strictPort'], {
    cwd: root, detached: true, windowsHide: true, stdio: ['ignore', log, log],
  })
  child.unref()
  fs.closeSync(log)
  let running = false
  for (let attempt = 0; attempt < 30; attempt++) {
    if (await ready()) { running = true; break }
    await setTimeout(300)
  }
  if (!running) throw new Error(`图库启动失败，请查看 ${path.join(logDir, 'gallery-preview.log')}`)
}

const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open'
const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url]
const browser = spawn(command, args, { detached: true, windowsHide: true, stdio: 'ignore' })
browser.unref()
console.log(`人物图库已启动并在浏览器打开：${url}`)
