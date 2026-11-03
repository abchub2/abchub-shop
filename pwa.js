'use strict';
(() => {
  const dialog=document.querySelector('#install-dialog');
  const banner=document.querySelector('#app-install');
  const offlineNotice=document.querySelector('#offline-notice');
  const installStatus=document.querySelector('#install-status');
  const standalone=window.matchMedia('(display-mode: standalone)');
  let deferredPrompt=null,waitingWorker=null,updateRequested=false,reloading=false,reloadReady=false;
  let hadController=Boolean(navigator.serviceWorker?.controller);
  const installed=()=>standalone.matches||navigator.standalone===true;
  const iphone=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const android=/Android/.test(navigator.userAgent);
  const inApp=/KAKAOTALK|NAVER|Instagram|FBAN|FBAV/i.test(navigator.userAgent);
  function updateInstallUi(){
    document.querySelectorAll('[data-install-app]').forEach(button=>{
      button.hidden=installed();
      button.textContent=deferredPrompt?'이팜 앱 설치':'앱 설치 안내';
    });
    banner.hidden=installed();
  }
  function connectionUi(){
    const catalogUnavailable=document.documentElement.dataset.catalogState==='error';
    offlineNotice.hidden=navigator.onLine&&!catalogUnavailable;
    offlineNotice.textContent=!navigator.onLine?'인터넷 연결이 끊겼습니다. 최신 가격과 품절 상태를 확인할 수 없어 주문을 잠시 중지합니다. 연결되면 자동으로 다시 불러옵니다.':'상품 정보를 불러올 수 없습니다. 연결 상태를 확인해 주세요. 최신 가격과 품절 상태를 확인할 수 없어 주문을 잠시 중지합니다.';
  }
  function help(){
    document.querySelector('#install-ios').hidden=android&&!iphone;
    document.querySelector('#install-android').hidden=iphone;
    document.querySelector('#install-inapp').hidden=!inApp;
    document.querySelector('#install-url').value=new URL('./',location.href).href;
    if(!dialog.open)dialog.showModal();
  }
  document.addEventListener('click',async event=>{
    if(event.target.closest('[data-install-app]')){
      if(deferredPrompt){
        const prompt=deferredPrompt;deferredPrompt=null;
        try{await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==='accepted'){banner.hidden=true;return;}}
        catch(_){}
        updateInstallUi();
      }
      help();
    }
    if(event.target.closest('[data-app-close]'))dialog.close();
    if(event.target.closest('[data-copy-app-url]')){
      const field=document.querySelector('#install-url');
      try{await navigator.clipboard.writeText(field.value);installStatus.textContent='주소를 복사했습니다. 휴대폰의 Safari 또는 Chrome·삼성 인터넷에서 열어 주세요.';}
      catch(_){field.focus();field.select();field.setSelectionRange(0,field.value.length);installStatus.textContent='선택된 주소를 길게 누르거나 Ctrl/Cmd+C로 복사해 주세요.';}
    }
    if(event.target.closest('[data-app-update]')&&(waitingWorker||reloadReady)){
      const hasDraft=Array.from(document.querySelectorAll('[data-order-field]')).some(input=>input.value.trim());
      if(hasDraft&&!window.confirm('업데이트하면 입력 중인 주문서 정보가 초기화됩니다. 지금 업데이트할까요?'))return;
      updateRequested=true;
      if(reloadReady){reloading=true;location.reload();}
      else waitingWorker.postMessage({type:'SKIP_WAITING'});
    }
  });
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;updateInstallUi();});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;banner.hidden=true;document.querySelectorAll('[data-install-app]').forEach(button=>{button.hidden=true;});if(dialog.open)dialog.close();});
  standalone.addEventListener?.('change',updateInstallUi);
  window.addEventListener('online',connectionUi);window.addEventListener('offline',connectionUi);window.addEventListener('shop:catalog-state',connectionUi);
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
  });
  updateInstallUi();connectionUi();
  if('serviceWorker' in navigator&&window.isSecureContext){
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if((hadController||updateRequested)&&!reloading){
        if(updateRequested){reloading=true;location.reload();}
        else{reloadReady=true;waitingWorker=null;document.querySelector('#app-update').hidden=false;}
      }
      hadController=true;
    });
    window.addEventListener('load',async()=>{
      try{
        const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
        function showUpdate(){
          if(registration.waiting&&navigator.serviceWorker.controller){waitingWorker=registration.waiting;document.querySelector('#app-update').hidden=false;}
        }
        showUpdate();
        registration.addEventListener('updatefound',()=>{
          const worker=registration.installing;
          worker?.addEventListener('statechange',()=>{if(worker.state==='installed')showUpdate();});
        });
      }catch(_){
        // Shopping remains available online when app installation storage is unavailable.
        installStatus.textContent='이 브라우저에서는 앱의 오프라인 준비를 완료하지 못했습니다. 온라인 홈페이지는 계속 이용할 수 있습니다.';
      }
    });
  }
})();
