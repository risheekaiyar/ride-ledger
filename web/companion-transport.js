/* Native credentials are never returned to the page. Both paths preserve response status. */
(function(root){
 const pending=new Map();let sequence=0;
 root.odoCompanionReply=(id,result)=>{const call=pending.get(id);if(!call)return;pending.delete(id);clearTimeout(call.timer);if(result.ok)call.resolve(result.data);else call.reject(Error(result.error||result.data?.error||'Companion request failed.'));};
 root.odoCompanionRequest=async(method,body)=>{
  if(root.OdoNativeCompanion){return new Promise((resolve,reject)=>{const id=String(++sequence),timer=setTimeout(()=>{pending.delete(id);reject(Error('Companion connection timed out.'));},65000);pending.set(id,{resolve,reject,timer});try{root.OdoNativeCompanion.request(id,method,body?JSON.stringify(body):'');}catch(e){clearTimeout(timer);pending.delete(id);reject(Error('Native companion transport unavailable.'));}});}
  const frame=method==='FRAME';
  const response=await fetch(method==='GET'?'/api/muse/status':frame?'/api/muse/frame':'/api/muse/insights',{method:frame?'POST':method,cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Companion request failed.');return data;
 };
})(window);
