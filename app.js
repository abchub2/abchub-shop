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
  const chatUrl = 'https://pf.kakao.com/_cxhCVn/chat';
  const orderDraft = {name:'', phone:'', address:'', note:''};
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
    return ['[이팜 주문 상담서]',...lines,`상품 합계: ${money(total)} (배송비 별도)`,...Object.entries({name:'주문자',phone:'연락처',address:'배송 주소',note:'요청 사항'}).filter(([key])=>orderDraft[key].trim()).map(([key,label])=>`${label}: ${orderDraft[key].trim()}`),'재고와 배송비, 배송 일정을 확인해 주세요.','상담 후 최종 금액과 결제 방법을 확인하면 주문이 확정됩니다.'].join('\n');
  }
  function renderCart() {
    const list=selected();
    document.querySelector('#cart-items').innerHTML=list.length ? list.map(p=>`<div class="cart-item"><div><h3>${p.name}</h3><p>${p.size} · ${money(p.price*cart[p.id])}</p><button class="remove" data-remove="${p.id}" aria-label="${p.name} 삭제">삭제</button></div><div class="quantity"><button data-change="${p.id}" data-step="-1" aria-label="${p.name} 수량 줄이기" ${cart[p.id]===1?'disabled':''}>−</button><span aria-label="수량">${cart[p.id]}</span><button data-change="${p.id}" data-step="1" aria-label="${p.name} 수량 늘리기" ${cart[p.id]===99?'disabled':''}>+</button></div></div>`).join('') : '<div class="empty"><p>아직 담아두신 과일이 없어요.</p><button class="button primary" data-shopping>제철 과일 둘러보기 ↗</button></div>';
    const summary=document.querySelector('#cart-summary');
    summary.innerHTML=list.length ? `<div class="total"><span>상품 합계</span><strong>${money(list.reduce((sum,p)=>sum+p.price*cart[p.id],0))}</strong></div><p class="cart-notice">배송비는 상담 후 안내됩니다. 주문서를 확인하고 카카오톡 상담을 시작해 주세요.</p><fieldset class="order-fields"><legend>주문서 작성 <small>선택 입력</small></legend><p>지금 입력하거나 상담창에서 직접 알려주셔도 됩니다. 입력 정보는 이 페이지에서만 사용하며 저장하지 않습니다.</p><label>주문자<input data-order-field="name" maxlength="60" autocomplete="name" placeholder="이름"></label><label>연락처<input data-order-field="phone" maxlength="40" type="tel" autocomplete="tel" placeholder="연락 가능한 전화번호"></label><label>배송 주소<input data-order-field="address" maxlength="250" autocomplete="street-address" placeholder="상세 주소까지 입력해 주세요"></label><label>요청 사항<textarea data-order-field="note" maxlength="500" rows="2" placeholder="배송 또는 상품 관련 요청"></textarea></label></fieldset><label class="order-preview-label" for="order-text">카카오톡에 보낼 주문서</label><textarea class="order-text" id="order-text" readonly aria-label="복사할 주문서"></textarea><p class="cart-notice">아래 버튼을 누르면 주문서가 복사되고 상담창이 열립니다. 카카오톡 입력창을 길게 눌러 ‘붙여넣기’ 후 전송해 주세요.</p><div id="order-status" role="status" aria-live="polite"></div><div class="cart-actions"><button class="button kakao" data-order-chat>주문서 복사하고 카카오톡 상담하기 <span>↗</span></button><button class="button primary" data-copy>주문서만 복사 <span>⧉</span></button><a class="button chat-retry" href="${chatUrl}" target="_blank" rel="noopener noreferrer" hidden>카카오톡 상담창 직접 열기 <span>↗</span></a></div>` : '';
    if(list.length) {
      document.querySelectorAll('[data-order-field]').forEach(input=>{input.value=orderDraft[input.dataset.orderField];});
      document.querySelector('#order-text').value=orderText();
    }
  }
  function orderStatus(message, retry=false) {
    document.querySelector('#order-status').textContent=message;
    document.querySelector('.chat-retry').hidden=!retry;
  }
  async function copyOrder() {
    const text=orderText();
    const area=document.querySelector('#order-text');area.value=text;
    try { await navigator.clipboard.writeText(text); return true; }
    catch (_) {
      area.focus();area.select();area.setSelectionRange(0,area.value.length);
      try { return document.execCommand('copy'); } catch (_) { return false; }
    }
  }
  document.addEventListener('input',event=>{
    const key=event.target.dataset.orderField;
    if(!Object.hasOwn(orderDraft,key))return;
    orderDraft[key]=event.target.value;
    document.querySelector('#order-text').value=orderText();
    orderStatus('');
  });
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href*="pf.kakao.com/"]');
    if(!link || link.classList.contains('chat-retry') || !selected().length)return;
    event.preventDefault();
    const cartDialog=document.querySelector('#cart-dialog');
    if(!cartDialog.open)cartDialog.showModal();
    document.querySelector('[data-order-chat]').focus();
  });

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
      const copied=await copyOrder();
      orderStatus(copied ? '주문서를 복사했습니다. 카카오톡 상담창에 붙여넣어 주세요.' : '자동 복사가 차단되었습니다. 선택된 주문서를 길게 누르거나 Ctrl/Cmd+C로 복사한 뒤 상담창을 열어 주세요.',true);
      if(copied)toast('주문서를 복사했어요.');
    }
    if(button.hasAttribute('data-order-chat')){
      if(!selected().length)return;
      button.disabled=true;
      // Reserve a tab during the user gesture so clipboard latency cannot block it.
      let chatWindow=null;
      try { chatWindow=window.open('about:blank','_blank');if(chatWindow)chatWindow.opener=null; } catch (_) {}
      const copied=await copyOrder();
      button.disabled=false;
      if(!copied){
        if(chatWindow)chatWindow.close();
        orderStatus('자동 복사가 차단되었습니다. 선택된 주문서를 길게 누르거나 Ctrl/Cmd+C로 복사한 뒤 아래 상담창 링크를 눌러 주세요.',true);
        return;
      }
      if(chatWindow && !chatWindow.closed){
        chatWindow.location.href=chatUrl;
        orderStatus('주문서가 복사되었습니다. 열린 카카오톡 상담창의 입력란에 붙여넣고 전송해 주세요.',true);
      } else {
        orderStatus('주문서는 복사되었습니다. 팝업이 차단되어 아래 ‘카카오톡 상담창 직접 열기’를 눌러 주세요.',true);
      }
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
