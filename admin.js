'use strict';
(() => {
  const {validate,serialize,escape:esc,photos}=window.ShopCatalog;
  const repository='abchub2/abchub-shop';
  const apiRoot=`https://api.github.com/repos/${repository}`;
  const catalogPath='/contents/products.json';
  const $=selector=>document.querySelector(selector);
  let token='',sha='',products=[],baseline='',saving=false,session=0;
  function status(message,error=false){$('#admin-status').textContent=message;$('#admin-status').classList.toggle('error',error);}
  function dirty(){try{return serialize(products)!==baseline;}catch(_){return true;}}
  function updateSaveState(){
    const changed=dirty();
    $('#save-button').disabled=saving||!changed;
    $('#save-state').textContent=saving?'GitHub에 저장하는 중입니다…':changed?'저장하지 않은 변경 사항이 있습니다.':'저장된 내용과 같습니다.';
  }
  async function api(path,options={}){
    let response;
    try{
      response=await fetch(apiRoot+path,{...options,cache:'no-store',credentials:'omit',redirect:'error',headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28',...(options.body?{'Content-Type':'application/json'}:{})}});
    }catch(_){throw new Error('GitHub에 연결하지 못했습니다. 인터넷 연결과 브라우저의 네트워크 설정을 확인해 주세요.');}
    if(!response.ok){
      const messages={401:'인증 토큰이 올바르지 않거나 만료되었습니다. 다시 인증해 주세요.',403:'GitHub 접근이 거부되었습니다. 저장소 권한, Contents 쓰기 권한, 조직 승인과 요청 한도를 확인해 주세요.',404:'상품 파일을 읽을 수 없습니다. abchub2/abchub-shop 저장소 선택과 Contents 권한을 확인해 주세요.',409:'다른 곳에서 상품 정보가 바뀌었습니다. 수정 내용을 별도로 기록한 뒤 저장된 상품을 다시 불러와 주세요.',422:'저장 요청이 거부되었습니다. 다른 변경 사항이나 브랜치 보호 규칙을 확인한 뒤 다시 불러와 주세요.'};
      throw new Error(messages[response.status]||`GitHub 요청에 실패했습니다 (${response.status}). 변경 내용을 유지한 채 다시 확인해 주세요.`);
    }
    return response.json();
  }
  function decodeContent(file){
    if(file.encoding!=='base64'||typeof file.content!=='string'||typeof file.sha!=='string')throw new Error('상품 파일 응답 형식이 올바르지 않습니다.');
    const bytes=Uint8Array.from(atob(file.content.replace(/\s/g,'')),char=>char.charCodeAt(0));
    return {products:validate(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))),sha:file.sha};
  }
  function encodeContent(text){
    const bytes=new TextEncoder().encode(text);let binary='';
    for(const byte of bytes)binary+=String.fromCharCode(byte);
    return btoa(binary);
  }
  function render(){
    $('#admin-products').innerHTML=products.map(p=>`<article class="admin-product" data-product="${p.id}"><div class="admin-product-heading"><img src="${photos[p.kind]}" alt="과일 참고 사진"><div><h3>${esc(p.name)} ${esc(p.size)}</h3><p><span class="admin-sale-state ${p.soldOut?'sold-out':''}">${p.soldOut?'품절':'판매 중'}</span></p></div></div><div class="admin-grid"><label class="admin-field">상품명<input data-field="name" value="${esc(p.name)}" maxlength="80" required></label><label class="admin-field">중량·구성<input data-field="size" value="${esc(p.size)}" maxlength="40" required placeholder="예: 2kg"></label><label class="admin-field">판매 가격 (원)<input data-field="price" type="number" value="${p.price}" min="1" max="10000000" step="1" inputmode="numeric" required></label><label class="admin-field">상품 분류<select data-field="category">${[['small','소포장'],['family','가족용'],['group','공동구매']].map(([value,label])=>`<option value="${value}" ${p.category===value?'selected':''}>${label}</option>`).join('')}</select></label><label class="admin-field">상품 사진<select data-field="kind">${[['grapes','포도송이'],['mandarins','감귤류'],['apples','사과'],['shinanoGold','시나노골드 실물 사진']].map(([value,label])=>`<option value="${value}" ${p.kind===value?'selected':''}>${label}</option>`).join('')}</select></label><label class="admin-field admin-field-wide">상품 설명<textarea data-field="description" rows="3" maxlength="2000">${esc(p.description)}</textarea></label></div><label class="admin-stock"><input data-field="soldOut" type="checkbox" ${p.soldOut?'checked':''}><span>품절로 표시<small>체크하면 장바구니 담기와 주문이 중지됩니다.</small></span></label></article>`).join('');
    updateSaveState();
  }
  function setBusy(value){saving=value;$('#products-fields').disabled=value;$('#reload-button').disabled=value;$('#logout-button').disabled=value;$('#products-form').setAttribute('aria-busy',String(value));updateSaveState();}
  function logout(){
    session++;token='';sha='';products=[];baseline='';saving=false;
    $('#github-token').value='';$('#editor-panel').hidden=true;$('#login-panel').hidden=false;$('#admin-products').replaceChildren();$('#login-button').disabled=false;
    status('로그아웃했습니다. 인증 정보는 저장되지 않습니다.');
  }
  $('#login-form').addEventListener('submit',async event=>{
    event.preventDefault();const attempt=++session;token=$('#github-token').value.trim();$('#github-token').value='';if(!token)return;
    $('#login-button').disabled=true;status('GitHub 권한과 상품 파일을 확인하는 중입니다…');
    try{
      const repo=await api('');if(attempt!==session)return;
      if(repo.permissions?.push!==true)throw new Error('이 저장소에 쓰기 권한이 있는 GitHub 관리자 계정으로 인증해 주세요.');
      const current=decodeContent(await api(catalogPath+'?ref=main'));if(attempt!==session)return;
      products=current.products;sha=current.sha;baseline=serialize(products);render();
      $('#login-panel').hidden=true;$('#editor-panel').hidden=false;status('GitHub 관리자 계정으로 상품을 불러왔습니다. 변경 후 저장 버튼을 눌러 주세요.');
    }catch(error){if(attempt!==session)return;token='';status(error.message,true);}
    finally{if(attempt===session)$('#login-button').disabled=false;}
  });
  $('#products-form').addEventListener('input',event=>{
    const input=event.target;const field=input.dataset.field;if(!field)return;
    const card=input.closest('[data-product]');const product=products.find(p=>p.id===card.dataset.product);if(!product)return;
    product[field]=field==='soldOut'?input.checked:field==='price'?Number(input.value):input.value;
    card.querySelector('h3').textContent=`${product.name} ${product.size}`;
    const badge=card.querySelector('.admin-sale-state');badge.textContent=product.soldOut?'품절':'판매 중';badge.classList.toggle('sold-out',product.soldOut);
    if(field==='kind')card.querySelector('img').src=photos[product.kind];
    updateSaveState();
  });
  $('#products-form').addEventListener('submit',async event=>{
    event.preventDefault();if(!token||saving||!dirty())return;
    let content;try{content=serialize(products);}catch(error){status(error.message,true);return;}
    setBusy(true);status('변경 사항을 확인하고 GitHub에 저장하는 중입니다…');
    try{
      const latest=await api(catalogPath+'?ref=main');
      if(latest.sha!==sha)throw new Error('다른 곳에서 상품 정보가 변경되었습니다. 입력 내용을 별도로 기록하고 ‘저장된 상품 다시 불러오기’를 눌러 주세요. 덮어쓰기는 하지 않았습니다.');
      const result=await api(catalogPath,{method:'PUT',body:JSON.stringify({message:'Update storefront products and availability',content:encodeContent(content),sha,branch:'main'})});
      if(!result.content?.sha)throw new Error('저장 요청 후 확인 정보를 받지 못했습니다. 다시 저장하기 전에 GitHub의 상품 파일과 배포 상태를 확인해 주세요.');
      sha=result.content.sha;baseline=content;status('GitHub에 저장했습니다. 자동 배포 후 모든 방문자에게 반영됩니다. 보통 1~3분 뒤 홈페이지를 새로고침해 확인해 주세요.');
    }catch(error){status(error.message,true);}
    finally{setBusy(false);}
  });
  $('#reload-button').addEventListener('click',async()=>{
    if(saving||!token)return;
    if(dirty()&&!window.confirm('저장하지 않은 수정 내용을 버리고 저장된 상품을 다시 불러올까요?'))return;
    setBusy(true);status('저장된 상품을 다시 불러오는 중입니다…');
    try{const current=decodeContent(await api(catalogPath+'?ref=main'));products=current.products;sha=current.sha;baseline=serialize(products);render();status('저장된 상품을 다시 불러왔습니다.');}
    catch(error){status(error.message,true);}finally{setBusy(false);}
  });
  $('#logout-button').addEventListener('click',()=>{if(dirty()&&!window.confirm('저장하지 않은 변경 사항을 버리고 로그아웃할까요?'))return;logout();});
  window.addEventListener('beforeunload',event=>{if(saving||(!$('#editor-panel').hidden&&dirty())){event.preventDefault();event.returnValue='';}});
})();
