"use strict";

// 词尾活用属于同一个语法单位；选择接续成分时才产生另一个单位。
// 六类活用形与实际词尾分别建模。同形「く」「け」必须能指向不同接续规则。
const verbInflections = [
  {id:"mizen-a",form:"未然形",ending:"か",variant:"否定・使役",attaches:[["ない","否定助动词"],["せる","使役助动词"]]},
  {id:"mizen-o",form:"未然形",ending:"こ",variant:"意向",attaches:[["う","意向助动词"]]},
  {id:"renyou",form:"连用形",ending:"き",variant:"通常",attaches:[["ます","礼貌助动词"]]},
  {id:"renyou-onbin",form:"连用形",ending:"い",variant:"イ音便",attaches:[["た","过去助动词"],["て","接续助词"]]},
  {id:"terminal",form:"终止形",ending:"く",variant:"",attaches:[["まい","否定推量助动词"],["らしい","推定助动词"]]},
  {id:"attributive",form:"连体形",ending:"く",variant:"",attaches:[["ようだ","比况助动词"]]},
  {id:"conditional",form:"假定形",ending:"け",variant:"",attaches:[["ば","接续助词"]]},
  {id:"imperative",form:"命令形",ending:"け",variant:"",attaches:[]}
];
const verbForms = Object.fromEntries(verbInflections.map(item=>[item.id,item]));
// 活用类型与所需接续形独立编码。仅收录当前验证过的助动词及后续成分。
const auxiliaryInflections = {
  "ない": [
    {id:"nai-mizen",form:"未然形",stem:"な",ending:"かろ",attaches:[["う","推量助动词"]]},
    {id:"nai-renyou-ku",form:"连用形",stem:"な",ending:"く",variant:"通常",attaches:[["て","接续助词"]]},
    {id:"nai-renyou-katt",form:"连用形",stem:"な",ending:"かっ",variant:"过去接续",attaches:[["た","过去助动词"]]},
    {id:"nai-terminal",form:"终止形",stem:"な",ending:"い",attaches:[["らしい","推定助动词"]]},
    {id:"nai-attributive",form:"连体形",stem:"な",ending:"い",attaches:[["ようだ","比况助动词"]]},
    {id:"nai-conditional",form:"假定形",stem:"な",ending:"けれ",attaches:[["ば","接续助词"]]}
  ],
  "ます": [
    {id:"masu-mizen-mase",form:"未然形",stem:"ま",ending:"せ",attaches:[["ん","否定助动词"]]},
    {id:"masu-mizen-masho",form:"未然形",stem:"ま",ending:"しょ",variant:"意向",attaches:[["う","意向助动词"]]},
    {id:"masu-renyou",form:"连用形",stem:"ま",ending:"し",attaches:[["た","过去助动词"]]},
    {id:"masu-terminal",form:"终止形",stem:"ま",ending:"す",attaches:[["まい","否定推量助动词"]]}
  ],
  "せる": [
    {id:"seru-mizen",form:"未然形",stem:"せ",ending:"",variant:"去る",attaches:[["ない","否定助动词"],["られる","被动助动词"],["まい","否定推量助动词"]]},
    {id:"seru-renyou",form:"连用形",stem:"せ",ending:"",variant:"去る",attaches:[["ます","礼貌助动词"],["たい","愿望助动词"]]},
    {id:"seru-terminal",form:"终止形",stem:"せ",ending:"る",attaches:[["らしい","推定助动词"]]},
    {id:"seru-attributive",form:"连体形",stem:"せ",ending:"る",attaches:[["ようだ","比况助动词"]]},
    {id:"seru-conditional",form:"假定形",stem:"せ",ending:"れ",attaches:[["ば","接续助词"]]},
    {id:"seru-imperative",form:"命令形",stem:"せ",ending:"ろ",attaches:[]}
  ]
};
const auxiliaryDefaults = {"ない":"nai-terminal","ます":"masu-terminal","せる":"seru-terminal"};
const attachmentInfo = {
  "ない":{title:"否定助动词",body:"接在动词未然形后，内部词尾「い」可变成「かっ」和「く」。"},
  "せる":{title:"使役助动词",body:"五段动词未然形「書か」接「せる」。活用词尾可进一步变化，再接否定、被动、礼貌等成分。"},
  "ます":{title:"礼貌助动词",body:"动词及相应助动词的连用形可接「ます」。本例进一步展示「ませ」「ましょ」「まし」等形式的后接。"},
  "ば":{title:"接续助词",body:"可接用言或助动词的假定形，如「書けば」「書かなければ」「書かせれば」。"},
  "う":{title:"推量・意向助动词",body:"依前接成分形成推量或意向，如「書こう」「書きましょう」「書かなかろう」。"},
  "た":{title:"过去助动词",body:"可接适当连用形，如「書かなかった」「書きました」「書いた」。"},
  "て":{title:"接续助词",body:"连用形或相应音便形后面可以接「て」，如「書いて」「書かなくて」。"},
  "まい":{title:"否定推量・意志助动词",body:"五段动词终止形及部分助动词的相应形式可接「まい」。更多前接条件可到「まい」入口探索。"},
  "らしい":{title:"推定助动词",body:"动词、形容词及部分助动词的相应终止形可接「らしい」。"},
  "ようだ":{title:"比况助动词",body:"相应连体形可接「ようだ」，如「書くようだ」「書かないようだ」。"},
  "ん":{title:"否定助动词",body:"礼貌助动词「ます」的未然形「ませ」后接「ん」：書きません。"},
  "られる":{title:"被动助动词",body:"使役助动词「せる」的未然形「せ」后接「られる」：書かせられる。"},
  "たい":{title:"愿望助动词",body:"使役助动词「せる」的连用形「せ」后接「たい」：書かせたい。"}
};
// 依据用户所给《まい》教材页整理分类，不把例句作为必需数据。
const maiTree = {
  mai:{label:"まい",kind:"助动词",note:"否定的推量、意志或劝诱；后接「ぞ」还可表示禁止。",children:["meaning","connection"]},
  meaning:{label:"意义",kind:"意义分类",children:["guess","will","invitation","ban"]},
  guess:{label:"否定推量",kind:"意义",children:[]},
  will:{label:"否定意志",kind:"意义",children:[]},
  invitation:{label:"否定劝诱",kind:"意义",children:[]},
  ban:{label:"禁止",kind:"后接终助词「ぞ」",children:[]},
  connection:{label:"接续法",kind:"接续条件",children:["verbs","auxiliaries"]},
  verbs:{label:"动词",kind:"词类",children:["godan","ichidan","kahen","sahen"]},
  godan:{label:"五段动词",kind:"活用类别",children:["gTerminal"]},
  gTerminal:{label:"终止形",kind:"接续形",children:[]},
  ichidan:{label:"一段动词",kind:"活用类别",children:["iIrrealis"]},
  iIrrealis:{label:"未然形",kind:"接续形",children:[]},
  kahen:{label:"カ变动词",kind:"活用类别",children:["kIrrealis"]},
  kIrrealis:{label:"未然形",kind:"接续形",children:[]},
  sahen:{label:"サ变动词",kind:"活用类别",children:["sIrrealis"]},
  sIrrealis:{label:"未然形",kind:"接续形",children:[]},
  auxiliaries:{label:"助动词",kind:"词类",children:["masu","causative","passive"]},
  masu:{label:"ます",kind:"礼貌助动词",children:["mTerminal"]},
  mTerminal:{label:"终止形",kind:"接续形",children:[]},
  causative:{label:"（さ）せる",kind:"使役助动词",children:["cIrrealis"]},
  cIrrealis:{label:"未然形",kind:"接续形",children:[]},
  passive:{label:"（ら）れる",kind:"被动助动词",children:["pIrrealis"]},
  pIrrealis:{label:"未然形",kind:"接续形",children:[]}
};
const makeInitial = () => ({ formId:"terminal", formPicked:false, ending:"く", editor:null, attachment:null, auxFormId:null, auxPicked:false, auxEditor:false, tail:null, folded:{}, offsets:{}, atomOffsets:{} });
let kaku = makeInitial();
let kakuHistory = [];
let maiPath = ["mai"], maiExpanded = false;
let mode = "kaku";
const SVG_NS="http://www.w3.org/2000/svg";
const svg=document.getElementById("graph");
const stage=document.getElementById("stage");
const tip=document.getElementById("popover");
const byId=id=>document.getElementById(id);
const clone = state => JSON.parse(JSON.stringify(state));
const verbForm = () => verbForms[kaku.formId];
const auxiliaryForms = () => auxiliaryInflections[kaku.attachment]||[];
const auxiliaryForm = () => auxiliaryForms().find(item=>item.id===kaku.auxFormId);
const unitSuffix = () => auxiliaryForm()
  ? auxiliaryForm().stem+auxiliaryForm().ending : (kaku.attachment||"");
