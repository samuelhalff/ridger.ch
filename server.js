require('./scripts/load-env.js')
const http = require('http')
const path = require('path')
const fs = require('fs')
const { parse } = require('url')
const compression = require('compression')
const next = require('next')

const projectRoot = __dirname
const standaloneDir = path.join(projectRoot, '.next', 'standalone')
const distDir = fs.existsSync(standaloneDir) ? standaloneDir : path.join(projectRoot, 'dist')

if (!fs.existsSync(distDir)) {
  console.error('Unable to locate Next standalone output. Did you run `npm run build`?')
  process.exit(1)
}

process.env.NODE_ENV = process.env.NODE_ENV || 'production'
process.chdir(distDir)

const currentPort = parseInt(process.env.PORT, 10) || 5000
const hostname = process.env.HOSTNAME || '0.0.0.0'

let keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT || '', 10)
const shouldAssignKeepAlive =
  Number.isFinite(keepAliveTimeout) && keepAliveTimeout >= 0

let nextConfig = require(path.join(projectRoot, 'next.config.js'))
if (typeof nextConfig === 'function') {
  nextConfig = nextConfig('phase-production-server', { defaultConfig: {} })
}

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig)

const app = next({
  dev: false,
  dir: distDir,
  conf: nextConfig,
})

const compressionFilter = compression.filter
const compressibleContentType = /^(application|text|image\/svg\+xml|font)/i
const compressor = compression({
  threshold: 512,
  filter: (req, res) => {
    const hasEncoding = typeof res.hasHeader === 'function' && res.hasHeader('Content-Encoding')
    if (hasEncoding) return false
    const contentType =
      typeof res.getHeader === 'function' ? res.getHeader('Content-Type') : undefined
    if (contentType && !compressibleContentType.test(String(contentType))) {
      return false
    }
    return compressionFilter(req, res)
  },
})

app
  .prepare()
  .then(() => {
    const handle = app.getRequestHandler()

    const server = http.createServer((req, res) => {
      req.originalUrl = req.url
      compressor(req, res, () => {
        const parsedUrl = parse(req.url, true)
        handle(req, res, parsedUrl)
      })
    })

    if (shouldAssignKeepAlive) {
      server.keepAliveTimeout = keepAliveTimeout
    }

    server.listen(currentPort, hostname, () => {
      console.log(`Ready on http://${hostname}:${currentPort}`)
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
