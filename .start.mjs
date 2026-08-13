import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1360, height: 840 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await p.goto('http://localhost:5213/', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Load the demo' }).click();
await p.waitForTimeout(2600);

const startKickers = async () =>
  (await p.locator('.react-flow__node-pageNode [class*=kicker]').allTextContents()).filter(k => /Start/i.test(k));

await p.locator('.react-flow__controls-fitview').click();
await p.waitForTimeout(700);
console.log('fresh demo, start kickers:', await startKickers());
console.log('health:', await p.getByRole('button', { name: /Story health/ }).getAttribute('aria-label'));

// Force an autosave, then round-trip through the dashboard.
await p.getByRole('button', { name: 'Page' }).click();
await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Storyworld menu' }).click();
await p.waitForTimeout(400);
await p.getByRole('menuitem', { name: /Dashboard/ }).click();
await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Open' }).first().click();
await p.waitForTimeout(2600);
await p.locator('.react-flow__controls-fitview').click();
await p.waitForTimeout(700);

console.log('after reopening, start kickers:', await startKickers());
console.log('health:', await p.getByRole('button', { name: /Story health/ }).getAttribute('aria-label'));
console.log('errors:', errs.length ? errs.slice(0, 2) : 'none');
await b.close();
