'use strict';
(() => {
  const {validate,escape:esc,photos}=window.ShopCatalog;
  const apartment=window.ShopCommunity.find(item=>item.id===document.body.dataset.apartment);
  const canonical=document.querySelector('link[rel="canonical"]').href;
  const shop=new URL('../',location.href);
  if(apartment)shop.searchParams.set('apartment',apartment.id);
  shop.hash='shop';
  let products=[],ready=false;
  const money=price=>price.toLocaleString('ko-KR')+'원';
  const area=document.querySelector('#share-text');
  if(area)area.value=canonical;
  function setReady(value){
    ready=value;document.querySelectorAll('[data-copy-promo],[data-download-promo]').forEach(button=>{button.disabled=!value;});
  }
  async function load(){
    const container=document.querySelector('#blog-products');container.setAttribute('aria-busy','true');
    try{
      const response=await fetch('../products.json',{cache:'no-store'});if(!response.ok)throw new Error('unavailable');
      products=validate(await response.json());
      container.innerHTML=products.map(p=>`<article class="blog-product ${p.soldOut?'is-sold-out':''}"><div class="blog-product-photo"><img loading="lazy" src="../${photos[p.kind]}" alt="${esc(p.name)} 참고 사진">${p.soldOut?'<span class="sold-out-badge">품절</span>':''}</div><h3>${esc(p.name)}</h3><p class="blog-product-size">${esc(p.size)}</p><strong>${money(p.price)}</strong>${p.soldOut?'<span class="blog-sold-out">현재 품절</span>':`<a href="${esc(shop.href)}">홈페이지에서 담기 ↗</a>`}</article>`).join('');
      setReady(true);
    }catch(_){
      products=[];setReady(false);if(area)area.value=canonical;
      container.innerHTML='<p class="blog-load-error" role="alert">상품 정보를 불러오지 못했습니다. <button type="button" data-reload-blog>다시 불러오기</button> 또는 <a href="../#shop">홈페이지에서 확인하기 ↗</a></p>';
    }finally{container.setAttribute('aria-busy','false');}
  }
  function promoText(){
    const intro=[...document.querySelectorAll('.article-intro>p,.article-intro>h2')].map(element=>element.textContent);
    const homepage=new URL('/',canonical);homepage.searchParams.set('apartment',apartment.id);homepage.hash='shop';
    const checked=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'medium'}).format(new Date());
    return [
      `${apartment.name} 과일 공동구매 안내`,...intro,'',
      '■ 이팜 과일 상품',...products.map(p=>`- ${p.name} ${p.size}: ${money(p.price)}${p.soldOut?' (품절)':''}`),
      `※ ${checked} 조회 기준입니다. 최신 가격과 재고는 홈페이지에서 확인해 주세요.`,
      '※ 사진은 과일 참고 이미지로 실제 상품과 다를 수 있습니다.','',
      '■ 참여 방법','1. 홈페이지에서 원하는 상품과 수량을 장바구니에 담아 주세요.',
      `2. 주문서 아파트 항목에서 ‘${apartment.name}’을 확인해 주세요.`,
      '3. 주문서 복사하기 후 카카오톡 채팅하기를 누르고 입력창에 붙여넣어 전송해 주세요.',
      '4. 최종 재고·금액·배송비·수령 방식·일정과 결제 방법 확인 후 주문이 확정됩니다.','',
      '■ 진행 조건','공동구매 마감일, 최소 주문 수량, 배송 가능 여부와 배송비, 수령 장소 및 방식은 단지별 상담 후 안내합니다.','',
      `상품·주문서: ${homepage.href}`,'카카오톡 상담: https://pf.kakao.com/_cxhCVn/chat','전화 상담: 010-7570-6357',
      `공동구매 안내 글: ${canonical}`,'운영: 주식회사 에이비씨허브 · 이팜','',
      `#${apartment.name.replace(/\s/g,'')} #아파트공동구매 #과일공동구매 #이팜`
    ].join('\n');
  }
  async function copy(text){
    area.value=text;area.rows=text===canonical?2:12;
    try{await navigator.clipboard.writeText(text);document.querySelector('#share-status').textContent=text===canonical?'공유 주소를 복사했습니다.':'홍보 글을 복사했습니다. 블로그나 커뮤니티 글쓰기 화면에 붙여넣어 주세요.';}
    catch(_){area.focus();area.select();area.setSelectionRange(0,area.value.length);document.querySelector('#share-status').textContent='자동 복사가 제한되어 내용을 선택했습니다. 길게 누르거나 Ctrl/Cmd+C로 복사해 주세요.';}
  }
  document.addEventListener('click',async event=>{
    if(event.target.closest('[data-reload-blog]'))load();
    if(event.target.closest('[data-copy-promo]')&&ready&&apartment)await copy(promoText());
    if(event.target.closest('[data-share-blog]')){
      if(navigator.share){
        try{await navigator.share({title:document.title,text:`${apartment.name} 과일 공동구매 소식`,url:canonical});return;}
        catch(error){if(error.name==='AbortError')return;}
      }
      await copy(canonical);
    }
    if(event.target.closest('[data-download-promo]')&&ready&&apartment){
      const url=URL.createObjectURL(new Blob(['\ufeff',promoText()],{type:'text/plain;charset=utf-8'}));
      const anchor=document.createElement('a');anchor.href=url;anchor.download=`이팜-${apartment.name}-공동구매안내.txt`;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  });
  window.addEventListener('offline',()=>{setReady(false);document.querySelector('#blog-products').innerHTML='<p class="blog-load-error" role="status">인터넷 연결 후 최신 상품과 가격을 다시 확인해 주세요.</p>';if(area)area.value=canonical;});
  window.addEventListener('online',load);
  load();
})();
