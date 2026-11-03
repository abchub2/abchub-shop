'use strict';
(() => {
  const products = [
    {id:'apple',name:'햇살 담은 사과',category:'family',label:'가족용',size:'3kg · 구성 예시',price:24900,color:'#efe2d4',kind:'apple',description:'아삭한 한 입으로 시작하는 하루. 가족과 나누기 좋은 사과 한 상자를 제안합니다.'},
    {id:'mandarin',name:'기분 좋은 감귤',category:'family',label:'가족용',size:'3kg · 구성 예시',price:19900,color:'#f2e7cc',kind:'orange',description:'손으로 가볍게 까서 나누는 달콤한 시간. 식탁 위에 두고 즐기는 감귤 구성입니다.'},
    {id:'pear',name:'맑은 단맛, 배',category:'family',label:'가족용',size:'3kg · 구성 예시',price:29900,color:'#e7e8d9',kind:'pear',description:'넉넉한 과즙과 시원한 맛을 함께 나눠 보세요. 온 가족의 후식으로 제안하는 구성입니다.'},
    {id:'apple-small',name:'하루 한 알 사과',category:'small',label:'소포장',size:'1kg · 구성 예시',price:9900,color:'#ebe3d9',kind:'apple',description:'조금씩 신선하게 즐기고 싶은 날을 위한 소포장 사과 구성입니다.'},
    {id:'mandarin-small',name:'작은 행복 감귤',category:'small',label:'소포장',size:'1kg · 구성 예시',price:7900,color:'#eee8d6',kind:'orange',description:'혼자 먹어도 부담 없이, 가까운 사람과 가볍게 나누어도 좋은 소포장 구성입니다.'},
    {id:'together',name:'이웃과 나누는 제철 상자',category:'group',label:'공동구매',size:'5kg · 구성 예시',price:34900,color:'#e3e7d7',kind:'mix',description:'이웃의 주문을 모아 함께 나누는 제철 과일 상자입니다. 실제 구성과 최소 주문 수량은 상담에서 확인해 주세요.'}
  ];
  const key = 'lees-farm-cart-v1';
  const money = value => value.toLocaleString('ko-KR') + '원';
  let cart = {};
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (saved && typeof saved === 'object') for (const p of products) {
      if (Number.isInteger(saved[p.id]) && saved[p.id] > 0) cart[p.id] = Math.min(saved[p.id],99);
    }
  } catch (_) { /* Storage may be unavailable in private browsing. */ }
  function fruit(kind) {
    const apple = '<path d="M112 92C68 65 39 111 53 159C64 203 90 214 112 202C139 217 170 192 176 153C185 107 152 76 112 92Z" fill="#be5339"/><path d="M111 95L119 62" stroke="#71503a" stroke-width="8" stroke-linecap="round"/><path d="M122 77Q158 39 162 74Q147 91 122 77" fill="#547449"/><path d="M72 126Q66 152 78 166" fill="none" stroke="#e6a180" stroke-width="8" stroke-linecap="round"/>';
    const orange = '<circle cx="113" cy="145" r="66" fill="#e9a23c"/><circle cx="95" cy="121" r="37" fill="#f3b64e"/><path d="M109 80L115 64" stroke="#6f6b3d" stroke-width="6"/><path d="M115 77Q157 38 170 74Q142 97 115 77" fill="#537347"/><g fill="#ce882e" opacity=".6"><circle cx="140" cy="159" r="2"/><circle cx="124" cy="187" r="2"/><circle cx="153" cy="138" r="2"/><circle cx="80" cy="165" r="2"/></g>';
    const pear = '<path d="M113 77C83 77 92 113 69 136C23 185 70 217 114 214C162 216 198 182 158 139C136 115 146 77 113 77Z" fill="#c9b470"/><path d="M113 80L123 55" stroke="#735a38" stroke-width="7" stroke-linecap="round"/><path d="M123 69Q157 43 169 64Q147 83 123 69" fill="#637d4a"/><g fill="#9e8b52"><circle cx="89" cy="159" r="2"/><circle cx="127" cy="185" r="2"/><circle cx="143" cy="154" r="2"/><circle cx="107" cy="127" r="2"/></g>';
    return `<svg viewBox="0 0 240 260" aria-hidden="true"><ellipse cx="119" cy="225" rx="79" ry="12" fill="#536347" opacity=".13"/>${kind === 'mix' ? `<g transform="translate(-22 32) scale(.8)">${apple}</g><g transform="translate(85 45) scale(.65)">${orange}</g><g transform="translate(75 -15) scale(.65)">${pear}</g>` : kind === 'apple' ? apple : kind === 'pear' ? pear : orange}</svg>`;
  }
  function renderProducts(filter='all') {
    const list = products.filter(p => filter === 'all' || p.category === filter);
    document.querySelector('#product-count').textContent = `총 ${list.length}개`;
    document.querySelector('#products').innerHTML = list.map(p => `<article class="product-card"><button class="product-view" data-detail="${p.id}" aria-label="${p.name} 상세 보기"><div class="product-art" style="background:${p.color}"><span class="product-badge">${p.label} · 예시</span>${fruit(p.kind)}</div><div class="product-info"><span class="product-category">SEASONAL FRUIT</span><h3>${p.name}</h3><p>${p.size}</p></div></button><div class="price-row"><strong>${money(p.price)} <small>예시 가격</small></strong><button class="add-button" data-add="${p.id}" aria-label="${p.name} 장바구니 담기">담기 +</button></div></article>`).join('');
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
    return ['[이팜 구매 상담 · 상품/가격 예시]',...lines,`예시 상품 합계: ${money(total)}`,'실제 판매 여부, 구성, 최종 가격, 배송비와 배송 일정을 확인하고 싶어요.','이 내용은 상담용 구매 희망 목록이며 주문 확정이 아닙니다.'].join('\n');
  }
  function renderCart() {
    const list=selected();
    document.querySelector('#cart-items').innerHTML=list.length ? list.map(p=>`<div class="cart-item"><div><h3>${p.name}</h3><p>${p.size} · ${money(p.price*cart[p.id])}</p><button class="remove" data-remove="${p.id}" aria-label="${p.name} 삭제">삭제</button></div><div class="quantity"><button data-change="${p.id}" data-step="-1" aria-label="${p.name} 수량 줄이기" ${cart[p.id]===1?'disabled':''}>−</button><span aria-label="수량">${cart[p.id]}</span><button data-change="${p.id}" data-step="1" aria-label="${p.name} 수량 늘리기" ${cart[p.id]===99?'disabled':''}>+</button></div></div>`).join('') : '<div class="empty"><p>아직 담아두신 과일이 없어요.</p><button class="button primary" data-shopping>제철 과일 둘러보기 ↗</button></div>';
    const summary=document.querySelector('#cart-summary');
    summary.innerHTML=list.length ? `<div class="total"><span>예시 상품 합계</span><strong>${money(list.reduce((sum,p)=>sum+p.price*cart[p.id],0))}</strong></div><p class="cart-notice">배송비 미포함 · 실제 판매 여부와 최종 금액은 상담 후 안내됩니다. 아래 내용을 복사한 뒤 카카오톡에 붙여 넣어 주세요.</p><textarea class="order-text" id="order-text" readonly aria-label="복사할 구매 상담 내용"></textarea><div class="cart-actions"><button class="button primary" data-copy>구매 상담 내용 복사 <span>↗</span></button><a class="button kakao" href="http://pf.kakao.com/_cxhCVn/chat" target="_blank" rel="noopener noreferrer">카카오톡 상담 열기 <span>↗</span></a></div>` : '';
    if(list.length) document.querySelector('#order-text').value=orderText();
  }
  function detail(id) {
    const p=products.find(p=>p.id===id); if(!p)return;
    document.querySelector('#detail-content').innerHTML=`<div class="product-art detail-art" style="background:${p.color}">${fruit(p.kind)}</div><p class="eyebrow">${p.label} · 상품 구성 예시</p><h2 id="detail-title">${p.name}</h2><p class="detail-description">${p.description}</p><p>${p.size} / <strong>${money(p.price)} (예시)</strong></p><p class="detail-note">실제 판매 상품이 아닌 구성 예시입니다. 원산지·품종·중량·보관 방법과 배송 일정은 카카오톡 상담에서 확인해 주세요.</p><button class="button primary detail-add" data-add="${p.id}">장바구니에 담기 <span>+</span></button>`;
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
  renderProducts(); persist();
})();
