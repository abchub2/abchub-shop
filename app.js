'use strict';
(() => {
  const photos = {
    grapes: 'assets/grape-bunch.jpg',
    mandarins: 'assets/citrus-fruit.jpg',
    apples: 'assets/fresh-apples.jpg'
  };
  const products = [
    {id:'shine-2kg',name:'샤인머스켓',category:'small',label:'2kg',size:'2kg',price:7500,color:'#e3e7d7',kind:'grapes',description:'샤인머스켓 2kg 구성입니다. 판매 가격은 7,500원이며 재고와 배송 일정은 상담에서 확인해 주세요.'},
    {id:'jeju-1-5kg',name:'타이백 제주감귤',category:'small',label:'1.5kg',size:'1.5kg',price:7900,color:'#f2e7cc',kind:'mandarins',description:'타이백 제주감귤 1.5kg 구성입니다. 판매 가격은 7,900원이며 재고와 배송 일정은 상담에서 확인해 주세요.'},
    {id:'apple-5kg',name:'사과',category:'family',label:'5kg',size:'5kg',price:25000,color:'#efe2d4',kind:'apples',description:'함께 나누어 먹기 좋은 사과 5kg 구성입니다. 판매 가격은 25,000원이며 품종과 크기, 배송 일정은 상담에서 확인해 주세요.'},
    {id:'apple-10kg',name:'사과',category:'family',label:'10kg',size:'10kg',price:49000,color:'#ebe3d9',kind:'apples',description:'넉넉하게 즐기는 사과 10kg 구성입니다. 판매 가격은 49,000원이며 품종과 크기, 배송 일정은 상담에서 확인해 주세요.'}
  ];
  const key = 'lees-farm-cart-v2';
  const money = value => value.toLocaleString('ko-KR') + '원';
  let cart = {};
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (saved && typeof saved === 'object') for (const p of products) {
      if (Number.isInteger(saved[p.id]) && saved[p.id] > 0) cart[p.id] = Math.min(saved[p.id],99);
    }
  } catch (_) { /* Storage may be unavailable in private browsing. */ }
  function fruit(kind) {
    const alt = {grapes:'청포도 참고 사진',mandarins:'감귤류 참고 사진',apples:'사과 참고 사진'};
    return `<img src="${photos[kind]}" alt="${alt[kind]} · 실제 판매 상품의 품종과 외관은 다를 수 있습니다" loading="lazy" decoding="async">`;
  }
  function renderProducts(filter='all') {
    const list = products.filter(p => filter === 'all' || p.category === filter);
    document.querySelector('#product-count').textContent = `총 ${list.length}개`;
    document.querySelector('#products').innerHTML = list.map(p => `<article class="product-card"><button class="product-view" data-detail="${p.id}" aria-label="${p.name} 상세 보기"><div class="product-art" style="background:${p.color}"><span class="product-badge">${p.label}</span>${fruit(p.kind)}</div><div class="product-info"><span class="product-category">SEASONAL FRUIT</span><h3>${p.name}</h3><p>${p.size}</p></div></button><div class="price-row"><strong>${money(p.price)}</strong><button class="add-button" data-add="${p.id}" aria-label="${p.name} 장바구니 담기">담기 +</button></div></article>`).join('');
  }
  function persist() {
    try { localStorage.setItem(key,JSON.stringify(cart)); } catch (_) {}
    const count = Object.values(cart).reduce((a,b)=>a+b,0);
    document.querySelector('#cart-count').textContent = count;
    document.querySelector('#mobile-cart-count').textContent = count;
    renderCart();
  }
  let toastTimer;
  function toast(message) {
    const box=document.querySelector('#toast'); box.textContent=message; box.classList.add('visible');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>box.classList.remove('visible'),2500);
  }
  function add(id) {
    if(!products.some(p=>p.id===id)) return;
    if((cart[id]||0)>=99) return toast('상품별 최대 99개까지 담을 수 있어요.');
    cart[id]=(cart[id]||0)+1; persist(); toast('장바구니에 담았어요.');
  }
  function selected() { return products.filter(p=>cart[p.id]); }
  function orderText() {
    const lines=selected().map(p=>`- ${p.name} (${p.size}) × ${cart[p.id]}: ${money(p.price*cart[p.id])}`);
    const total=selected().reduce((sum,p)=>sum+p.price*cart[p.id],0);
    return ['[이팜 구매 상담]',...lines,`상품 합계: ${money(total)}`,'재고, 구성, 배송비와 배송 일정을 확인하고 싶어요.','이 내용은 상담용 구매 희망 목록이며 주문 확정이 아닙니다.'].join('\n');
  }
  function renderCart() {
    const list=selected();
    document.querySelector('#cart-items').innerHTML=list.length ? list.map(p=>`<div class="cart-item"><div><h3>${p.name}</h3><p>${p.size} · ${money(p.price*cart[p.id])}</p><button class="remove" data-remove="${p.id}" aria-label="${p.name} 삭제">삭제</button></div><div class="quantity"><button data-change="${p.id}" data-step="-1" aria-label="${p.name} 수량 줄이기" ${cart[p.id]===1?'disabled':''}>−</button><span aria-label="수량">${cart[p.id]}</span><button data-change="${p.id}" data-step="1" aria-label="${p.name} 수량 늘리기" ${cart[p.id]===99?'disabled':''}>+</button></div></div>`).join('') : '<div class="empty"><p>아직 담아두신 과일이 없어요.</p><button class="button primary" data-shopping>제철 과일 둘러보기 ↗</button></div>';
    const summary=document.querySelector('#cart-summary');
    summary.innerHTML=list.length ? `<div class="total"><span>상품 합계</span><strong>${money(list.reduce((sum,p)=>sum+p.price*cart[p.id],0))}</strong></div><p class="cart-notice">배송비 미포함 · 실제 판매 여부와 최종 금액은 상담 후 안내됩니다. 아래 내용을 복사한 뒤 카카오톡에 붙여 넣어 주세요.</p><textarea class="order-text" id="order-text" readonly aria-label="복사할 구매 상담 내용"></textarea><div class="cart-actions"><button class="button primary" data-copy>구매 상담 내용 복사 <span>↗</span></button><a class="button kakao" href="http://pf.kakao.com/_cxhCVn/chat" target="_blank" rel="noopener noreferrer">카카오톡 상담 열기 <span>↗</span></a></div>` : '';
    if(list.length) document.querySelector('#order-text').value=orderText();
  }
  function detail(id) {
    const p=products.find(p=>p.id===id); if(!p)return;
    document.querySelector('#detail-content').innerHTML=`<div class="product-art detail-art" style="background:${p.color}">${fruit(p.kind)}</div><p class="eyebrow">${p.size} · 제철 과일</p><h2 id="detail-title">${p.name}</h2><p class="detail-description">${p.description}</p><p>${p.size} / <strong>${money(p.price)}</strong></p><p class="detail-note">사진은 과일 참고 이미지이며 실제 판매 상품의 품종·외관·포장과 다를 수 있습니다. 자세한 상품 정보와 배송 일정은 카카오톡 상담에서 확인해 주세요.</p><button class="button primary detail-add" data-add="${p.id}">장바구니에 담기 <span>+</span></button>`;
    document.querySelector('#detail-dialog').showModal();
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.hasAttribute('data-add'))add(button.dataset.add);
    if(button.hasAttribute('data-detail'))detail(button.dataset.detail);
    if(button.hasAttribute('data-filter')){
      document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
      renderProducts(button.dataset.filter);
    }
    if(button.hasAttribute('data-cart'))document.querySelector('#cart-dialog').showModal();
    if(button.hasAttribute('data-close'))button.closest('dialog').close();
    if(button.hasAttribute('data-shopping')){document.querySelector('#cart-dialog').close();document.querySelector('#shop').scrollIntoView();}
    if(button.hasAttribute('data-remove')){delete cart[button.dataset.remove];persist();document.querySelector('#cart-dialog [data-change], #cart-dialog [data-shopping]')?.focus();}
    if(button.hasAttribute('data-change')){
      const id=button.dataset.change,step=Number(button.dataset.step);cart[id]=Math.max(1,Math.min(99,(cart[id]||1)+step));persist();
      document.querySelector(`[data-change="${id}"][data-step="${step}"]:not(:disabled)`)?.focus();
    }
    if(button.hasAttribute('data-copy')){
      try {await navigator.clipboard.writeText(orderText());toast('복사했어요. 카카오톡 상담에 붙여 넣어 주세요.');}
      catch(_){const area=document.querySelector('#order-text');area.focus();area.select();toast('상담 내용을 선택했어요. 길게 누르거나 Ctrl/Cmd+C로 복사해 주세요.');}
    }
  });
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
  }));
  try { localStorage.removeItem('lees-farm-cart-v1'); } catch (_) {}
  renderProducts(); persist();
})();