const surface = () => "書"+kaku.ending+unitSuffix()+(kaku.tail||"");
function updateKaku(fn) {
  kakuHistory.push(clone(kaku));
  fn();
  render();
}
function chooseVerb(formId){
  const selected=verbForms[formId];
  if(!selected)throw new Error("Unknown form: "+formId);
  updateKaku(()=>{
    if(kaku.formId!==formId){
      kaku.attachment=null;kaku.tail=null;kaku.auxFormId=null;kaku.auxPicked=false;kaku.auxEditor=false;
      delete kaku.folded.auxiliary;delete kaku.folded.tail;
    }
    kaku.formId=formId;kaku.ending=selected.ending;kaku.formPicked=true;
    // 保留整列候选；可重新选择另一种活用形，已选分支高亮。
    kaku.editor="verb";
  });
}
function chooseAuxiliary(formId){
  const selected=auxiliaryForms().find(item=>item.id===formId);
  if(!selected)throw new Error("Unknown auxiliary form: "+formId);
  updateKaku(()=>{
    if(kaku.auxFormId!==formId)kaku.tail=null;
    kaku.auxFormId=formId;kaku.auxPicked=true;kaku.auxEditor=true;
  });
}
function attach(next){
  updateKaku(()=>{
    if(kaku.attachment){
      kaku.tail=next;
    }else{
      kaku.attachment=next;kaku.auxFormId=auxiliaryDefaults[next]||null;
      kaku.auxPicked=false;kaku.auxEditor=false;kaku.tail=null;
      delete kaku.folded.auxiliary;
    }
  });
}
function fold(id){updateKaku(()=>{kaku.folded[id]=!kaku.folded[id];if(kaku.folded[id]&&kaku.editor===id)kaku.editor=null;if(id==="auxiliary"&&kaku.folded[id])kaku.auxEditor=false;});}
function expandEnding(id) {
  updateKaku(()=>{
    if(kaku.folded[id])kaku.folded[id]=false;
    if(id==="verb")kaku.editor=kaku.editor==="verb"?null:"verb";
    if(id==="auxiliary")kaku.auxEditor=!kaku.auxEditor;
  });
}
function resetCurrent(){
  if(mode==="kaku"){kaku=makeInitial();kakuHistory=[];}
  else{maiPath=["mai"];maiExpanded=false;maiOffsets={};maiAtomOffsets={};}
  render();
}
function back(){
  if(mode==="kaku"&&kakuHistory.length)kaku=kakuHistory.pop();
  if(mode==="mai"){if(maiExpanded)maiExpanded=false;else if(maiPath.length>1){maiPath.pop();maiExpanded=true;}}
  render();
}
function changeMode(next){mode=next;resetCurrent();}
function showInfo(title,detail){byId("info-title").textContent=title;byId("info-text").textContent=detail;tip.hidden=false;}


