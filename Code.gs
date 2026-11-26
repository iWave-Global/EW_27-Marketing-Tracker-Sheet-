/** EW27 Marketing Tracker API — Google Apps Script backend (JSONP) */
const SPREADSHEET_ID = '1o7k8Xd-ANLerszXj3uZPY1LTWoNYRQ4coIMc8HF8_90';
const SHEET_NAME = 'Marketing Plan';
const STATUS_VALUES = ['Start', 'Processing', 'Complated'];

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = p.action || 'list';
  let result;
  try {
    if (action === 'update') result = updateTask_(p);
    else if (action === 'list') result = listTasks_();
    else result = {error:'Unsupported action'};
  } catch(err) { result = {error:String(err)}; }
  return output_(result, p.callback);
}
function listTasks_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  const rows = sheet.getRange(1, 1, Math.max(lastRow, 1), 10).getValues();
  const out = [];
  for (let r = 2; r <= rows.length; r++) {
    const row = rows[r-1], task = row[1];
    if (task && String(task).trim()) out.push({id:'marketing:'+r,group:'Marketing Plan',groupKey:'marketing',task:String(task),owner:String(row[2]||''),targetDate:dateIso_(row[3]),status:String(row[4]||'Start')});
  }
  for (let r = 2; r <= rows.length; r++) {
    const row = rows[r-1], task = row[6];
    if (task && String(task).trim()) out.push({id:'activity:'+r,group:'Dinoop & Mariraj Activity',groupKey:'activity',task:String(task),owner:String(row[7]||''),targetDate:dateIso_(row[8]),status:String(row[9]||'Start')});
  }
  return {tasks:out};
}
function updateTask_(p) {
  const id=String(p.id||''), taskName=String(p.task||'').trim(), status=String(p.status||'');
  if(!taskName) return {error:'Task name is required'};
  if(!STATUS_VALUES.includes(status)) return {error:'Invalid status'};
  const parts=id.split(':'), group=parts[0], row=Number(parts[1]);
  if(!['marketing','activity'].includes(group)||!Number.isInteger(row)||row<2) return {error:'Invalid task identifier'};
  const taskCol=group==='marketing'?2:7, statusCol=group==='marketing'?5:10;
  const sheet=getSheet_();
  if(!sheet.getRange(row,taskCol).getValue()) return {error:'Task row no longer exists'};
  sheet.getRange(row,taskCol).setValue(taskName);
  sheet.getRange(row,statusCol).setValue(status);
  return {success:true};
}
function getSheet_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  // Match tab names while ignoring accidental leading/trailing spaces and case.
  const wanted = String(SHEET_NAME).trim().toLowerCase();
  const sheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === wanted);
  if(!sheet) {
    const available = ss.getSheets().map(s => '[' + s.getName() + ']').join(', ');
    throw new Error('Configured tab \"' + SHEET_NAME + '\" not found. Available tabs: ' + available);
  }
  return sheet;
}
function dateIso_(v){if(!v)return '';if(v instanceof Date&&!isNaN(v.getTime()))return v.toISOString();return String(v);}
function output_(obj, callback){
  const json=JSON.stringify(obj);
  if(callback && /^[A-Za-z0-9_$.]+$/.test(callback)) return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
