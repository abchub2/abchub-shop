'use strict';
(() => {
  const offlineNotice=document.querySelector('#offline-notice');
  let waitingWorker=null,updateRequested=false,reloading=false,reloadReady=false;
  let hadController=Boolean(navigator.serviceWorker?.controller);
  function connectionUi(){
    const catalogUnavailable=document.documentElement.dataset.catalogState==='error';
    offlineNotice.hidden=navigator.onLine&&!catalogUnavailable;
    offlineNotice.textContent=!navigator.onLine?'인터넷 연결이 끊겼습니다. 최신 가격과 품절 상태를 확인할 수 없어 주문을 잠시 중지합니다. 연결되면 자동으로 다시 불러옵니다.':'상품 정보를 불러올 수 없습니다. 연결 상태를 확인해 주세요. 최신 가격과 품절 상태를 확인할 수 없어 주문을 잠시 중지합니다.';
  }
  document.addEventListener('click',async event=>{
    if(event.target.closest('[data-app-update]')&&(waitingWorker||reloadReady)){
      const hasDraft=Array.from(document.querySelectorAll('[data-order-field]')).some(input=>input.value.trim());
      if(hasDraft&&!window.confirm('업데이트하면 입력 중인 주문서 정보가 초기화됩니다. 지금 업데이트할까요?'))return;
      updateRequested=true;
      if(reloadReady){reloading=true;location.reload();}
      else waitingWorker.postMessage({type:'SKIP_WAITING'});
    }
  });
  window.addEventListener('beforeinstallprompt',event=>event.preventDefault());
  window.addEventListener('online',connectionUi);window.addEventListener('offline',connectionUi);window.addEventListener('shop:catalog-state',connectionUi);
  connectionUi();
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

      }
    });
  }
})();
