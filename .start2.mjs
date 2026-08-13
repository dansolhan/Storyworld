import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1360, height: 840 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0,160)); });

await p.goto('http://localhost:5213/', { waitUntil: 'networkidle' });

// A save written the way the OLD build wrote them: no storyVersion, pages keyed by id.
await p.evaluate(async () => {
  const put = (k, v) => new Promise((res, rej) => {
    const req = indexedDB.open('keyval-store', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('keyval');
    req.onsuccess = () => {
      const tx = req.result.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put(v, k);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    };
    req.onerror = () => rej(req.error);
  });
  await put('story-legacy-1', {
    version: 3,                       // envelope only — no storyVersion
    state: {
      storyTitle: 'An Older Draft',
      storyDescription: '',
      startPageId: 'p-a',             // the thing we are checking
      pages: {
        'p-a': { id: 'p-a', title: 'First', paragraphs: [{ id: 'x', text: '<p>Words.</p>' }], choices: [{ id: 'c1', text: 'on', targetPageId: 'p-b' }] },
        'p-b': { id: 'p-b', title: 'Second', paragraphs: [{ id: 'y', text: '<p>More.</p>' }], choices: [] },
      },
      nodes: [
        { id: 'p-a', type: 'pageNode', position: { x: 0, y: 0 }, data: { title: 'First', paragraphs: [], choices: [] } },
        { id: 'p-b', type: 'pageNode', position: { x: 300, y: 0 }, data: { title: 'Second', paragraphs: [], choices: [] } },
      ],
      edges: [], variables: {}, items: {}, audio: {}, atmospheres: {}, subplots: [], statusData: [],
    },
  });
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
console.log('shelf:', await p.locator('article h2').allTextContents());
await p.locator('article').filter({ hasText: 'An Older Draft' }).getByRole('button', { name: 'Open' }).click();
await p.waitForTimeout(2600);
await p.locator('.react-flow__controls-fitview').click();
await p.waitForTimeout(700);
const kickers = await p.locator('.react-flow__node-pageNode [class*=kicker]').allTextContents();
console.log('kickers on the old save:', kickers);
console.log('start survived:', kickers.some(k => /Start/i.test(k)));
console.log('health:', await p.getByRole('button', { name: /Story health/ }).getAttribute('aria-label'));
console.log('errors:', errs.length ? errs.slice(0,2) : 'none');
await b.close();
