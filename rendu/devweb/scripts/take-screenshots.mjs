// Capture l'interface avec un message envoye et une reponse mock.
// Usage : node scripts/take-screenshots.mjs [http://localhost:5174]
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.argv[2] || 'http://localhost:5173'
const OUT_DIR = 'docs/screenshots'

async function waitForResponse(page) {
  // Attend que le message utilisateur apparaisse et que la reponse soit rendue.
  await page.waitForSelector('.messages .msg', { timeout: 10000 })
  // Attend que le streaming se termine (plus de typing indicator).
  await page.waitForFunction(() => {
    return document.querySelector('.typing-indicator') === null
  }, { timeout: 15000 })
  // Petit temps supplementaire pour le rendu final.
  await page.waitForTimeout(600)
}

async function screenshot(page, name, viewport) {
  await page.setViewportSize(viewport)
  await page.waitForTimeout(300)
  const file = path.join(OUT_DIR, name)
  await page.screenshot({ path: file, fullPage: false })
  console.log(`Capture : ${file} (${viewport.width}x${viewport.height})`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  })
  const page = await context.newPage()

  const url = BASE_URL.includes('?') ? BASE_URL : `${BASE_URL}?new=1`
  console.log(`Ouverture de ${url}`)
  await page.goto(url, { waitUntil: 'networkidle' })

  // Attend que le textarea soit pret.
  await page.waitForSelector('textarea[aria-label="Message"]', { timeout: 10000 })

  // Envoie le message.
  const prompt = 'fais un petit tableau bg'
  await page.fill('textarea[aria-label="Message"]', prompt)
  await page.keyboard.press('Enter')

  // Attend la fin de la reponse.
  await waitForResponse(page)

  // Capture desktop.
  await screenshot(page, 'vue-web.png', { width: 1280, height: 800 })

  // Capture mobile : ferme la sidebar pour montrer le chat.
  await page.click('button[aria-label="Reduire le menu"]')
  await page.waitForTimeout(300)
  await screenshot(page, 'vue-mobile.png', { width: 375, height: 812 })

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
