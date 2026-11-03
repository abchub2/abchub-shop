const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const original=JSON.parse(fs.readFileSync(path.join(root,'products.json'),'utf8'));
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8000';
const apartments=[['haemoro-west','동대구해모로스퀘어웨스트'],['haemoro-east','동대구해모로스퀘어이스트'],['bokhyeon-prugio','복현푸르지오'],['centum-hwaseong','동대구역센텀화성파크드림'],['donam-hillstate-desian','힐스테이트데시앙 도남아파트']];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:320,height:844},serviceWorkers:'block',acceptDownloads:true});
 let document=structuredClone(original),fail=false;
 await context.route('**/products.json',route=>route.fulfill({status:fail?503:200,contentType:'application/json',body:JSON.stringify(document)}));
 await context.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copiedText=text}});Object.defineProperty(navigator,'share',{value:undefined,configurable:true});});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/blog/index.html');await page.locator('.blog-product').first().waitFor();assert.equal(await page.locator('.apartment-card').count(),5);assert.equal(await page.locator('.blog-product').count(),4);
 for(const [id,name] of apartments){
  await page.goto(base+`/blog/${id}.html`);await page.locator('[data-copy-promo]:enabled').waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.apartment-name').innerText(),name);assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),`https://www.abchub.kr/blog/${id}.html`);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('[data-copy-promo]').click();const text=await page.evaluate(()=>window.copiedText);assert(text.includes(name));for(const price of ['7,500원','7,900원','25,000원','49,000원'])assert(text.includes(price));assert(text.includes('상담 후 안내'));assert(text.includes('010-7570-6357'));assert(text.includes(`apartment=${id}`));
  await page.locator('[data-share-blog]').click();assert.equal(await page.evaluate(()=>window.copiedText),`https://www.abchub.kr/blog/${id}.html`);
  await page.locator('.join-steps+.button').click();await page.locator('.product-card').first().waitFor();assert.equal(await page.locator('#community-name').innerText(),name);await page.locator('[data-add="shine-2kg"]').click();await page.locator('.mobile-cart').click();assert.equal(await page.locator('[data-order-field="apartment"]').inputValue(),id);assert((await page.locator('#order-text').inputValue()).includes(`아파트: ${name}`));assert(await page.locator('#cart-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth));await page.keyboard.press('Escape');
 }
 await page.goto(base+'/blog/haemoro-west.html');await page.locator('[data-copy-promo]:enabled').waitFor();
 const downloadPromise=page.waitForEvent('download');await page.locator('[data-download-promo]').click();const download=await downloadPromise;assert(fs.readFileSync(await download.path(),'utf8').includes('동대구해모로스퀘어웨스트'));
 document.products[0].soldOut=true;document.products[2].price=30000;await page.reload();await page.locator('[data-copy-promo]:enabled').waitFor();assert.equal(await page.locator('.blog-sold-out').count(),1);assert((await page.locator('.blog-product').nth(2).innerText()).includes('30,000원'));await page.locator('[data-copy-promo]').click();assert((await page.evaluate(()=>window.copiedText)).includes('7,500원 (품절)'));
 fail=true;await page.reload();await page.locator('[data-reload-blog]').waitFor();assert(await page.locator('[data-copy-promo]').isDisabled());assert(await page.locator('[data-download-promo]').isDisabled());assert.equal(await page.locator('.blog-product').count(),0);fail=false;await page.locator('[data-reload-blog]').click();await page.locator('[data-copy-promo]:enabled').waitFor();
 for(const width of [320,390,412,768,1440]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`article overflow ${width}`);}
 await page.goto(base+'/?apartment=not-a-real-apartment#shop');await page.locator('.product-card').first().waitFor();assert(await page.locator('#community-context').isHidden());await page.locator('.cart-trigger').click();assert.equal(await page.locator('[data-order-field="apartment"]').inputValue(),'');await page.locator('[data-order-field="apartment"]').selectOption('bokhyeon-prugio');assert((await page.locator('#order-text').inputValue()).includes('아파트: 복현푸르지오'));
 assert.deepEqual(errors,[]);console.log('PASS: 5 apartment articles, live products/prices/stock, promotional text and downloads, sharing, apartment-prefilled orders, invalid apartment handling, error recovery, mobile layouts. No external posts or messages sent.');await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
