const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'catalog.js'),'utf8'),context);
const catalog=context.window.ShopCatalog;
const source=JSON.parse(fs.readFileSync(path.join(root,'products.json'),'utf8'));
const copy=()=>structuredClone(source);
test('existing product IDs, prices, photos and stock survive serialization',()=>{
 const normalized=catalog.validate(source);
 assert.equal(normalized.length,5);
 assert.deepEqual(JSON.parse(catalog.serialize(normalized)),source);
});
test('stock status must be a boolean',()=>{const data=copy();data.products[0].soldOut='false';assert.throws(()=>catalog.validate(data));});
test('price rejects negatives, decimals, strings and unsafe numbers',()=>{
 for(const price of [-1,0,12.5,'7500',NaN,Infinity,10000001]){const data=copy();data.products[0].price=price;assert.throws(()=>catalog.validate(data));}
});
test('IDs must be unique, strings and safe for DOM selectors',()=>{
 for(const id of [undefined,123,'a" onclick="alert(1)','../data']){const data=copy();data.products[0].id=id;assert.throws(()=>catalog.validate(data));}
 const data=copy();data.products[1].id=data.products[0].id;assert.throws(()=>catalog.validate(data));
});
test('rejects unknown photos and category values',()=>{
 for(const [key,value] of [['kind','__proto__'],['kind','https://evil.example/image'],['category','unknown']]){const data=copy();data.products[0][key]=value;assert.throws(()=>catalog.validate(data));}
});
test('rejects invalid or missing catalog data',()=>{for(const value of [null,{}, {version:2,products:source.products},{version:1,products:[]}])assert.throws(()=>catalog.validate(value));});
test('bounded text and escaped markup prevent HTML injection',()=>{
 const data=copy();data.products[0].name='<img src=x onerror=alert(1)>';
 const product=catalog.validate(data)[0];assert.equal(product.name,data.products[0].name);
 assert(!catalog.escape(product.name).includes('<'));
 data.products[0].name='x'.repeat(81);assert.throws(()=>catalog.validate(data));
});
test('derived labels/colors are regenerated rather than trusted',()=>{
 const data=copy();data.products[0].color='url(evil)';data.products[0].label='wrong';
 const product=catalog.validate(data)[0];assert.equal(product.label,product.size);assert.equal(product.color,'#f3edce');
});

test('catalog remains readable by browsers with the previous cached validator',()=>{
 const legacy={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'fixtures/catalog-before-custom-photos.js'),'utf8'),legacy);
 const products=legacy.window.ShopCatalog.validate(source);
 assert.equal(products.length,source.products.length);
 const shinano=products.find(p=>p.id==='shinano-gold-5kg');
 assert.equal(shinano.price,12500);assert.equal(shinano.kind,'apples');
});
test('custom product photo survives admin serialization and rejects unknown paths',()=>{
 const data=copy();const shinano=data.products.find(p=>p.id==='shinano-gold-5kg');
 assert.equal(catalog.validate(data).find(p=>p.id===shinano.id).photo,'shinanoGold');
 assert.equal(JSON.parse(catalog.serialize(data.products)).products.find(p=>p.id===shinano.id).photo,'shinanoGold');
 shinano.photo='https://example.com/unknown.jpg';assert.throws(()=>catalog.validate(data));
});