let maiOffsets={},maiAtomOffsets={};
function chooseMai(id,depth) {
  if (maiPath[depth]===id) maiExpanded=!maiExpanded;
  else {maiPath=maiPath.slice(0,depth).concat(id);maiExpanded=!!maiTree[id].children.length;}
  render();
}
function kakuModels(){
 const active=verbForm();
 const suffixOpen=kaku.editor==="verb"&&!kaku.folded.verb;
 const title=!kaku.formPicked?"基本形":active.form;
 const models=[{
  id:"verb",title:"五段动词 · "+(suffixOpen&&!kaku.formPicked?"活用":title),
  atoms:suffixOpen?[{id:"stem",text:"書",role:"词干"}]:
    [{id:"stem",text:"書",role:"词干"},{id:"ending",text:kaku.ending,role:"活用词尾"}],
  choices:suffixOpen?verbInflections.map(item=>({
    id:item.id,text:item.ending,form:item.form,variant:item.variant,
    role:item.form+(item.variant?" · "+item.variant:""),
    selected:item.id===kaku.formId,choose:()=>chooseVerb(item.id)
  })):[],
  onClick:()=>expandEnding("verb"),
  note:"六种活用形（未然、连用、终止、连体、假定、命令）可共用词尾。点击词尾和活用形后，从选中的形式继续接续。",
  x:0,y:0
 }];
 if(!kaku.attachment&&kaku.formPicked){
  const options=active.attaches||[];
  options.forEach(([text,description],i)=>models.push({
   id:"ghost:"+text,title:description,ghost:true,atoms:[{id:"main",text,role:"可接成分"}],
   choices:[],x:suffixOpen?550:365,y:(i-(options.length-1)/2)*175,prev:"verb",
   onClick:()=>attach(text),note:attachmentInfo[text].body
  }));
 }else if(kaku.attachment){
  const form=auxiliaryForm();
  const opened=!!form&&kaku.auxEditor&&!kaku.folded.auxiliary;
  const auxX=suffixOpen?425:315;
  const info=attachmentInfo[kaku.attachment];
  const parts=form ? (opened?[{id:"stem",text:form.stem,role:"固定部分"}]:
    form.ending?[{id:"stem",text:form.stem,role:"固定部分"},
                 {id:"ending",text:form.ending,role:"活用词尾"}]:
                [{id:"ending",text:form.stem,role:"活用后的形式"}]):
    [{id:"main",text:kaku.attachment,role:"后接成分"}];
  models.push({
    id:"auxiliary",title:info.title+
      (form?" · "+(opened&&!kaku.auxPicked?"活用":kaku.auxPicked?form.form:"基本形"):""),
    atoms:parts,
    choices:opened?auxiliaryForms().map(item=>({
      id:item.id,text:item.ending||"∅",form:item.form,variant:item.variant||"",
      role:item.form+(item.variant?" · "+item.variant:""),
      selected:item.id===kaku.auxFormId,choose:()=>chooseAuxiliary(item.id)
    })):[],
    onClick:form?()=>expandEnding("auxiliary"):null,
    note:info.body,
    x:auxX,y:0,prev:"verb"
  });
  if(form&&kaku.auxPicked&&!kaku.tail){
    (form.attaches||[]).forEach(([text,title],i,all)=>models.push({
      id:"ghost:"+text,ghost:true,title,atoms:[{id:"main",text,role:"可接成分"}],
      choices:[],x:auxX+(opened?425:315),y:(i-(all.length-1)/2)*146,
      onClick:()=>attach(text),note:attachmentInfo[text].body,prev:"auxiliary"
    }));
  }
  if(kaku.tail){
    const rule=form?.attaches?.find(([name])=>name===kaku.tail);
    models.push({
      id:"tail",title:rule?.[1]||attachmentInfo[kaku.tail].title,
      atoms:[{id:"main",text:kaku.tail,role:"助词 / 助动词"}],
      choices:[],x:auxX+(opened?425:315),y:0,prev:"auxiliary",
      note:attachmentInfo[kaku.tail].body
    });
  }
 }
 return models.map(u=>({...u,atoms:kaku.folded[u.id]&&u.atoms.length>1?
   [{id:"folded",text:u.atoms.map(a=>a.text).join(""),role:"收起的语法单位"}]:u.atoms,
   choices:kaku.folded[u.id]?[]:u.choices||[]}));
}
function maiModels(){
 const selected=maiPath.map((id,index)=>({
  id,title:index===0?"助动词 · まい":maiTree[id].kind,
  atoms:[{id:"main",text:maiTree[id].label,role:index===0?"中心单位":maiTree[id].kind}],
  ghost:false,choices:[],x:-index*310,y:0,
  prev:index>0?maiPath[index-1]:null,
  onClick:()=>chooseMai(id,index),
  note:maiTree[id].note||"该项来自教材《まい》的意义分类或接续法。"
 }));
 const last=maiPath[maiPath.length-1];
 if(maiExpanded)maiTree[last].children.forEach((id,i,all)=>{
  selected.push({
   id,title:maiTree[id].kind,atoms:[{id:"main",text:maiTree[id].label,role:maiTree[id].kind}],
   ghost:true,choices:[],x:-maiPath.length*310,y:(i-(all.length-1)/2)*158,
   prev:last,onClick:()=>chooseMai(id,maiPath.length),
   note:maiTree[id].note||"按教材的分类结构展开，不添加例句。"
  });
 });
 return selected;
}
const models=()=>mode==="kaku"?kakuModels():maiModels();
function measure(model){
 const groupShift=mode==="kaku"?(kaku.offsets[model.id]||{}):(maiOffsets[model.id]||{});
 const groupX=model.x+(groupShift.x||0),groupY=model.y+(groupShift.y||0);
 const atoms=model.atoms.map(atom=>{
  const w=Math.max(70,atom.text.length*23+24,atom.role.length*8+15);
  return {...atom,width:w};
 });
 const total=atoms.reduce((v,a)=>v+a.width,0)+(atoms.length-1)*14;
 let current=-total/2;
 const placed=atoms.map(a=>{
  const key=model.id+":"+a.id;
  const shift=mode==="kaku"?kaku.atomOffsets[key]||{}:maiAtomOffsets[key]||{};
  const point={...a,x:current+a.width/2+(shift.x||0),y:15+(shift.y||0)};
  current+=a.width+14;return point;
 });
 const wideChoices=(model.id==="verb"||model.id==="auxiliary")&&model.choices?.length>0;
 if(wideChoices&&placed[0]){placed[0].x=-112;placed[0].y=0;}
 const choicePlaced=(model.choices||[]).map((c,i)=>({
   ...c,x:wideChoices?82:(i%2?54:-54),
   y:wideChoices?(i-(model.choices.length-1)/2)*47+12:
     106+Math.floor(i/2)*57
 }));
 const suffixBox=wideChoices?{
   x:choicePlaced[0].x-86,y:choicePlaced[0].y-48,
   width:172,height:choicePlaced[choicePlaced.length-1].y-choicePlaced[0].y+82
 }:null;
 const titleWidth=model.title.length*6.8+38;
 const contentWidth=Math.max(...placed.map(a=>Math.abs(a.x)+a.width/2+20));
 const halfW=Math.max(123,titleWidth/2,contentWidth,wideChoices?183:choicePlaced.length?125:0);
 const minY=Math.min(-75,...placed.map(a=>a.y-39),
   ...(wideChoices?[suffixBox.y-30]:[]));
 const maxY=Math.max(72,...placed.map(a=>a.y+39),
   ...(wideChoices?[suffixBox.y+suffixBox.height+15]:
     choicePlaced.length?[156+(Math.ceil(choicePlaced.length/2)-1)*57]:[]));
 return {...model,x:groupX,y:groupY,atoms:placed,choices:choicePlaced,
   suffixBox,halfW,minY,maxY,width:halfW*2,height:maxY-minY};
}
const getLayout=()=>models().map(measure);
const svgElement=(tag,attrs={},value)=>{
 const element=document.createElementNS(SVG_NS,tag);
 for(const [key,item] of Object.entries(attrs))element.setAttribute(key,String(item));
 if(value!==undefined)element.textContent=value;
 return element;
};
function connectorPath(start,end){
 const backwards=mode==="mai";
 const x1=backwards?start.x-start.halfW:start.x+start.halfW;
 const x2=backwards?end.x+end.halfW:end.x-end.halfW;
 // 已选词尾所在行是新的接续起点，避免所有接续线都从整个大框中心出现。
 const selectedId=start.id==="verb"?kaku.formId:
   start.id==="auxiliary"?kaku.auxFormId:null;
 const selected=selectedId&&start.choices.length?
   start.choices.find(c=>c.id===selectedId):null;
 const y1=selected?start.y+selected.y:start.y;
 const y2=end.y,m=(x1+x2)/2;
 return "M"+x1+" "+y1+" C"+m+" "+y1+" "+m+" "+y2+" "+x2+" "+y2;
}


