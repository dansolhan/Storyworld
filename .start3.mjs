import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1360, height: 840 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0,160)); });
const shot = (n) => p.screenshot({ path: `C:/Users/Daniel/AppData/Local/Temp/claude/c--Kreativitet-StoryworldAI/948197b4-c29d-4dbb-aa9f-912cf73a6b38/scratchpad/${n}.png` });

await p.goto('http://localhost:5213/', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Load the demo' }).click();
await p.waitForTimeout(2600);

// Route A: the story settings drawer's "Select on Graph".
await p.getByRole('button', { name: /^Settings/ }).click();
await p.waitForTimeout(900);
console.log('drawer text:', (await p.locator('[class*=drawer], [role=dialog]').first().textContent().catch(() => 'NO DRAWER') || '').replace(/\s+/g, ' ').slice(0, 200));
await shot('start-drawer');
const selectBtn = p.getByRole('button', { name: /Select on Graph/ });
console.log('has "Select on Graph":', await selectBtn.count());

// Route B: the inspector's per-page toggle.
await p.keyboard.press('Escape');
await p.waitForTimeout(600);
await p.keyboard.press('Control+k');
await p.waitForTimeout(400);
await p.getByRole('combobox', { name: /Search/ }).fill('Locked Door');
await p.waitForTimeout(400);
await p.keyboard.press('Enter');
await p.waitForTimeout(1200);
await p.getByRole('tab', { name: /Settings/ }).click();
await p.waitForTimeout(600);
const startToggle = p.getByRole('button', { name: /Start the story here|story starts here/ });
console.log('inspector start toggle:', await startToggle.count(), await startToggle.first().textContent().catch(() => '-'));
await startToggle.first().click();
await p.waitForTimeout(900);
await p.locator('.react-flow__controls-fitview').click();
await p.waitForTimeout(700);
const kickers = await p.locator('.react-flow__node-pageNode [class*=kicker]').allTextContents();
console.log('start kickers after setting:', kickers.filter(k => /Start/i.test(k)));
await shot('start-set');
console.log('errors:', errs.length ? errs.slice(0,2) : 'none');
await b.close();
