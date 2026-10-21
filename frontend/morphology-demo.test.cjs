const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm");
const path=require("node:path");
const code=fs.readFileSync(path.join(__dirname,"morphology-demo.js"),"utf8");
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.handlers={};this.dataset={};this.style={};this.hidden=false;this.textContent="";this.clientWidth=1100;this.clientHeight=520;this.scrollLeft=0;this.viewBox={baseVal:{width:1000,height:540}};}
 appendChild(el){this.children.push(el);return el;}
 replaceChildren(...nodes){this.children=[...nodes];}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==="viewBox"){const [x,y,w,h]=String(v).split(/\s+/).map(Number);this.viewBox.baseVal={x,y,width:w,height:h};}if(k==="data-theme")this.dataset.theme=String(v);}
 getAttribute(k){return this.attrs[k]??"";}
 removeAttribute(k){delete this.attrs[k];}
 addEventListener(type,callback){this.handlers[type]=callback;}
 setPointerCapture(){}
 getBoundingClientRect(){return {width:1100,height:520};}
 click(){assert.ok(this.handlers.click,"missing click on "+this.tag+" "+JSON.stringify(this.attrs));return this.handlers.click({target:this,stopPropagation(){},preventDefault(){}});}
}
const els=new Map(), modes=["kaku","mai"].map(mode=>{const e=new Element("button");e.dataset.mode=mode;return e;});
const store=new Map();
const document={
 createElement:t=>new Element(t),
 createElementNS:(_,t)=>new Element(t),
 documentElement:{dataset:{}},
 getElementById:id=>{if(!els.has(id))els.set(id,new Element("div"));return els.get(id)},
 querySelectorAll:selector=>selector==="[data-mode]"?modes:[]
};
const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},matchMedia:()=>({matches:false}),addEventListener(){}};
const ctx={document,window,console};
vm.createContext(ctx);
vm.runInContext(code+"\nglobalThis.test={kaku:()=>kaku,maiPath:()=>maiPath,maiTree,kakuModels,models,getLayout,surface,chooseVerb,chooseAuxiliary,auxiliaryInflections,attach,fold,expandEnding,chooseMai,visible,edgeViews,mode:()=>mode};",ctx);
const T=ctx.test,$=id=>document.getElementById(id);
const find=(element,p)=>element.children.flatMap(x=>[...(p(x)?[x]:[]),...find(x,p)]);
const groups=()=>find($("graph"),x=>x.tag==="g"&&x.attrs.class?.startsWith("unit "));
const group=(label)=>groups().find(x=>x.attrs["aria-label"]?.includes(label));
const findClass=(g,name)=>find(g,x=>x.attrs.class?.split(" ").includes(name));
const atom=(g,text)=>findClass(g,"atom-hit").find(e=>e.attrs["aria-label"]?.startsWith(text+" ·"));
const choices=g=>find(g,e=>e.attrs.class==="choice"||e.attrs.class==="choice selected");
const choice=(g,text,form)=>choices(g).find(e=>e.attrs["aria-label"]?.endsWith(" · "+text)&&(!form||e.attrs["aria-label"]?.startsWith(form)));
const surface=()=>$("surface").textContent;
assert.equal(document.documentElement.dataset.theme,"light");
assert.equal(surface(),"書く");
assert.equal(groups().length,1);
assert.equal(findClass(groups()[0],"atom-hit").length,2);
assert.equal(group("五段动词").attrs["aria-label"],"五段动词 · 基本形");
const folds=findClass(group("五段动词"),"chrome-hit");
assert.equal(folds.length,2);
folds[1].click();
assert.equal(findClass(group("五段动词"),"atom-hit").length,1);
findClass(group("五段动词"),"chrome-hit")[1].click();
assert.equal(findClass(group("五段动词"),"atom-hit").length,2);
const initialHeight=Number(findClass(group("五段动词"),"unit-frame")[0].attrs.height);
atom(group("五段动词"),"く").click();
assert.ok(group("五段动词 · 活用"));
assert.equal(groups().length,1);
assert.equal(choices(groups()[0]).length,8);
const endings=choices(groups()[0]);
assert.equal(endings.filter(e=>e.attrs["aria-label"]?.endsWith(" · く")).length,2);
assert.equal(endings.filter(e=>e.attrs["aria-label"]?.endsWith(" · け")).length,2);
assert.equal(new Set(endings.map(e=>e.children.filter(c=>c.attrs.class==="choice-type")[0]?.textContent)).size,6);
assert.ok(endings.every(e=>e.attrs.transform.includes(",")&&e.attrs.transform.match(/translate\(82,/)),
  "候选在右侧同一竖列");
assert.equal(findClass(groups()[0],"choice-guide").length,8);
assert.equal(findClass(groups()[0],"suffix-frame").length,1);
const expanded=T.getLayout().find(x=>x.id==="verb");
assert.ok(expanded.suffixBox);
assert.equal(expanded.suffixBox.width,172,"右侧内层虚线框已缩窄");
assert.equal(expanded.choices[1].y-expanded.choices[0].y,47,"活用候选从 61 收紧为 47 单位行距");
const firstChoice=findClass(group("五段动词"),"choice")[0];
const typeLabel=findClass(firstChoice,"choice-type")[0], endingLabel=findClass(firstChoice,"choice-label")[0];
assert.ok(Number(endingLabel.attrs.x)-Number(typeLabel.attrs.x)<95,"活用形名称贴近假名");
assert.ok(expanded.suffixBox.x>expanded.atoms[0].x,"活用列在词干右侧");
assert.ok(expanded.choices.every((x,i,list)=>i===0||(x.x===list[i-1].x&&x.y>list[i-1].y)),
  "八个词尾按照活用形纵向排列");
assert.ok(expanded.minY<expanded.suffixBox.y&&expanded.maxY>expanded.suffixBox.y+expanded.suffixBox.height,
  "词尾分组始终位于所属语法框内");
assert.ok(Number(findClass(group("五段动词"),"unit-frame")[0].attrs.height)>initialHeight);
choice(group("五段动词"),"か").click();
assert.equal(surface(),"書か");
assert.equal(groups().length,3);
assert.equal(findClass(group("五段动词"),"choice").length,8,"选择后其余活用形仍可见");
assert.equal(findClass(group("五段动词"),"choice").filter(x=>x.attrs.class.includes("selected")).length,1);
assert.ok(group("五段动词 · 未然形"));
assert.equal(groups().filter(x=>x.attrs["aria-label"]?.includes("書か")).length,0);
// Dragging an atom keeps the grammar unit and selection intact.
const stem=atom(group("五段动词"),"書");
const dragStart={pointerType:"mouse",button:0,pointerId:17,clientX:100,clientY:100,stopPropagation(){}};
stem.handlers.pointerdown(dragStart);
stem.handlers.pointermove({...dragStart,clientX:148,clientY:128});
stem.handlers.pointerup({...dragStart,clientX:148,clientY:128});
assert.ok(T.kaku().atomOffsets["verb:stem"].x>0);
stem.click();
assert.equal(surface(),"書か");
const firstLink=find($("graph"),x=>x.tag==="path"&&x.attrs.class==="link")[0];
const beforeLine=firstLink.attrs.d;
const frame=findClass(group("五段动词"),"unit-frame")[0];
frame.handlers.pointerdown({...dragStart,pointerId:18});
frame.handlers.pointermove({...dragStart,pointerId:18,clientX:150,clientY:100});
frame.handlers.pointerup({...dragStart,pointerId:18,clientX:150,clientY:100});
assert.notEqual(firstLink.attrs.d,beforeLine,"connector follows group drag");
frame.click();
assert.equal(surface(),"書か");
atom(group("否定助动词"),"ない").click();
assert.equal(surface(),"書かない");
assert.equal(groups().length,2);
atom(group("否定助动词"),"い").click();
assert.ok(group("否定助动词 · 活用"));
assert.equal(findClass(group("否定助动词"),"choice").length,6);
assert.equal(findClass(group("否定助动词"),"suffix-frame").length,1);
assert.equal(T.getLayout().find(u=>u.id==="auxiliary").choices.length,6);
assert.ok(T.getLayout().find(u=>u.id==="auxiliary").choices.every(
  (item,i,all)=>!i||(item.x===all[i-1].x&&item.y>all[i-1].y)
));
choice(group("否定助动词"),"かっ").click();
assert.equal(surface(),"書かなかっ");
assert.ok(group("否定助动词 · 连用形"));
atom(group("过去助动词"),"た").click();
assert.equal(surface(),"書かなかった");
assert.equal(groups().length,3);
assert.equal(groups().filter(g=>g.attrs.class.includes("ghost")).length,0);
$("back").click();
assert.equal(surface(),"書かなかっ");
$("reset").click();
assert.equal(groups().length,1);
atom(group("五段动词"),"く").click();
choice(group("五段动词"),"き").click();
assert.equal(surface(),"書き");
atom(group("礼貌助动词"),"ます").click();
assert.equal(surface(),"書きます");
$("reset").click();
atom(group("五段动词"),"く").click();
choice(group("五段动词"),"け").click();
atom(group("接续助词"),"ば").click();
assert.equal(surface(),"書けば");
$("reset").click();
atom(group("五段动词"),"く").click();
choice(group("五段动词"),"く").click();
assert.equal(T.kaku().formId,"terminal");
assert.ok(group("否定推量助动词"));
atom(group("否定推量助动词"),"まい").click();
assert.equal(surface(),"書くまい");
$("reset").click();
atom(group("五段动词"),"く").click();
const rentai=findClass(group("五段动词"),"choice").find(x=>x.attrs["aria-label"]==="连体形 · く");
assert.ok(rentai);
rentai.click();
assert.equal(T.kaku().formId,"attributive");
assert.ok(group("比况助动词"));
atom(group("比况助动词"),"ようだ").click();
assert.equal(surface(),"書くようだ");
$("reset").click();
atom(group("五段动词"),"く").click();
const imperative=findClass(group("五段动词"),"choice").find(x=>x.attrs["aria-label"]==="命令形 · け");
assert.ok(imperative);
imperative.click();
assert.equal(T.kaku().formId,"imperative");
assert.equal(groups().length,1,"命令形暂无后接规则，不应误用假定形的「ば」");
$("reset").click();
atom(group("五段动词"),"く").click();
const onbin=findClass(group("五段动词"),"choice").find(x=>x.attrs["aria-label"].includes("连用形 · イ音便 · い"));
assert.ok(onbin);
onbin.click();
assert.equal(T.kaku().formId,"renyou-onbin");
atom(group("过去助动词"),"た").click();
assert.equal(surface(),"書いた");
$("reset").click();
atom(group("五段动词"),"く").click();
const onbinChoice=findClass(group("五段动词"),"choice").find(x=>x.attrs["aria-label"].includes("连用形 · イ音便 · い"));
onbinChoice.click();
atom(group("接续助词"),"て").click();
assert.equal(surface(),"書いて");
$("reset").click();
// 同一个「く」分别作为终止形、连体形，允许的后接规则不同。
atom(group("五段动词"),"く").click();
choice(group("五段动词"),"く","终止形").click();
assert.equal(T.kaku().formId,"terminal");
assert.equal(surface(),"書く");
assert.ok(group("否定推量助动词"));
atom(group("否定推量助动词"),"まい").click();
assert.equal(surface(),"書くまい");
$("reset").click();
atom(group("五段动词"),"く").click();
choice(group("五段动词"),"く","连体形").click();
assert.equal(T.kaku().formId,"attributive");
assert.ok(group("比况助动词"));
atom(group("比况助动词"),"ようだ").click();
assert.equal(surface(),"書くようだ");
$("reset").click();
// 「け」的假定形、命令形也必须分开。
atom(group("五段动词"),"く").click();
choice(group("五段动词"),"け","命令形").click();
assert.equal(T.kaku().formId,"imperative");
assert.equal(groups().length,1);
$("reset").click();
atom(group("五段动词"),"く").click();
choice(group("五段动词"),"い","连用形").click();
assert.equal(T.kaku().formId,"renyou-onbin");
assert.ok(group("过去助动词"));
atom(group("过去助动词"),"た").click();
assert.equal(surface(),"書いた");
$("reset").click();
// 助动词沿用同一「内部词尾候选 → 新接续单位」机制。
const fromVerb=(text,form)=>{
  $("reset").click();
  atom(group("五段动词"),"く").click();
  const picked=choice(group("五段动词"),text,form);
  assert.ok(picked,"verb form "+form+" "+text);
  picked.click();
};
const fromAux=(verbEnding,form,auxiliaryName,auxiliarySurface,ending)=>{
  fromVerb(verbEnding,form);
  atom(group(auxiliaryName),auxiliarySurface).click();
  atom(group(auxiliaryName),ending).click();
  assert.ok(group(auxiliaryName+" · 活用"));
  const aux=T.getLayout().find(u=>u.id==="auxiliary");
  assert.ok(aux.suffixBox,auxiliaryName+" must have its own dashed suffix group");
  assert.ok(aux.choices.every((item,i,all)=>!i||(item.x===all[i-1].x&&item.y>all[i-1].y)));
  assert.ok(aux.choices.every((item,i,all)=>!i||item.y-all[i-1].y<=48),
    "auxiliary column uses compact spacing");
};
fromAux("か","未然形","否定助动词","ない","い");
choice(group("否定助动词"),"けれ","假定形").click();
assert.equal(surface(),"書かなけれ");
atom(group("接续助词"),"ば").click();
assert.equal(surface(),"書かなければ");

fromAux("か","未然形","否定助动词","ない","い");
choice(group("否定助动词"),"かろ","未然形").click();
atom(group("推量助动词"),"う").click();
assert.equal(surface(),"書かなかろう");

fromAux("か","未然形","否定助动词","ない","い");
choice(group("否定助动词"),"く","连用形").click();
atom(group("接续助词"),"て").click();
assert.equal(surface(),"書かなくて");

fromAux("か","未然形","否定助动词","ない","い");
choice(group("否定助动词"),"い","连体形").click();
assert.equal(T.kaku().auxFormId,"nai-attributive");
atom(group("比况助动词"),"ようだ").click();
assert.equal(surface(),"書かないようだ");

fromAux("き","连用形","礼貌助动词","ます","す");
assert.equal(choices(group("礼貌助动词")).length,4);
choice(group("礼貌助动词"),"し","连用形").click();
assert.equal(surface(),"書きまし");
atom(group("过去助动词"),"た").click();
assert.equal(surface(),"書きました");

fromAux("き","连用形","礼貌助动词","ます","す");
choice(group("礼貌助动词"),"せ","未然形").click();
atom(group("否定助动词"),"ん").click();
assert.equal(surface(),"書きません");

fromAux("き","连用形","礼貌助动词","ます","す");
choice(group("礼貌助动词"),"しょ","未然形").click();
atom(group("意向助动词"),"う").click();
assert.equal(surface(),"書きましょう");

fromAux("か","未然形","使役助动词","せる","る");
assert.equal(choices(group("使役助动词")).length,6);
choice(group("使役助动词"),"∅","未然形").click();
assert.equal(surface(),"書かせ");
atom(group("被动助动词"),"られる").click();
assert.equal(surface(),"書かせられる");

fromAux("か","未然形","使役助动词","せる","る");
choice(group("使役助动词"),"∅","连用形").click();
atom(group("礼貌助动词"),"ます").click();
assert.equal(surface(),"書かせます");

fromAux("か","未然形","使役助动词","せる","る");
choice(group("使役助动词"),"れ","假定形").click();
atom(group("接续助词"),"ば").click();
assert.equal(surface(),"書かせれば");

// 测试同形「せ」作为未然形与连用形时，后接选项不同。
fromAux("か","未然形","使役助动词","せる","る");
choice(group("使役助动词"),"∅","未然形").click();
assert.ok(group("被动助动词"));
assert.equal(group("礼貌助动词"),undefined);
choice(group("使役助动词"),"∅","连用形").click();
assert.ok(group("礼貌助动词"));
assert.equal(group("被动助动词"),undefined);
// 同形助动词活用的接续必须区分：终止形「ます」不等于未然形「ませ」。
fromAux("き","连用形","礼貌助动词","ます","す");
choice(group("礼貌助动词"),"す","终止形").click();
assert.equal(T.kaku().auxFormId,"masu-terminal");
assert.ok(group("否定推量助动词"));
atom(group("否定推量助动词"),"まい").click();
assert.equal(surface(),"書きますまい");

// 改变已经接续的助动词形态，应撤回不再合法的后接单位。
fromAux("き","连用形","礼貌助动词","ます","す");
choice(group("礼貌助动词"),"し","连用形").click();
atom(group("过去助动词"),"た").click();
assert.equal(surface(),"書きました");
choice(group("礼貌助动词"),"せ","未然形").click();
assert.equal(surface(),"書きませ");
assert.equal(T.kaku().tail,null);
assert.ok(group("否定助动词"));

// 「ない」终止形与连体形同为「い」，接续不同。
fromAux("か","未然形","否定助动词","ない","い");
choice(group("否定助动词"),"い","终止形").click();
assert.ok(group("推定助动词"));
assert.equal(group("比况助动词"),undefined);

// 归并关闭后，选择的活用形及接续关系保持不变。
fromAux("か","未然形","否定助动词","ない","い");
choice(group("否定助动词"),"かっ","连用形").click();
const foldAux=findClass(group("否定助动词"),"chrome-hit")[1];
assert.ok(foldAux);foldAux.click();
assert.equal(findClass(group("否定助动词"),"choice").length,0);
assert.ok(group("过去助动词"));
findClass(group("否定助动词"),"chrome-hit")[1].click();
assert.equal(T.kaku().auxFormId,"nai-renyou-katt");
$("reset").click();
$("theme-toggle").click();
assert.equal(document.documentElement.dataset.theme,"dark");
assert.equal(store.get("bunpou-theme"),"dark");
$("theme-toggle").click();
assert.equal(document.documentElement.dataset.theme,"light");
modes[1].click();
assert.equal(T.mode(),"mai");
atom(group("助动词 · まい"),"まい").click();
assert.ok(group("意义分类"));
assert.ok(group("接续条件"));
atom(group("接续条件"),"接续法").click();
assert.ok(group("词类"));
atom(group("词类"),"动词").click();
assert.ok(group("活用类别"));
assert.ok(atom(group("活用类别"),"五段动词"));
atom(group("活用类别"),"五段动词").click();
atom(group("接续形"),"终止形").click();
assert.ok(T.maiPath().includes("gTerminal"));
modes[1].click();
atom(group("助动词 · まい"),"まい").click();
atom(group("意义分类"),"意义").click();
assert.ok(group("后接终助词「ぞ」"));
console.log("PASS six inflection forms, identical-ending grammar distinctions, persistent choices, attachments, theme, drag, まい");
