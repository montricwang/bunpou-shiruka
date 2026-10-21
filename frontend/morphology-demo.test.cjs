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
vm.runInContext(code+"\nglobalThis.test={kaku:()=>kaku,maiPath:()=>maiPath,maiTree,kakuModels,models,getLayout,surface,chooseVerb,chooseNegative,attach,fold,expandEnding,chooseMai,visible,edgeViews,mode:()=>mode};",ctx);
const T=ctx.test,$=id=>document.getElementById(id);
const find=(element,p)=>element.children.flatMap(x=>[...(p(x)?[x]:[]),...find(x,p)]);
const groups=()=>find($("graph"),x=>x.tag==="g"&&x.attrs.class?.startsWith("unit "));
const group=(label)=>groups().find(x=>x.attrs["aria-label"]?.includes(label));
const findClass=(g,name)=>find(g,x=>x.attrs.class===name);
const atom=(g,text)=>findClass(g,"atom-hit").find(e=>e.attrs["aria-label"]?.startsWith(text+" ·"));
const choice=(g,text)=>findClass(g,"choice").find(e=>e.attrs["aria-label"]?.endsWith(" · "+text));
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
assert.equal(findClass(groups()[0],"choice").length,4);
assert.equal(findClass(groups()[0],"choice-guide").length,4);
assert.ok(Number(findClass(group("五段动词"),"unit-frame")[0].attrs.height)>initialHeight);
choice(group("五段动词"),"か").click();
assert.equal(surface(),"書か");
assert.equal(groups().length,3);
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
assert.equal(findClass(group("否定助动词"),"choice").length,2);
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
console.log("PASS model, theme, in-place inflection, fold, drag, chain, and まい classification");