let visible=new Map(),edgeViews=new Map();
let drag=null,consumeClick=null;
const atomStore=()=>mode==="kaku"?kaku.atomOffsets:maiAtomOffsets;
const groupStore=()=>mode==="kaku"?kaku.offsets:maiOffsets;
function guardClick(token,fn){
 if(consumeClick===token){consumeClick=null;return;}
 fn();
}
function startDrag(ev,target,unit,atom){
 if(ev.pointerType==="mouse"&&ev.button!==0)return;
 const box=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;
 const scale=Math.min(box.width/vb.width,box.height/vb.height)||1;
 const key=atom?unit.id+":"+atom.id:unit.id;
 const map=atom?atomStore():groupStore();
 const current=map[key]||{x:0,y:0};
 drag={pointerId:ev.pointerId,element:target,token:(atom?"atom:":"group:")+key,
  map,key,x:ev.clientX,y:ev.clientY,ox:current.x,oy:current.y,scale,moved:false};
 consumeClick=null;
 try{target.setPointerCapture(ev.pointerId)}catch(_){}
}
function moveDrag(ev){
 if(!drag||drag.pointerId!==ev.pointerId)return;
 const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;
 if(!drag.moved&&Math.hypot(dx,dy)<5)return;
 drag.moved=true;
 drag.map[drag.key]={x:drag.ox+dx/drag.scale,y:drag.oy+dy/drag.scale};
 drag.element.setAttribute("data-dragging","true");
 updatePositions();
}
function finishDrag(ev){
 if(!drag||drag.pointerId!==ev.pointerId)return;
 consumeClick=drag.moved?drag.token:null;
 const token=consumeClick;
 drag.element.removeAttribute("data-dragging");
 drag=null;
 if(token&&typeof window!=="undefined"&&window.requestAnimationFrame){
  window.requestAnimationFrame(()=>{if(consumeClick===token)consumeClick=null;});
 }
}
function cancelDrag(ev){if(!drag||drag.pointerId!==ev.pointerId)return;drag.element.removeAttribute("data-dragging");drag=null;consumeClick=null;}
function bindDrag(element,unit,atom){
 element.addEventListener("pointerdown",ev=>{ev.stopPropagation();startDrag(ev,element,unit,atom);});
 element.addEventListener("pointermove",moveDrag);
 element.addEventListener("pointerup",finishDrag);
 element.addEventListener("pointercancel",cancelDrag);
}
function makeChrome(g,text,x,label,action,topY=-52){
 const item=svgElement("g",{class:"chrome-hit",role:"button",tabindex:"0","aria-label":label,
  transform:"translate("+x+","+topY+")"});
 item.appendChild(svgElement("circle",{class:"chrome-circle",r:9}));
 item.appendChild(svgElement("text",{class:"chrome-glyph",y:4,"text-anchor":"middle"},text));
 item.addEventListener("click",ev=>{ev.stopPropagation();action();});
 item.addEventListener("keydown",ev=>{
  if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();ev.stopPropagation();action();}
 });
 item.addEventListener("pointerdown",ev=>ev.stopPropagation());
 g.appendChild(item);return item;
}
function choiceGuidePath(unit,choice){
 if((unit.id==="verb"||unit.id==="auxiliary")&&choice.id){
   const stem=unit.atoms[0];
   const fromX=stem.x+stem.width/2,fromY=stem.y;
   const toX=choice.x-75,toY=choice.y;
   const middle=(fromX+toX)/2;
   return "M"+fromX+" "+fromY+" C"+middle+" "+fromY+" "+middle+" "+toY+" "+toX+" "+toY;
 }
 const ending=unit.atoms.find(atom=>atom.id==="ending")||unit.atoms[0];
 const fromX=ending.x,fromY=ending.y+37,toX=choice.x,toY=choice.y-22;
 const middle=(fromY+toY)/2;
 return "M"+fromX+" "+fromY+" C"+fromX+" "+middle+" "+toX+" "+middle+" "+toX+" "+toY;
}
function createUnit(unit){
 const className="unit "+(unit.ghost?"ghost":"active");
 const root=svgElement("g",{class:className,transform:"translate("+unit.x+","+unit.y+")",
  "aria-label":unit.title});
 const frame=svgElement("rect",{class:"unit-frame",x:-unit.halfW,y:unit.minY,width:unit.width,height:unit.height});
 root.appendChild(frame);
 const isVerbExpanded=unit.id==="verb"&&!!unit.suffixBox;
 const title=svgElement("text",{class:"unit-title",x:isVerbExpanded?-unit.halfW+20:0,
   y:unit.minY+25,"text-anchor":isVerbExpanded?"start":"middle"},unit.title);
 root.appendChild(title);
 let suffixOutline=null,suffixCaption=null;
 if(unit.suffixBox){
   suffixOutline=svgElement("rect",{class:"suffix-frame",x:unit.suffixBox.x,y:unit.suffixBox.y,
     width:unit.suffixBox.width,height:unit.suffixBox.height});
   root.appendChild(suffixOutline);
   suffixCaption=svgElement("text",{class:"suffix-caption",x:unit.suffixBox.x+15,
     y:unit.suffixBox.y+17},"活用词尾");
   root.appendChild(suffixCaption);
 }
 if(unit.onClick){
  bindDrag(frame,unit,null);
  frame.addEventListener("click",()=>guardClick("group:"+unit.id,unit.onClick));
  frame.setAttribute("role","button");frame.setAttribute("tabindex","0");
  frame.setAttribute("aria-label","查看或选择"+unit.title);
  frame.addEventListener("keydown",ev=>{
   if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();unit.onClick();}
  });
 }else bindDrag(frame,unit,null);
 const chrome=[];
 if(!unit.ghost){
  const note=unit.note||"当前语法单位。";
  chrome.push(makeChrome(root,"i",unit.halfW-19,"语法说明",()=>showInfo(unit.title,note),unit.minY+19));
  if(mode==="kaku"&&(unit.id==="verb"||unit.id==="auxiliary")){
   chrome.push(makeChrome(root,kaku.folded[unit.id]?"+":"−",-unit.halfW+19,
    kaku.folded[unit.id]?"展开语法单位":"折叠语法单位",()=>fold(unit.id),unit.minY+19));
  }
 }
 const atomViews=new Map();
 unit.atoms.forEach(atom=>{
  const a=svgElement("g",{class:"atom-hit",role:"button",tabindex:"0",
    "aria-label":atom.text+" · "+atom.role,transform:"translate("+atom.x+","+atom.y+")"});
  const rect=svgElement("rect",{class:"atom-shape",x:-atom.width/2,y:-36,width:atom.width,height:72});
  a.appendChild(rect);
  a.appendChild(svgElement("text",{class:"atom-label","text-anchor":"middle",y:-3},atom.text));
  a.appendChild(svgElement("text",{class:"atom-role","text-anchor":"middle",y:23},atom.role));
  bindDrag(a,unit,atom);
  const clickAction=()=>{
   if(mode==="kaku"&&kaku.folded[unit.id]){fold(unit.id);return;}
   if(mode==="kaku"&&atom.id==="stem"){showInfo(unit.title,unit.note);return;}
   if(unit.onClick)unit.onClick();
  };
  a.addEventListener("click",()=>guardClick("atom:"+unit.id+":"+atom.id,clickAction));
  a.addEventListener("keydown",ev=>{
   if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();clickAction();}
  });
  root.appendChild(a);atomViews.set(atom.id,a);
 });
 const options=[],guideViews=[];
 if(unit.choices.length){
  unit.choices.forEach(choice=>{
   const guide=svgElement("path",{class:"choice-guide",d:choiceGuidePath(unit,choice)});
   root.appendChild(guide);guideViews.push(guide);
   const wide=(unit.id==="verb"||unit.id==="auxiliary")&&!!choice.id;
   const c=svgElement("g",{class:"choice"+(choice.selected?" selected":""),role:"button",tabindex:"0",
     "aria-pressed":String(!!choice.selected),
     "aria-label":choice.role+" · "+choice.text,
     transform:"translate("+choice.x+","+choice.y+")"});
   if(wide){
     c.appendChild(svgElement("rect",{class:"choice-shape",x:-76,y:-21,width:152,height:42}));
     c.appendChild(svgElement("text",{class:"choice-type",x:-55,y:4},choice.form));
     c.appendChild(svgElement("text",{class:"choice-label",x:34,y:6,"text-anchor":"middle"},choice.text));
     if(choice.variant)c.appendChild(svgElement("text",{class:"choice-variant",x:34,y:18,"text-anchor":"middle"},choice.variant));
   }else{
     c.appendChild(svgElement("rect",{class:"choice-shape",x:-47,y:-22,width:94,height:49}));
     c.appendChild(svgElement("text",{class:"choice-label","text-anchor":"middle",y:0},choice.text));
     c.appendChild(svgElement("text",{class:"choice-detail","text-anchor":"middle",y:18},choice.role));
   }
   c.addEventListener("click",ev=>{ev.stopPropagation();choice.choose();});
   c.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();choice.choose();}});
   c.addEventListener("pointerdown",ev=>ev.stopPropagation());
   root.appendChild(c);options.push(c);
  });
 }
 return {unit,root,frame,title,chrome,atomViews,options,guideViews,suffixOutline,suffixCaption};
}
function updatePositions(){
 const units=getLayout(),layoutMap=new Map(units.map(u=>[u.id,u]));
 units.forEach(unit=>{
  const view=visible.get(unit.id);if(!view)return;
  view.root.setAttribute("transform","translate("+unit.x+","+unit.y+")");
  view.frame.setAttribute("x",-unit.halfW);view.frame.setAttribute("y",unit.minY);
  view.frame.setAttribute("width",unit.width);view.frame.setAttribute("height",unit.height);
  view.title.setAttribute("y",unit.minY+25);
  if(unit.suffixBox&&view.suffixOutline){
    const box=unit.suffixBox;
    view.suffixOutline.setAttribute("x",box.x);
    view.suffixOutline.setAttribute("y",box.y);
    view.suffixOutline.setAttribute("width",box.width);
    view.suffixOutline.setAttribute("height",box.height);
    view.suffixCaption.setAttribute("x",box.x+15);
    view.suffixCaption.setAttribute("y",box.y+17);
  }
  view.chrome.forEach((item,i)=>{
   const left=mode==="kaku"&&unit.id!=="tail"&&i===1;
   item.setAttribute("transform","translate("+(left?-unit.halfW+19:unit.halfW-19)+","+(unit.minY+19)+")");
  });
  unit.atoms.forEach(atom=>visible.get(unit.id)?.atomViews.get(atom.id)?.setAttribute(
    "transform","translate("+atom.x+","+atom.y+")"));
  unit.choices.forEach((choice,i)=>{
   view.guideViews[i]?.setAttribute("d",choiceGuidePath(unit,choice));
  });
  if(unit.prev&&edgeViews.has(unit.id))
   edgeViews.get(unit.id).setAttribute("d",connectorPath(layoutMap.get(unit.prev),unit));
 });
}
function render(){
 const units=getLayout(),layoutMap=new Map(units.map(u=>[u.id,u]));
 const minX=Math.min(...units.map(u=>u.x-u.halfW))-85;
 const maxX=Math.max(...units.map(u=>u.x+u.halfW))+85;
 const minY=Math.min(...units.map(u=>u.y+u.minY))-55;
 const maxY=Math.max(...units.map(u=>u.y+u.maxY))+55;
 const width=Math.max(900,maxX-minX),height=Math.max(490,maxY-minY);
 const cx=(minX+maxX)/2,cy=(minY+maxY)/2,x0=cx-width/2,y0=cy-height/2;
 svg.setAttribute("viewBox",[x0,y0,width,height].join(" "));
 svg.style.width=width+"px";svg.style.height=height+"px";
 svg.replaceChildren();visible=new Map();edgeViews=new Map();
 units.forEach(unit=>{
  if(!unit.prev)return;
  const link=svgElement("path",{class:"link"+(!unit.ghost?" solid":""),
    d:connectorPath(layoutMap.get(unit.prev),unit)});
  svg.appendChild(link);edgeViews.set(unit.id,link);
 });
 units.forEach(unit=>{
  const view=createUnit(unit);visible.set(unit.id,view);svg.appendChild(view.root);
 });
 byId("surface").textContent=mode==="kaku"?surface():"まい";
 byId("back").disabled=mode==="kaku"?!kakuHistory.length:!(maiExpanded||maiPath.length>1);
 document.querySelectorAll("[data-mode]").forEach(button=>button.setAttribute(
  "aria-pressed",String(button.dataset.mode===mode)));
 const bar=byId("trace");bar.replaceChildren();
 const hint=document.createElement("span");hint.className="hint";hint.textContent=mode==="kaku"?"当前构造":"探索路径";
 bar.appendChild(hint);
 const labels=mode==="kaku"?["書"+kaku.ending,
  ...(kaku.attachment?[unitSuffix()]:[]),
  ...(kaku.tail?[kaku.tail]:[])]:maiPath.map(id=>maiTree[id].label);
 labels.forEach((label,index)=>{
  if(index){const sep=document.createElement("span");sep.className="arrow";sep.textContent=mode==="mai"?"←":"＋";bar.appendChild(sep);}
  const piece=document.createElement("span");piece.className="trace-piece";piece.textContent=label;bar.appendChild(piece);
 });
 tip.hidden=true;
 const active=mode==="kaku"?units.find(u=>u.id===(kaku.tail?"tail":kaku.attachment?"auxiliary":"verb")):
   units.find(u=>u.id===maiPath[maiPath.length-1]);
 if(active){const screenX=(active.x-x0)/width*svg.clientWidth;stage.scrollLeft=Math.max(0,screenX-stage.clientWidth/2);}
}


function setTheme(next,persist=true){
 const theme=next==="dark"?"dark":"light";
 document.documentElement.dataset.theme=theme;
 byId("theme-toggle").textContent=theme==="dark"?"浅色模式":"夜间模式";
 byId("theme-toggle").setAttribute("aria-pressed",String(theme==="dark"));
 byId("theme-toggle").setAttribute("aria-label",theme==="dark"?"切换到浅色模式":"切换到深色模式");
 if(persist){try{window.localStorage.setItem("bunpou-theme",theme);}catch(_){}}
}
function initialTheme(){
 let saved=null;
 try{saved=window.localStorage.getItem("bunpou-theme");}catch(_){}
 const preferred=saved==="dark"||saved==="light"?saved:
   (window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light");
 setTheme(preferred,false);
}
byId("theme-toggle").addEventListener("click",()=>{
 setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
});
document.querySelectorAll("[data-mode]").forEach(button=>
 button.addEventListener("click",()=>changeMode(button.dataset.mode)));
byId("back").addEventListener("click",back);
byId("reset").addEventListener("click",resetCurrent);
byId("close").addEventListener("click",()=>{tip.hidden=true;});
if(typeof window!=="undefined")window.addEventListener("resize",render);
initialTheme();
render();
