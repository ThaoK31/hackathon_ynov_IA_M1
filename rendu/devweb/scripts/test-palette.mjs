import { chromium } from 'playwright'
import path from 'node:path'

const BASE_URL = process.argv[2] || 'http://localhost:5173'
const OUT = 'docs/screenshots/command-palette.png'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('textarea[aria-label="Message"]', { timeout: 10000 })
  await page.keyboard.down('Control')
  await page.keyboard.press('k')
  await page.keyboard.up('Control')
  await page.waitForTimeout(400)
  await page.screenshot({ path: OUT })
  console.log(`Capture : ${OUT}`)
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
