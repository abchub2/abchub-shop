'use strict';
(() => {
  const photos = Object.freeze({grapes:'assets/grape-bunch.jpg',mandarins:'assets/citrus-fruit.jpg',apples:'assets/fresh-apples.jpg'});
  const colors = {grapes:'#e3e7d7',mandarins:'#f2e7cc',apples:'#efe2d4'};
  function text(value, label, max, required=true) {
    if(typeof value!=='string' || value.length>max || (required&&!value.trim()))throw new Error(`${label}을(를) 확인해 주세요.`);
    return value.trim();
  }
  function validate(document) {
    if(!document || document.version!==1 || !Array.isArray(document.products) || document.products.length<1 || document.products.length>100)throw new Error('상품 정보 형식이 올바르지 않습니다.');
    const ids=new Set();
    return document.products.map((p,index)=>{
      const label=`${index+1}번 상품`;
      if(!p || typeof p!=='object' || typeof p.id!=='string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(p.id) || ids.has(p.id))throw new Error(`${label}의 상품 ID가 올바르지 않습니다.`);
      ids.add(p.id);
      if(!Number.isSafeInteger(p.price) || p.price<1 || p.price>10000000)throw new Error(`${label}의 가격은 1~10,000,000원 정수로 입력해 주세요.`);
      if(!['small','family','group'].includes(p.category) || !Object.hasOwn(photos,p.kind) || typeof p.soldOut!=='boolean')throw new Error(`${label}의 분류·사진·판매 상태를 확인해 주세요.`);
      const size=text(p.size,`${label} 중량`,40);
      return {id:p.id,name:text(p.name,`${label} 상품명`,80),size,price:p.price,category:p.category,kind:p.kind,description:text(p.description,`${label} 설명`,2000,false),soldOut:p.soldOut,label:size,color:colors[p.kind]};
    });
  }
  function serialize(products) {
    const clean=validate({version:1,products}).map(({label,color,...p})=>p);
    return JSON.stringify({version:1,products:clean},null,2)+'\n';
  }
  function escape(value) {
    return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  window.ShopCatalog=Object.freeze({photos,validate,serialize,escape});
})();
