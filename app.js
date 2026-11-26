/* CONFIG: paste the deployed Google Apps Script Web App URL below. */
const API_URL = 'https://script.google.com/macros/s/AKfycbxLKn51PIxFCeOOebCmGbZcJKBix3Jc0xtNjjyl_OZQS5Ym27IffWS7ppQRQ3aO89PP/exec';
const SOURCE_URL = 'https://docs.google.com/spreadsheets/d/1o7k8Xd-ANLerszXj3uZPY1LTWoNYRQ4coIMc8HF8_90/edit?usp=sharing';
const STATUS_OPTIONS = ['Start', 'Processing', 'Complated'];
let tasks = [];
const $ = (id) => document.getElementById(id);
$('sourceLink').href = SOURCE_URL;

function setSync(text, isError=false){ $('syncState').textContent=text; $('syncState').style.color=isError?'#bd4045':''; }
function dateValue(value){ if(!value) return null; const d=new Date(value); return Number.isNaN(d.getTime())?null:d; }
function deadlineLabel(task){
  if(task.status==='Complated') return {text:'Completed',cls:'done'};
  const d=dateValue(task.targetDate); if(!d) return {text:'No target date',cls:''};
  const today=new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0);
  const diff=Math.ceil((d-today)/86400000);
  if(diff<0) return {text:`Overdue ${Math.abs(diff)} day${Math.abs(diff)===1?'':'s'}`,cls:'overdue'};
  if(diff<=7) return {text:diff===0?'Due today':`Due in ${diff} day${diff===1?'':'s'}`,cls:'soon'};
  return {text:'On track',cls:'ok'};
}
function normalizeTask(t){return {...t, status:STATUS_OPTIONS.includes(t.status)?t.status:'Start'};}
function renderStats(){
 const total=tasks.length, start=tasks.filter(t=>t.status==='Start').length, processing=tasks.filter(t=>t.status==='Processing').length, completed=tasks.filter(t=>t.status==='Complated').length;
 const overdue=tasks.filter(t=>deadlineLabel(t).cls==='overdue').length, soon=tasks.filter(t=>deadlineLabel(t).cls==='soon').length;
 $('totalCount').textContent=total; $('startCount').textContent=start; $('processingCount').textContent=processing; $('completedCount').textContent=completed; $('overdueCount').textContent=overdue; $('soonCount').textContent=soon;
}
function render(){
 renderStats();
 const query=$('searchInput').value.trim().toLowerCase(), status=$('statusFilter').value, group=$('groupFilter').value;
 const shown=tasks.filter(t=>(group==='all'||t.groupKey===group)&&(status==='all'||t.status===status)&&(!query||[t.task,t.owner,t.status,t.group].join(' ').toLowerCase().includes(query)));
 $('visibleCount').textContent=`${shown.length} task${shown.length===1?'':'s'}`;
 if(!shown.length){$('taskRows').innerHTML='<tr><td colspan="7" class="empty">No matching tasks found.</td></tr>';return;}
 $('taskRows').innerHTML=shown.map(t=>{
   const warning=deadlineLabel(t);
   const date=t.targetDate?new Date(t.targetDate).toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'}):'—';
   return `<tr data-id="${escapeHtml(t.id)}"><td><span class="section-label">${escapeHtml(t.group)}</span></td><td><input class="task-input" value="${escapeHtml(t.task)}" aria-label="Task name" data-task="${escapeHtml(t.id)}"></td><td class="owner-cell">${escapeHtml(t.owner||'—')}</td><td class="date-cell">${date}</td><td><select class="status-select" data-status="${escapeHtml(t.id)}">${STATUS_OPTIONS.map(s=>`<option ${s===t.status?'selected':''}>${s}</option>`).join('')}</select></td><td><span class="deadline ${warning.cls}">${warning.text}</span></td><td><button class="save-btn" data-save="${escapeHtml(t.id)}">Save</button></td></tr>`;
 }).join('');
 document.querySelectorAll('[data-save]').forEach(btn=>btn.addEventListener('click',()=>saveTask(btn.dataset.save,btn)));
}
function escapeHtml(str){return String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
// JSONP avoids browser CORS problems with Apps Script redirects. Requires matching Code.gs.
function jsonp(params){
 return new Promise((resolve,reject)=>{
   const cb='ew27cb_'+Date.now()+'_'+Math.floor(Math.random()*100000);
   const script=document.createElement('script');
   const timeout=setTimeout(()=>{cleanup();reject(new Error('Apps Script did not respond. Check deployment/access settings.'));},15000);
   function cleanup(){clearTimeout(timeout);delete window[cb];script.remove();}
   window[cb]=(data)=>{cleanup();resolve(data);};
   script.onerror=()=>{cleanup();reject(new Error('Could not reach Apps Script URL.'));};
   const query=new URLSearchParams({...params,callback:cb});
   script.src=API_URL+'?'+query.toString();
   document.body.appendChild(script);
 });
}
async function loadData(){
 if(!API_URL||API_URL.includes('PASTE_YOUR')){setSync('Apps Script URL not configured',true);$('taskRows').innerHTML='<tr><td colspan="7" class="empty">Deploy Apps Script, then paste its Web App URL into app.js.</td></tr>';return;}
 setSync('Loading…');
 try{const data=await jsonp({action:'list'});if(data.error)throw new Error(data.error);tasks=(data.tasks||[]).map(normalizeTask);render();setSync('Live data connected');}
 catch(e){setSync('Connection error',true);$('taskRows').innerHTML=`<tr><td colspan="7" class="empty">Could not load the sheet. ${escapeHtml(e.message)}</td></tr>`;}
}
async function saveTask(id,btn){
 const task=tasks.find(t=>String(t.id)===String(id));if(!task)return;
 const newTask=document.querySelector(`[data-task="${CSS.escape(String(id))}"]`).value.trim();const newStatus=document.querySelector(`[data-status="${CSS.escape(String(id))}"]`).value;
 if(!newTask){alert('Task name cannot be blank.');return;}
 btn.disabled=true;btn.textContent='Saving…';
 try{const data=await jsonp({action:'update',id:String(id),task:newTask,status:newStatus});if(data.error)throw new Error(data.error);task.task=newTask;task.status=newStatus;render();setSync('Changes saved');}
 catch(e){btn.disabled=false;btn.textContent='Save';alert('Save failed: '+e.message);}
}
$('refreshBtn').addEventListener('click',loadData);$('searchInput').addEventListener('input',render);$('statusFilter').addEventListener('change',render);$('groupFilter').addEventListener('change',render);
loadData();
