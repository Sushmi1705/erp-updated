import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));
  await page.goto('http://localhost:5173/login');
  await new Promise(r => setTimeout(r, 2000));
  
  // Try to login if possible, or just wait
  // We can just login with mock credentials if there's a login form
  try {
    await page.type('input[type="email"]', 'admin@example.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));
  } catch(e) {}
  
  // Click the sidebar Maintenance button
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Maintenance')) {
        console.log('Clicking Maintenance sidebar...');
        await btn.click();
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }
  } catch(e) {}

  await browser.close();
})();
