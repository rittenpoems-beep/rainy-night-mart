/* 雨宿り / AMAYADORI MART
 * All geometry, lettering, surface patterns and animation are generated here.
 * Coordinates: Y up, shop front +Z. Units are approximately metres.
 */
(() => {
  'use strict';
  const T = window.MART;
  const TAU = Math.PI * 2;
  let seed = 271828;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const range = (a,b) => a+(b-a)*rand();
  const scene = new T.Scene();
  scene.background = new T.Color(0x080f21);
  scene.fog = new T.FogExp2(0x080f21, .019);
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.info.autoReset = false;
  renderer.domElement.setAttribute('aria-label', '可交互的雨夜便利店三维微缩场景');
  document.body.appendChild(renderer.domElement);
  const viewFov=aspect=>T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(39/2))*Math.max(1,(4/3)/aspect)));
  const camera = new T.PerspectiveCamera(viewFov(innerWidth/innerHeight), innerWidth/innerHeight, .15, 100);
  camera.position.set(15.9, 12.0, 18.9);
  const controls = new T.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.1, -.35);
  controls.enableDamping = true;
  controls.dampingFactor = .065;
  controls.minDistance = 7;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI * .485;
  controls.minPolarAngle = .22;
  controls.enablePan = true;
  controls.panSpeed = .7;
  controls.zoomSpeed = .8;
  controls.rotateSpeed = .65;
  controls.update();

  const composer = new T.EffectComposer(renderer);
  composer.addPass(new T.RenderPass(scene,camera));
  const bloom = new T.UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.32,.48,1.1);
  composer.addPass(bloom);
  composer.addPass(new T.OutputPass());

  const ramp = new T.DataTexture(new Uint8Array([100,148,200,242]),4,1,T.RedFormat);
  ramp.minFilter = ramp.magFilter = T.NearestFilter; ramp.needsUpdate = true;
  const toon = (color, extra={}) => new T.MeshToonMaterial({color, gradientMap:ramp, polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1,...extra});
  const std = (color,roughness=.5,metalness=0) => new T.MeshStandardMaterial({color,roughness,metalness,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  const ink = new T.LineBasicMaterial({color:0x071321,transparent:true,opacity:.78});
  const M = {
    base:toon(0x152737), edge:toon(0x2b4355), concrete:toon(0x627c87), curb:toon(0x9eafb0),
    sidewalk:std(0x52656a,.58), grout:toon(0x384c53), wall:toon(0xb4c1af), wallLight:toon(0xd9d5b9),
    teal:toon(0x225c60), green:toon(0x52a69c), dark:toon(0x1c303a), metal:std(0x607e85,.36,.68),
    silver:std(0xa5bbc0,.32,.55), rubber:toon(0x111f2c), wood:toon(0xa87854), cream:toon(0xf3dec1),
    red:toon(0xb74e4d), orange:toon(0xe59b5e), yellow:toon(0xe8bc62), white:toon(0xc5d4cc),
    blue:toon(0x53899c), mint:toon(0x7ec5b4), leaf:toon(0x557459), soil:toon(0x263c38),
    inside:toon(0xd4bc8d,{emissive:0x9f622a,emissiveIntensity:.10}),
    shelf:toon(0xe6dcc0), productWhite:toon(0xf1dfbd), brown:toon(0x5c4030),
    warm:new T.MeshStandardMaterial({color:0xffd38a,emissive:0xffbc66,emissiveIntensity:2.6,roughness:.4}),
    cool:new T.MeshStandardMaterial({color:0x8dd8df,emissive:0x85e2df,emissiveIntensity:1.8}),
    amber:new T.MeshBasicMaterial({color:0xffb95d}),
    glass:new T.MeshPhysicalMaterial({color:0x86beb9,metalness:.08,roughness:.16,transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide}),
    glassDark:new T.MeshPhysicalMaterial({color:0x83c9d2,metalness:.15,roughness:.13,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide})
  };

  // Static geometry is merged by material, keeping hundreds of small 3D items inexpensive.
  const batches = new Map();
  const lineParts = [];
  const scratch = new T.Object3D();
  let primitiveCount = 0;
  function part(geo,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0,outline=false) {
    scratch.position.set(x,y,z); scratch.rotation.set(rx,ry,rz); scratch.scale.set(1,1,1); scratch.updateMatrix();
    const g=geo.index ? geo.toNonIndexed() : geo.clone();
    if(g.getAttribute('uv')) g.deleteAttribute('uv');
    g.applyMatrix4(scratch.matrix);
    if(!batches.has(mat)) batches.set(mat,[]); batches.get(mat).push(g);
    if(outline) {
      const e = new T.EdgesGeometry(geo,28); e.applyMatrix4(scratch.matrix); lineParts.push(e);
    }
    primitiveCount++;
    return geo;
  }
  function box(x,y,z,w,h,d,mat,outline=true,ry=0,bevel=0) {
    const g=bevel ? new T.RoundedBoxGeometry(w,h,d,2,Math.min(bevel,w*.24,h*.24,d*.24)) : new T.BoxGeometry(w,h,d);
    return part(g,mat,x,y,z,0,ry,0,outline);
  }
  function cyl(x,y,z,r,h,mat,n=16,rx=0,rz=0,r2=r) { return part(new T.CylinderGeometry(r2,r,h,n),mat,x,y,z,rx,0,rz,r>=.09&&h>.07); }
  function ball(x,y,z,r,mat,sx=1,sy=1,sz=1) {
    const g = new T.SphereGeometry(r,12,8); g.scale(sx,sy,sz); return part(g,mat,x,y,z);
  }
  function pipe(points,r,mat,curved=true) {
    const p=points.map(v=>new T.Vector3(...v));
    if(!curved && p.length>2) {
      for(let i=1;i<p.length;i++) part(new T.TubeGeometry(new T.LineCurve3(p[i-1],p[i]),1,r,8,false),mat);
      return;
    }
    const curve = curved ? new T.CatmullRomCurve3(p) : new T.LineCurve3(p[0],p[1]);
    return part(new T.TubeGeometry(curve,curved?Math.max(12,points.length*6):1,r,8,false),mat);
  }
  function torus(x,y,z,r,tube,mat,rx=0,ry=0,arc=TAU) {
    return part(new T.TorusGeometry(r,tube,7,48,arc),mat,x,y,z,rx,ry);
  }
  function label(w,h,paint) {
    const resolution=Math.max(280,256/w,128/h);
    const c=document.createElement('canvas'); c.width=Math.round(w*resolution);c.height=Math.round(h*resolution);
    const ctx=c.getContext('2d'); paint(ctx,c.width,c.height);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
    return new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
  }
  function decal(x,y,z,w,h,mat,ry=0,rx=0) {
    const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.set(rx,ry,0);scene.add(m);return m;
  }
  function textLabel(text,sub,bg='#e5dcc1',fg='#245558',w=2,h=.6) {
    return label(w,h,(c,W,H)=>{c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.font=`700 ${H*.52}px "Yu Gothic", "Microsoft YaHei", sans-serif`;c.fillText(text,W*.5,H*(sub?.38:.5),W*.90);if(sub){c.font=`600 ${H*.15}px sans-serif`;c.fillText(sub,W*.5,H*.81,W*.90);}});
  }

  // A complete square plinth, layered road section, and individually jointed pavement.
  box(0,-.43,0,14.25,.86,14.25,M.base,true,0,.16);
  box(0,-.055,0,14.12,.13,14.12,M.edge,true,0,.08);
  box(0,.025,0,13.98,.08,13.98,std(0x192d43,.34),false);
  box(-1.32,.17,-2.92,11.32,.26,8.12,M.concrete,true,0,.04);
  box(-1.32,.31,-2.92,11.30,.035,8.1,M.sidewalk,false);
  for(let x=-6.96;x<4.3;x+=.75) for(let z=-6.94;z<1.08;z+=.75) {
    box(x+.365,.335,z+.365,.716,.012,.716,((Math.round(x*2+z*3)%4)===0)?M.concrete:M.sidewalk,false);
  }
  for(let x=-6.7;x<4.35;x+=.5) box(x,.245,1.115,.475,.25,.18,M.curb,true,0,.025);
  for(let z=-6.7;z<1.1;z+=.5) box(4.38,.245,z,.18,.25,.475,M.curb,true,0,.025);
  // Expansion joints and ceramic facade skirting.
  for(let x=-5;x<=2.7;x+=.44) box(x,.52,-.765,.42,.28,.1,M.wallLight,true);
  const roadPaint = new T.MeshStandardMaterial({color:0xc5c8b2,roughness:.45,metalness:.1});
  for(let z=1.65;z<6.8;z+=.86) box(-4.75,.112,z,3.0,.014,.42,roadPaint,false);
  for(let x=-1.8;x<6.5;x+=1.4) box(x,.115,5.92,.82,.012,.065,M.yellow,false);
  // One marked parking space, raised wheel stops, arrow and bicycle lane.
  box(.05,.114,3.25,.065,.013,3.48,roadPaint,false);
  box(2.75,.114,3.25,.065,.013,3.48,roadPaint,false);
  box(1.4,.114,4.98,2.76,.013,.065,roadPaint,false);
  box(1.4,.114,1.55,2.76,.013,.065,roadPaint,false);
  box(1.4,.22,1.95,1.62,.2,.23,M.concrete,true,0,.045);
  for(let x of [.81,1.99]) box(x,.326,1.95,.19,.012,.14,M.yellow,false);
  const pMark=textLabel('P','','rgba(0,0,0,0)','#b7c7be',1,1);
  decal(1.4,.127,3.55,.93,.93,pMark,0,-Math.PI/2);
  for(let z=-5.6;z<4.6;z+=1.65) box(5.8,.115,z,.06,.015,.7,roadPaint,false);
  // Road drains with actual inset bars and screws.
  function drain(x,z,rot=0) {
    box(x,.349,z,.72,.022,.30,M.dark,true,rot);
    for(let i=0;i<11;i++) box(x-.32+i*.064,.365,z,.024,.018,.27,M.metal,false,rot);
  }
  drain(-3.2,.84);drain(2.76,.84);
  for(let x=-4.5;x<1.5;x+=.35) {
    box(x,.369,.52,.33,.033,.34,M.yellow,false);
    for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++) cyl(x+a*.08,.395,.52+b*.08,.015,.017,M.yellow,8);
  }
  // Road manhole: layered metal disk, concentric rings and radial bolts.
  cyl(4.95,.12,4.25,.60,.025,M.dark,48);
  torus(4.95,.138,4.25,.53,.018,M.metal,Math.PI/2);
  for(let i=-3;i<=3;i++) box(4.95,.142,4.25+i*.11,Math.sqrt(.22-(i*.11)**2)*2,.012,.022,M.metal,false);

  // Building shell; no fake interior image. Glass sits in front of real furnishings.
  box(-1.2,.43,-3.25,7.85,.16,4.93,M.inside,true,0,.03);
  box(-1.2,1.97,-5.66,7.8,3.05,.16,M.wall,true);
  box(-5.08,1.97,-3.25,.16,3.05,4.9,M.wall,true);
  box(2.69,.665,-3.25,.16,.33,4.9,M.wallLight,true);
  box(2.69,3.21,-3.25,.16,.55,4.9,M.wall,true);
  box(2.69,1.84,-5.04,.16,1.66,1.1,M.wall,true);
  box(2.69,1.84,-1.02,.16,1.66,.35,M.wall,true);
  box(2.70,1.88,-2.99,.021,2.04,2.85,M.glass,false);
  for(let z of [-4.46,-3.02,-1.56]) box(2.79,1.9,z,.095,2.19,.075,M.dark,true);
  for(let y of [.83,2.93]) box(2.79,y,-3.0,.1,.075,3.05,M.silver,true);
  // Ceramic lower wall, robust pilasters, recessed front frame.
  for(let x of [-5.04,-1.2,1.18,2.68]) {
    box(x,1.86,-.77,.115,2.91,.15,M.teal,true,0,.018);
    box(x,.59,-.71,.18,.25,.24,M.wallLight,true);
  }
  box(-1.2,2.96,-.76,7.82,.15,.20,M.dark,true);
  box(-3.14,1.76,-.762,3.69,2.25,.025,M.glass,false);
  box(1.93,1.76,-.762,1.4,2.25,.025,M.glass,false);
  for(let y of [.66,1.04,2.88]) {
    box(-3.14,y,-.71,3.69,.055,.075,M.silver,true);
    box(1.93,y,-.71,1.4,.055,.075,M.silver,true);
  }
  box(-3.22,1.77,-.7,.06,2.19,.07,M.silver,true);
  // Very fine glass glints, kept narrow so the interior stays legible.
  const glint=new T.MeshBasicMaterial({color:0xa2e2dd,transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide});
  const streak=(x,y,z,w,h,ry=0)=>{ const m=decal(x,y,z,w,h,glint,ry);m.rotation.z=-.32;};
  streak(-4.58,2.25,-.675,.028,.72);streak(-2.84,2.14,-.675,.065,1.06);streak(2.28,2.27,-.675,.05,.86);
  // Interior tiled floor and warm wall wainscoting.
  for(let x=-4.85;x<2.6;x+=.55) for(let z=-5.4;z<-.86;z+=.55) box(x,.523,z,.53,.008,.53,((Math.round(x*3+z*2)%3)===0)?M.cream:M.inside,false);
  box(-1.18,1.0,-5.54,7.51,.8,.035,M.wood,false);
  box(-1.2,3.42,-3.26,7.86,.13,4.94,M.inside,true);
  for(let x of [-3.55,.65]) {
    box(x,3.32,-3.25,.25,.055,3.2,M.warm,false);
    box(x,3.28,-3.25,.40,.045,3.4,M.shelf,true);
    box(x,3.25,-3.25,.23,.02,3.14,M.warm,false);
  }

  // Shelves and individually modeled cartons, cans, bottles and packets.
  const productMats=[M.red,M.orange,M.yellow,M.blue,M.green,M.productWhite,M.mint];
  function bottle(x,y,z,color,scale=1) {
    cyl(x,y+.12*scale,z,.052*scale,.24*scale,color,9,0,0,.046*scale);
    cyl(x,y+.265*scale,z,.024*scale,.07*scale,M.cream,8);
    cyl(x,y+.305*scale,z,.027*scale,.025*scale,color,8);
    cyl(x,y+.12*scale,z,.053*scale,.075*scale,M.productWhite,9);
  }
  function shelf(cx,cz,width=1.7,levels=3) {
    box(cx,1.3,cz,width,1.6,.08,M.shelf,true);
    for(let x of [cx-width/2,cx+width/2]) box(x,1.28,cz+.01,.055,1.6,.54,M.silver,true);
    for(let j=0;j<levels;j++) {
      const y=.69+j*.46;
      box(cx,y,cz+.15,width+.04,.055,.64,M.shelf,true);
      box(cx,y+.042,cz+.46,width+.05,.08,.035,M.cream,true);
      for(let i=0;i<Math.floor(width/.18);i++) {
        const x=cx-width*.44+i*.18;
        const mat=productMats[(j*3+i)%productMats.length];
        if(j===0) { bottle(x,y+.03,cz+.25,mat,.84); bottle(x,y+.03,cz+.03,mat,.84); }
        else {
          const h=.20+rand()*.12;
          box(x,y+.04+h/2,cz+.25,.132,h,.16,mat,false,range(-.08,.08),.015);
          box(x,y+.06+h*.5,cz+.335,.09,.055,.003,M.productWhite,false);
          box(x,y+.04+h/2,cz+.02,.13,h,.16,mat,false);
        }
        box(x,y+.054,cz+.485,.09,.027,.003,M.yellow,false);
      }
    }
    box(cx,2.0,cz+.05,width+.06,.19,.15,M.teal,true);
  }
  shelf(-3.65,-4.92,2.1,3);shelf(-2.72,-3.12,1.8,3);shelf(-.33,-3.78,1.6,3);
  // Illuminated refrigerator bank along the back wall.
  for(let x of [.02,1.06,2.1]) {
    box(x,1.77,-5.2,.97,2.48,.66,M.dark,true,0,.035);
    box(x,1.77,-4.855,.84,2.15,.03,M.cool,false);
    box(x,1.75,-4.81,.79,2.0,.04,M.cream,true);
    box(x,1.74,-4.77,.73,1.92,.03,M.dark,false);
    for(let j=0;j<4;j++) {
      box(x,.84+j*.43,-4.64,.78,.035,.26,M.silver,true);
      for(let i=0;i<5;i++) bottle(x-.29+i*.145,.87+j*.43,-4.62,productMats[(i+j*2)%7],.75);
    }
    box(x,1.77,-4.45,.86,2.13,.018,M.glassDark,false);
    box(x+.31,1.64,-4.4,.036,.48,.045,M.silver,true);
    for(let xx of [x-.44,x+.44]) box(xx,1.77,-4.42,.025,2.18,.045,M.silver,false);
  }
  decal(1.06,2.91,-4.42,2.8,.17,textLabel('COLD DRINKS  ·  つめたい','','#dae7d1','#2b6665',2.8,.17));
  // Checkout: kickboard, grooved timber panels, register, scanner and bags.
  box(-3.57,.98,-1.64,2.34,.88,.80,M.wood,true,0,.045);
  box(-3.57,.57,-1.64,2.25,.12,.73,M.dark,true);
  box(-3.57,1.45,-1.64,2.52,.10,.92,M.cream,true,0,.035);
  for(let x=-4.62;x<-2.43;x+=.13) box(x,1.0,-1.231,.025,.68,.025,M.brown,false);
  box(-4.04,1.55,-1.65,.46,.11,.38,M.dark,true,0,.025);
  box(-4.04,1.78,-1.78,.085,.36,.09,M.dark,true);
  box(-4.04,1.98,-1.72,.45,.31,.065,M.dark,true,0,.025);
  box(-4.04,1.98,-1.679,.36,.23,.008,M.cool,false);
  box(-3.72,1.58,-1.4,.13,.15,.15,M.dark,true);
  box(-4.48,1.61,-1.66,.19,.26,.14,M.cream,true);
  torus(-4.48,1.77,-1.66,.055,.009,M.brown,0,0,Math.PI);
  // Oden warmer, real recessed stainless compartments and food pieces.
  box(-2.78,1.58,-1.6,.78,.21,.58,M.metal,true,0,.03);
  box(-2.78,1.7,-1.6,.69,.035,.49,M.brown,false);
  for(let x of [-2.94,-2.61]) for(let z of [-1.74,-1.47]) {
    box(x,1.72,z,.30,.025,.23,M.orange,true);
    for(let k=0;k<3;k++) ball(x+range(-.08,.08),1.755,z+range(-.055,.055),.05,M.cream,1,.6,.7);
  }
  for(let x of [-3.14,-2.42]) box(x,1.96,-1.84,.035,.53,.035,M.silver,true);
  box(-2.78,2.24,-1.62,.82,.055,.62,M.red,true,0,.025);
  box(-2.78,1.99,-1.31,.73,.39,.012,M.glass,false);
  decal(-2.78,2.24,-1.294,.64,.12,textLabel('おでん','','#e9d5aa','#873f31',.64,.12));
  // Small wall menus, clock and security camera.
  decal(-3.75,2.65,-5.56,1.9,.45,textLabel('できたて、あたたかい。','FRESH FOOD · EVERY DAY','#f1d6a1','#77482c',1.9,.45));
  cyl(-4.8,2.75,-4.0,.19,.055,M.cream,32,0,Math.PI/2);
  pipe([[-4.76,2.75,-4],[-4.75,2.87,-4]],.012,M.dark,false);
  pipe([[-4.75,2.75,-4],[-4.75,2.75,-3.9]],.01,M.dark,false);
  box(2.48,2.91,-1.12,.16,.17,.35,M.cream,true,0,.03);
  cyl(2.48,2.91,-.934,.052,.025,M.dark,16,Math.PI/2);

  // Roof, folded metal edges, standing seams, rain gutter and downspout.
  box(-1.2,3.58,-3.24,8.12,.31,5.12,M.teal,true,0,.055);
  box(-1.2,3.88,-3.05,8.52,.22,5.82,M.dark,true,0,.055);
  box(-1.2,4.01,-3.05,8.37,.10,5.72,M.teal,true,0,.035);
  for(let x=-5.25;x<3.0;x+=.32) box(x,4.078,-3.05,.027,.046,5.65,M.green,false);
  box(-1.2,4.11,-5.9,8.55,.16,.13,M.silver,true,0,.025);
  box(-5.44,4.11,-3.04,.12,.16,5.85,M.silver,true,0,.025);
  box(3.04,4.11,-3.04,.12,.16,5.85,M.silver,true,0,.025);
  box(-1.2,3.91,-.07,8.65,.16,.18,M.dark,true,0,.035);
  box(-1.2,3.75,-.18,8.12,.034,.12,M.warm,false);
  pipe([[2.96,3.95,-.05],[3.13,3.8,-.06],[3.15,3.42,-.1],[3.15,.58,-.1],[3.42,.36,-.1]],.052,M.metal);
  for(let y of [.8,2.0,3.1]) box(3.15,y,-.1,.16,.05,.14,M.dark,true);
  // Roof service units have separate fans, louvers, pipework and feet.
  function condenser(x,z,w=1.3) {
    for(let xx of [x-w*.35,x+w*.35]) box(xx,4.18,z,.12,.16,.73,M.dark,true);
    box(x,4.53,z,w,.62,.88,M.concrete,true,0,.045);
    box(x,4.86,z,w+.04,.07,.92,M.silver,true,0,.025);
    torus(x,4.908,z,.30,.021,M.dark,Math.PI/2);
    cyl(x,4.9,z,.266,.02,M.dark,28);
    for(let i=0;i<4;i++) box(x,4.92,z,.52,.013,.035,M.metal,false,i*Math.PI/4);
    for(let j=0;j<8;j++) box(x,4.30+j*.056,z+.449,w-.16,.022,.025,M.dark,false);
    pipe([[x+w*.5,4.45,z-.15],[x+w*.5+.22,4.4,z-.15],[x+w*.5+.25,4.09,z-.4],[x+w*.5+.6,4.09,z-.6]],.025,M.cream);
  }
  condenser(-3.65,-4.15);condenser(-1.95,-4.15);
  box(1.66,4.24,-4.6,1.02,.25,1.16,M.dark,true,0,.03);
  cyl(1.66,4.62,-4.6,.17,.65,M.silver,16);
  cyl(1.66,4.98,-4.6,.28,.08,M.silver,16);
  // Large illuminated enamel fascia. Canvas is lettering only, on actual 3D signs.
  box(-1.2,3.35,-.49,7.96,.67,.28,M.cream,true,0,.045);
  box(-1.2,3.62,-.335,7.86,.055,.025,M.green,false);
  box(-1.2,3.09,-.335,7.86,.055,.025,M.red,false);
  const signMat=label(7.65,.49,(c,W,H)=>{
    c.fillStyle='#fff0cc';c.fillRect(0,0,W,H);
    c.fillStyle='#1f665d';c.beginPath();c.arc(W*.065,H*.45,H*.28,Math.PI,TAU);c.lineTo(W*.065+H*.28,H*.48);c.lineTo(W*.065-H*.28,H*.48);c.fill();
    c.strokeStyle='#1f665d';c.lineWidth=H*.027;c.beginPath();c.moveTo(W*.065,H*.46);c.lineTo(W*.065,H*.78);c.quadraticCurveTo(W*.065-H*.13,H*.89,W*.065-H*.13,H*.73);c.stroke();
    c.textAlign='center';c.textBaseline='middle';c.font=`800 ${H*.88}px "Yu Gothic", "Microsoft YaHei", sans-serif`;
    [...'雨宿り'].forEach((ch,i)=>c.fillText(ch,W*(.225+i*.104),H*.51));
    c.textAlign='left';c.font=`700 ${H*.28}px sans-serif`;c.fillText('AMAYADORI',W*.565,H*.38);c.font=`500 ${H*.14}px sans-serif`;c.fillText('M A R T  /  2 4  H O U R S',W*.565,H*.76);
    c.fillStyle='#bb5146';c.font=`800 ${H*.55}px sans-serif`;c.fillText('24',W*.875,H*.47);c.font=`600 ${H*.13}px sans-serif`;c.fillText('OPEN',W*.878,H*.83);
  });
  decal(-1.2,3.35,-.337,7.65,.49,signMat);
  box(2.98,3.39,-2.65,.24,.69,2.25,M.cream,true,0,.04);
  decal(3.109,3.40,-2.65,2.08,.52,textLabel('雨宿り','AMAYADORI MART','#fff0cc','#23675e',2.08,.52),Math.PI/2);
  // Projecting little lit blade sign.
  box(3.30,3.10,-.53,.66,1.2,.22,M.red,true,0,.06);
  decal(3.30,3.12,-.408,.56,1.04,textLabel('24','OPEN','#f7d6a0','#9b3c34',.56,1.04));

  // Sliding doors are genuine independently animated 3D assemblies.
  const doors=[];
  for(let side of [-1,1]) {
    const g=new T.Group();g.position.set(side*.585,0,-.665);scene.add(g);
    function db(x,y,w,h,d,mat) {
      const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,0);g.add(m);
      if(mat!==M.glass){const e=new T.LineSegments(new T.EdgesGeometry(m.geometry,25),ink);m.add(e);}return m;
    }
    db(0,1.72,1.12,2.38,.022,M.glass);
    for(let x of [-.56,.56]) db(x,1.72,.047,2.42,.065,M.silver);
    for(let y of [.52,1.05,2.91]) db(0,y,1.16,.05,.065,M.silver);
    db(-side*.35,1.66,.045,.39,.09,M.dark);
    const band=new T.Mesh(new T.PlaneGeometry(1.06,.09),new T.MeshBasicMaterial({color:0x99b99e,transparent:true,opacity:.65,side:T.DoubleSide}));band.position.set(0,1.12,.04);g.add(band);
    const sticker=new T.Mesh(new T.PlaneGeometry(.50,.19),textLabel('自動','AUTOMATIC','#f4e7c5','#255c58',.5,.19));sticker.position.set(0,2.05,.043);g.add(sticker);
    doors.push({g,side});
  }
  box(0,3.01,-.63,2.45,.17,.16,M.teal,true,0,.02);
  box(0,3.016,-.533,.15,.042,.02,M.dark,false);
  box(0,.52,-.65,2.5,.035,.20,M.silver,true);
  box(0,.38,-.18,2.60,.12,.74,M.concrete,true,0,.035);
  box(0,.452,-.21,1.88,.024,.52,M.dark,true,0,.025);
  for(let i=-7;i<=7;i++) box(i*.12,.467,-.21,.024,.005,.47,M.metal,false);

  // Window posters, real stacks of baskets and a sandwich-board outside.
  decal(-4.47,1.93,-.678,.70,.94,label(.70,.94,(c,W,H)=>{
    c.fillStyle='#e8d4a6';c.fillRect(0,0,W,H);c.fillStyle='#a75139';c.textAlign='center';c.font=`800 ${H*.14}px "Yu Gothic",sans-serif`;c.fillText('秋のごはん',W*.5,H*.2);
    c.fillStyle='#465d3d';c.beginPath();c.arc(W*.5,H*.52,W*.27,0,TAU);c.fill();c.fillStyle='#f2dd9e';c.beginPath();c.arc(W*.5,H*.50,W*.23,0,TAU);c.fill();
    c.fillStyle='#cd8b44';for(let i=0;i<6;i++)c.fillRect(W*(.34+(i%3)*.1),H*(.4+Math.floor(i/3)*.1),W*.08,H*.075);
    c.fillStyle='#77452e';c.font=`800 ${H*.15}px sans-serif`;c.fillText('¥ 390',W*.5,H*.85);
  }));
  for(let i=0;i<5;i++) {
    box(1.98,.56+i*.075,-1.27,.40,.10,.32,M.green,true,0,.02);
    for(let j=0;j<5;j++) box(1.82+j*.075,.57+i*.075,-1.097,.025,.055,.006,M.dark,false);
  }
  box(-4.88,.93,.32,.67,1.05,.07,M.wood,true,.12,.025);
  decal(-4.874,.96,.372,.55,.83,textLabel('おでん','あったか  ¥120','#254a43','#e8d0a0',.55,.83),.12);
  pipe([[-5.17,.38,.30],[-5.15,1.48,.30],[-5.15,.38,.70]],.027,M.wood);
  pipe([[-4.59,.38,.30],[-4.59,1.48,.30],[-4.59,.38,.70]],.027,M.wood);

  // Vending machine: chamfered enclosure, visible bottles, buttons and retrieval slot.
  const vx=-5.92,vz=-.48;
  for(let xx of [vx-.36,vx+.36]) box(xx,.40,vz,.16,.13,.55,M.dark,true);
  box(vx,1.66,vz,1.08,2.48,.83,M.red,true,0,.075);
  box(vx,2.64,vz+.442,.91,.28,.045,M.cream,true,0,.018);
  decal(vx,2.64,vz+.471,.87,.20,textLabel('DRINKS','','#fff2d3','#b5433d',.87,.2));
  box(vx-.07,1.94,vz+.438,.76,1.03,.05,M.dark,true);
  box(vx-.07,1.94,vz+.471,.68,.94,.018,M.cool,false);
  for(let j=0;j<3;j++) {
    box(vx-.07,1.57+j*.30,vz+.53,.7,.028,.16,M.silver,true);
    for(let i=0;i<4;i++) {
      bottle(vx-.33+i*.172,1.60+j*.30,vz+.52,productMats[(i+j*2)%7],.67);
      box(vx-.33+i*.172,1.57+j*.30,vz+.64,.085,.028,.018,M.amber,false);
    }
  }
  box(vx-.07,1.95,vz+.668,.74,.99,.012,M.glassDark,false);
  box(vx+.42,1.83,vz+.44,.15,.43,.04,M.dark,true);
  box(vx+.42,1.96,vz+.467,.10,.09,.012,M.cool,false);
  cyl(vx+.42,1.72,vz+.48,.031,.025,M.silver,12,Math.PI/2);
  box(vx,1.02,vz+.44,.77,.22,.06,M.dark,true,0,.025);
  box(vx,.88,vz+.49,.78,.045,.16,M.silver,true);
  decal(vx,.64,vz+.429,.7,.13,textLabel('つめた〜い','','#b44a47','#f4dfb0',.7,.13));
  pipe([[vx-.51,.6,vz-.1],[vx-.67,.4,vz-.1],[-5.18,.38,-1]],.019,M.rubber);
  // Umbrella rack with open lattice and curved, colorful handles.
  box(-1.87,.45,.08,.70,.12,.48,M.dark,true,0,.025);
  for(let xx of [-2.2,-1.54]) for(let zz of [-.13,.29]) pipe([[xx,.44,zz],[xx,.97,zz]],.019,M.silver,false);
  for(let y of [.64,.95]) {
    pipe([[-2.2,y,-.13],[-1.54,y,-.13],[-1.54,y,.29],[-2.2,y,.29],[-2.2,y,-.13]],.016,M.metal,false);
    for(let j=0;j<5;j++) pipe([[-2.16+j*.14,y,-.13],[-2.16+j*.14,y,.29]],.011,M.metal,false);
  }
  for(let i=0;i<5;i++) {
    const x=-2.14+i*.13,z=i%2?.15:.0, mat=[M.blue,M.yellow,M.red,M.mint,M.cream][i];
    cyl(x,.91,z,.045,.68,mat,8,0,-.05,.025);
    pipe([[x,1.22,z],[x,1.39,z],[x+.05,1.43,z],[x+.10,1.38,z],[x+.09,1.33,z]],.016,M.wood);
    box(x,.91,z+.043,.10,.04,.02,M.dark,false);
  }

  // A finely built city bicycle alongside the glazed side wall.
  function bicycle(cx,cz) {
    // Local X runs along the bicycle. Transform it to world Z for parking by the wall.
    const P=(x,y,z=0)=>[cx+z,y+.36,cz-x];
    const tube=(pts,r,mat)=>pipe(pts.map(p=>P(...p)),r,mat,false);
    const wh=[[-.78,.47],[.78,.47]];
    for(let [x,y] of wh) {
      torus(...P(x,y),.435,.043,M.rubber,0,Math.PI/2);
      torus(...P(x,y),.365,.016,M.silver,0,Math.PI/2);
      for(let i=0;i<20;i++) {
        const a=i*TAU/20;
        tube([[x,y,0],[x+Math.cos(a)*.365,y+Math.sin(a)*.365,0]],.0055,M.silver);
      }
      tube([[x,y,-.11],[x,y,.11]],.027,M.metal);
      const pts=[];for(let i=0;i<=20;i++){let a=.04+i*(Math.PI-.08)/20;pts.push([x+.473*Math.cos(a),y+.473*Math.sin(a),0]);}tube(pts,.027,M.mint);
    }
    const A=[-.78,.47],B=[-.28,1.16],C=[.03,.46],D=[.53,1.19],E=[.78,.47];
    tube([A,B,C,A],.026,M.mint);tube([B,D,C],.027,M.mint);tube([D,E],.032,M.mint);
    tube([[.53,1.19],[.47,1.42],[.52,1.54]],.023,M.silver);
    tube([[.52,1.54,-.24],[.52,1.54,.24]],.021,M.silver);
    tube([[.52,1.54,-.24],[.65,1.49,-.24]],.028,M.dark);
    tube([[.52,1.54,.24],[.65,1.49,.24]],.028,M.dark);
    tube([[-.28,1.16],[-.30,1.35]],.025,M.silver);
    const seat=box(...P(-.3,1.38),.22,.075,.36,M.brown,true,0,.035);
    tube([[-.78,.51],[-.88,1.04],[-.38,1.04],[-.44,.62]],.014,M.silver);
    tube([[-.93,1.04,-.16],[-.40,1.04,-.16]],.015,M.silver);
    tube([[-.93,1.04,.16],[-.40,1.04,.16]],.015,M.silver);
    // Open wire basket on the handlebar.
    const bx=.91,by=1.28;
    for(let y of [by,by+.31]) {
      tube([[bx-.19,y,-.23],[bx+.19,y,-.23],[bx+.19,y,.23],[bx-.19,y,.23],[bx-.19,y,-.23]],.012,M.dark);
    }
    for(let i=0;i<=6;i++) for(let z of [-.23,.23]) tube([[bx-.19+i*.063,by,z],[bx-.19+i*.063,by+.31,z]],.007,M.metal);
    for(let i=0;i<=5;i++) for(let x of [bx-.19,bx+.19]) tube([[x,by,-.23+i*.092],[x,by+.31,-.23+i*.092]],.007,M.metal);
    tube([[.02,.46,-.07],[-.08,.26,-.28]],.014,M.silver);
    tube([[.02,.46,0],[.12,.42,.19]],.024,M.metal);
    box(...P(.12,.42,.22),.18,.045,.14,M.dark,true);
    torus(...P(.02,.46),.11,.014,M.silver,0,Math.PI/2);
    // Brake cable drapes around the head tube.
    tube([[.53,1.53,.18],[.66,1.36,.18],[.45,1.04,.11],[.48,.91,.02]],.008,M.rubber);
  }
  bicycle(3.70,-2.40);

  // Recycling station, crates, potted plants and service door.
  for(let i=0;i<2;i++) {
    const x=3.42+i*.65;
    box(x,.83,-5.3,.56,.96,.58,M.cream,true,0,.055);
    box(x,1.34,-5.3,.60,.15,.62,i?M.green:M.blue,true,0,.04);
    box(x,1.34,-4.974,.27,.074,.025,M.dark,true,0,.025);
    decal(x,.98,-4.999,.35,.26,textLabel(i?'びん':'かん','RECYCLE','#d6d6bb','#34656a',.35,.26));
  }
  function plant(x,z,s=1) {
    cyl(x,.46+.19*s,z,.17*s,.38*s,M.red,12,0,0,.23*s);
    cyl(x,.66+.19*s,z,.205*s,.025,M.soil,12);
    for(let i=0;i<7;i++) {
      const a=i*TAU/7; const ex=x+Math.cos(a)*.24*s,ez=z+Math.sin(a)*.24*s;
      pipe([[x,.72,z],[ex,.99+rand()*.21,ez]],.018,M.leaf);
      ball(ex,.99+rand()*.15,ez,.09*s,M.leaf,.6,1.5,.6);
    }
  }
  plant(-5.63,-2.14,.8);plant(2.93,-6.02,.85);
  box(-1.8,1.55,-5.76,1.03,2.1,.06,M.teal,true);
  box(-2.19,1.5,-5.81,.05,.08,.03,M.silver,false);
  // Rear facade: panel joints, staff entrance, service meters and external pipework.
  const joint=toon(0x768b87);
  for(let y of [.88,1.52,2.16,2.80]) {
    box(-1.2,y,-5.746,7.72,.008,.008,joint,false);
    box(-5.167,y,-3.3,.008,.008,4.77,joint,false);
  }
  for(let x of [-4.95,-2.32,-1.28,2.55]) box(x,1.96,-5.80,.055,2.92,.065,M.wallLight,true);
  box(-1.8,2.64,-5.81,1.15,.08,.12,M.dark,true);
  decal(-1.8,2.18,-5.801,.69,.20,textLabel('STAFF ONLY','','#1c4547','#c3ceb6',.69,.20),Math.PI);
  box(-3.67,2.53,-5.94,1.24,.65,.34,M.concrete,true,0,.045);
  box(-3.67,2.88,-5.94,1.30,.07,.38,M.silver,true,0,.02);
  for(let y=2.32;y<2.79;y+=.065) box(-3.67,y,-6.124,1.05,.025,.018,M.dark,false);
  pipe([[-4.27,2.51,-5.94],[-4.55,2.51,-5.94],[-4.58,.65,-5.83],[-4.64,.46,-5.92]],.035,M.cream,false);
  box(1.43,1.89,-5.89,.52,.69,.23,M.metal,true,0,.035);
  cyl(1.43,2.03,-6.024,.15,.04,M.cream,24,Math.PI/2);
  cyl(1.43,2.03,-6.049,.11,.012,M.glassDark,24,Math.PI/2);
  box(1.43,1.68,-6.017,.30,.065,.018,M.dark,true);
  for(let x of [1.28,1.58]) pipe([[x,2.24,-5.86],[x,3.03,-5.84],[2.34,3.03,-5.84],[2.34,3.44,-5.79]],.015,M.silver,false);
  pipe([[1.43,1.54,-5.89],[1.43,.45,-5.84],[2.50,.41,-5.84]],.024,M.metal,false);
  // Two genuinely open storage crates with battens, corners and packages inside.
  for(let n=0;n<2;n++) {
    const x=-3.76+n*.68;
    box(x,.39,-6.26,.61,.06,.53,M.brown,true);
    for(let xx of [x-.29,x+.29]) for(let zz of [-6.50,-6.02]) box(xx,.63,zz,.048,.48,.048,M.wood,true);
    for(let y of [.49,.65,.81]) {
      box(x,y,-6.51,.61,.09,.032,M.wood,true);
      box(x,y,-6.01,.61,.09,.032,M.wood,true);
      box(x-.30,y,-6.26,.032,.09,.53,M.wood,true);
      box(x+.30,y,-6.26,.032,.09,.53,M.wood,true);
    }
    for(let j=0;j<4;j++) box(x-.20+j*.13,.61,-6.28,.11,.31,.31,M.cream,false);
  }

  // Japanese streetlamp with a curved neck, lens and warm downward light.
  cyl(-5.96,2.69,2.19,.065,5.16,M.dark,14);
  cyl(-5.96,.25,2.19,.15,.35,M.metal,16);
  pipe([[-5.96,4.95,2.19],[-5.94,5.30,2.19],[-5.75,5.48,2.19],[-5.40,5.48,2.19],[-5.12,5.30,2.19]],.065,M.dark);
  box(-5.10,5.20,2.19,.49,.15,.37,M.dark,true,0,.07);
  box(-5.10,5.115,2.19,.37,.03,.27,M.warm,false);
  const street = new T.SpotLight(0xffcc83,70,13,Math.PI*.27,.7,1.6);
  street.position.set(-5.10,5.04,2.19);street.target.position.set(-4.3,0,3.1);scene.add(street,street.target);
  street.castShadow=true;street.shadow.mapSize.set(1024,1024);street.shadow.bias=-.0008;street.shadow.normalBias=.025;

  // Utility poles, transformer, crossarms, ceramic insulators and sagging cables.
  const poles=[{x:5.7,z:-5.76,h:6.7},{x:-6.45,z:-5.95,h:6.05}];
  for(let {x,z,h} of poles) {
    cyl(x,h/2+.12,z,.10,h,M.wood,14,0,0,.074);
    cyl(x,.35,z,.16,.55,M.concrete,16);
    box(x,h-.38,z,1.82,.11,.13,M.dark,true);
    for(let xx of [-.75,0,.75]) {
      cyl(x+xx,h-.23,z,.045,.22,M.metal,10);
      for(let y of [h-.21,h-.13,h-.05]) cyl(x+xx,y,z,.09,.045,M.cream,12);
    }
    for(let y=1;y<h-1;y+=.65) pipe([[x-.13,y,z],[x+.13,y,z]],.018,M.metal,false);
    box(x,.96,z+.105,.19,.45,.035,M.yellow,true);
    for(let y=.8;y<1.16;y+=.10) box(x,y,z+.129,.18,.043,.012,M.dark,false);
  }
  cyl(5.48,4.95,-5.7,.26,.83,M.concrete,20);
  cyl(5.48,5.40,-5.7,.30,.09,M.silver,20);
  cyl(5.48,4.51,-5.7,.29,.065,M.silver,20);
  pipe([[5.48,5.43,-5.7],[5.43,5.91,-5.7],[5.7,6.32,-5.76]],.027,M.rubber);
  for(let offset of [-.75,0,.75]) {
    const points=[];
    for(let i=0;i<=18;i++) {
      const t=i/18;
      points.push([-6.45+12.15*t+offset,6.02+.65*t-Math.sin(t*Math.PI)*.84,-5.95+.19*t]);
    }
    pipe(points,.016,M.rubber);
  }
  pipe([[5.7,5.61,-5.76],[5.2,5.14,-4.6],[4.21,4.18,-2.86],[2.78,3.66,-1.97]],.012,M.rubber);
  // A triangular stop sign, bolted to its pole, and a small street-name plate.
  cyl(5.87,1.46,.30,.035,2.68,M.silver,12);
  const tri=new T.Shape();tri.moveTo(-.37,.22);tri.lineTo(.37,.22);tri.lineTo(0,-.42);tri.closePath();
  const tg=new T.ExtrudeGeometry(tri,{depth:.055,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:1,steps:1});
  part(tg,M.cream,5.87,2.72,.27,0,0,0,true);
  const tr2=new T.Shape();tr2.moveTo(-.31,.18);tr2.lineTo(.31,.18);tr2.lineTo(0,-.35);tr2.closePath();part(new T.ShapeGeometry(tr2),M.red,5.87,2.72,.346);
  decal(5.87,2.72,.352,.48,.17,textLabel('止まれ','','rgba(0,0,0,0)','#f4dfbd',.48,.17));
  box(5.85,1.93,.30,.80,.26,.055,M.dark,true);
  decal(5.85,1.93,.334,.72,.19,textLabel('雨宿り町  2丁目','','#326772','#e3dbb7',.72,.19));

  // A clear open umbrella leaning against the shop, with a curved 3D canopy.
  const umbrellaMat=new T.MeshPhysicalMaterial({color:0x65a6b0,roughness:.26,metalness:.08,transparent:true,opacity:.38,side:T.DoubleSide,depthWrite:false});
  const ux=2.82,uz=.46,uy=1.83,ur=.65;
  for(let j=0;j<8;j++) {
    const positions=[],indices=[];const steps=7,rings=5;
    for(let r=0;r<=rings;r++) for(let k=0;k<=steps;k++) {
      const u=r/rings,a=(j+k/steps)*TAU/8;
      const scallop=Math.sin(k/steps*Math.PI)*.045*u*u;
      positions.push(ux+Math.cos(a)*ur*u,uy-.34*u*u+scallop,uz+Math.sin(a)*ur*u);
    }
    for(let r=0;r<rings;r++)for(let k=0;k<steps;k++){const i=r*(steps+1)+k;indices.push(i,i+1,i+steps+1,i+1,i+steps+2,i+steps+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();part(g,umbrellaMat);
    const a=j*TAU/8;pipe([[ux,uy,uz],[ux+Math.cos(a)*ur*.5,uy-.085,uz+Math.sin(a)*ur*.5],[ux+Math.cos(a)*ur,uy-.34,uz+Math.sin(a)*ur]],.008,M.silver);
  }
  pipe([[ux,uy+.05,uz],[ux,.57,uz],[ux+.04,.48,uz],[ux+.14,.51,uz],[ux+.14,.62,uz]],.017,M.wood);
  ball(ux,uy+.032,uz,.035,M.dark);

  // Plinth inscription belongs to the miniature, never a screen-space overlay.
  decal(-.1,-.40,7.135,3.5,.22,textLabel('雨宿り   /   AFTER THE LAST TRAIN','','#152737','#849c9e',3.5,.22));

  // Consolidate static objects and architectural ink edges into a modest number of draws.
  for(const [mat,geometries] of batches) {
    const merged=T.mergeGeometries(geometries,false);
    const mesh=new T.Mesh(merged,mat);mesh.castShadow=!mat.transparent;mesh.receiveShadow=!mat.transparent;
    mesh.name='procedural / '+(Object.keys(M).find(k=>M[k]===mat)||'material');
    scene.add(mesh);for(const g of geometries)g.dispose();
  }
  const inkMesh=new T.LineSegments(T.mergeGeometries(lineParts,false),ink);inkMesh.name='architectural ink';scene.add(inkMesh);
  for(const g of lineParts)g.dispose();

  // Actual planar WebGL reflection. The asphalt shader breaks it into rippled wet patches.
  const wet = new T.Reflector(new T.PlaneGeometry(14.0,14.0),{textureWidth:1024,textureHeight:1024,clipBias:.006,color:0x293b51,multisample:0});
  wet.rotation.x=-Math.PI/2;wet.position.y=.095;wet.name='wet road / real mirrored scene';
  wet.material.uniforms.uTime={value:0};
  wet.material.vertexShader=`uniform mat4 textureMatrix; varying vec4 vRef; varying vec3 vWorld;
    void main(){ vRef=textureMatrix*vec4(position,1.0);vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
  wet.material.fragmentShader=`uniform sampler2D tDiffuse; uniform float uTime; varying vec4 vRef; varying vec3 vWorld;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){
      vec2 p=vWorld.xz;
      float n=noise(p*1.25)*.65+noise(p*3.3)*.25+noise(p*.41)*.25;
      float puddle=smoothstep(.38,.75,n);
      vec2 uv=vRef.xy/vRef.w;
      uv+=vec2(sin(p.y*28.+uTime*2.3)+sin(p.x*16.-uTime*1.5),sin(p.x*22.+uTime*1.4))*.0004;
      vec3 r=texture2D(tDiffuse,uv).rgb*.4;
      r+=texture2D(tDiffuse,uv+vec2(.0016,.0012)).rgb*.15;
      r+=texture2D(tDiffuse,uv-vec2(.0016,.0012)).rgb*.15;
      r+=texture2D(tDiffuse,uv+vec2(.0036,-.0008)).rgb*.15;
      r+=texture2D(tDiffuse,uv-vec2(.0036,-.0008)).rgb*.15;
      vec3 asphalt=vec3(.012,.026,.047)+(hash(p*360.)-.5)*.004;
      vec3 col=mix(asphalt,r*vec3(.76,.88,1.0),.13+.58*puddle);
      col+=vec3(.008,.014,.023)*noise(p*4.);
      gl_FragColor=vec4(col,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  wet.material.needsUpdate=true;scene.add(wet);

  // Lighting: cool moon contours, warm fluorescent shop interior, lit shopfront.
  scene.add(new T.HemisphereLight(0x92b7dc,0x263448,1.05));
  const moon=new T.DirectionalLight(0x8eafe0,1.45);moon.position.set(-7,12,6);scene.add(moon);
  moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);moon.shadow.camera.left=-11;moon.shadow.camera.right=11;moon.shadow.camera.top=11;moon.shadow.camera.bottom=-11;moon.shadow.camera.near=1;moon.shadow.camera.far=35;moon.shadow.normalBias=.045;moon.shadow.bias=-.00015;
  const rim=new T.DirectionalLight(0x5c84c5,1.15);rim.position.set(6,7,-9);scene.add(rim);
  const shopLights=[];
  for(let x of [-3.7,-.1,1.8]) {
    const l=new T.PointLight(0xffbd74,11,6.5,1.7);l.position.set(x,2.85,-2.85);scene.add(l);shopLights.push(l);
  }
  const spill=new T.PointLight(0xffc075,8,7,1.8);spill.position.set(-1.35,2.8,.35);scene.add(spill);
  const vendingLight=new T.PointLight(0x9edfd8,2.8,3.6,1.7);vendingLight.position.set(-5.85,1.9,.65);scene.add(vendingLight);
  for(let x of [-3.95,1.45]) {
    const s=new T.SpotLight(0xffd391,24,7,Math.PI*.34,.72,1.7);s.position.set(x,3.66,-.13);s.target.position.set(x,.25,1.05);scene.add(s,s.target);
  }
  // A distant dark studio floor receives the plinth's shadow and fades into the night.
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0x090f20,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.875;floor.receiveShadow=true;scene.add(floor);

  // GPU rain: each independent streak falls until it hits the roof, sidewalk or road.
  const count=1450;
  const rp=new Float32Array(count*6), rd=new Float32Array(count*2*4);
  for(let i=0;i<count;i++) {
    const x=range(-7,7),z=range(-7,7),phase=rand(),speed=range(5.8,9.0),len=range(.12,.29);
    const ground=(x>-5.48&&x<3.12&&z>-5.96&&z<.04)?4.15:(x<4.45&&z<1.14?.40:.12);
    for(let j=0;j<2;j++){rp[i*6+j*3]=x;rp[i*6+j*3+1]=j;rp[i*6+j*3+2]=z;rd.set([phase,speed,len,ground],i*8+j*4);}
  }
  const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(rp,3));rainGeo.setAttribute('drop',new T.BufferAttribute(rd,4));
  const rainMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0}},vertexShader:`
    attribute vec4 drop; uniform float uTime; varying float vAlpha; varying vec3 vTint;
    void main(){float span=9.-drop.w;float y=mod(drop.x*span-uTime*drop.y,span)+drop.w;vec3 p=vec3(position.x+position.y*.055,y+position.y*drop.z,position.z+position.y*.014);float warm=exp(-length(vec2(p.x+1.1,p.z-.2))*.45)*step(p.y,3.6);vTint=mix(vec3(.32,.54,.73),vec3(.95,.72,.43),warm);vAlpha=.11+drop.x*.14;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`varying float vAlpha;varying vec3 vTint;void main(){gl_FragColor=vec4(vTint,vAlpha);#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
  const rain=new T.LineSegments(rainGeo,rainMat);rain.frustumCulled=false;rain.name='1450 independent rain streaks';scene.add(rain);
  // The eaves overflow in short, intermittent streams, distinct from ambient rain.
  const dripN=68,dp=new Float32Array(dripN*6),dd=new Float32Array(dripN*2*4);
  for(let i=0;i<dripN;i++) {
    const phase=rand(),speed=range(2.8,4.4),len=range(.035,.095);
    for(let j=0;j<2;j++) {dp.set([-5.35+(i/(dripN-1))*8.4,j,.045],i*6+j*3);dd.set([phase,speed,len,.39],i*8+j*4);}
  }
  const dripGeo=new T.BufferGeometry();dripGeo.setAttribute('position',new T.BufferAttribute(dp,3));dripGeo.setAttribute('drop',new T.BufferAttribute(dd,4));
  const dripMat=rainMat.clone();dripMat.vertexShader=rainMat.vertexShader.replace('9.-drop.w','3.83-drop.w').replace('vAlpha=.11+drop.x*.14','vAlpha=.26+drop.x*.15');
  const drips=new T.LineSegments(dripGeo,dripMat);drips.frustumCulled=false;drips.name='gutter drips';scene.add(drips);

  // Expanding, fading rings on the puddles. Each ring has its own age and position.
  const rippleN=100,ringGeo=new T.RingGeometry(.93,1,40);
  const phases=new Float32Array(rippleN),colors=new Float32Array(rippleN*3);
  const rippleMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uTime:{value:0}},vertexShader:`
    attribute float aPhase;attribute vec3 aTint;uniform float uTime;varying float vAge;varying vec3 vTint;
    void main(){vAge=fract(uTime*.53+aPhase);vTint=aTint;vec3 p=position*(.025+vAge*.40);gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.);}`,
    fragmentShader:`varying float vAge;varying vec3 vTint;void main(){gl_FragColor=vec4(vTint,pow(1.-vAge,2.)*.30);\n#include <colorspace_fragment>}`});
  const rippleMesh=new T.InstancedMesh(ringGeo,rippleMat,rippleN);rippleMesh.frustumCulled=false;rippleMesh.name='raindrop ripple rings';
  for(let i=0;i<rippleN;i++) {
    let x,z,y;
    if(i<22){x=range(-5.25,2.8);z=range(.12,.45);y=.402;}
    else {do{x=range(-6.9,6.9);z=range(-6.9,6.9);}while(x<4.6&&z<1.3);y=.126;}
    scratch.position.set(x,y,z);scratch.rotation.set(-Math.PI/2,0,0);scratch.scale.set(1,1,1);scratch.updateMatrix();rippleMesh.setMatrixAt(i,scratch.matrix);
    phases[i]=rand();const col=new T.Color((x<2.8&&z<3)?0xc6a773:0x5283aa);col.toArray(colors,i*3);
  }
  ringGeo.setAttribute('aPhase',new T.InstancedBufferAttribute(phases,1));ringGeo.setAttribute('aTint',new T.InstancedBufferAttribute(colors,3));scene.add(rippleMesh);

  // Small curls of steam rise above the oden warmer, also built from shader points.
  const steamPos=new Float32Array(30*3),steamA=new Float32Array(30);
  for(let i=0;i<30;i++){steamPos.set([range(-.22,.22),rand(),range(-.13,.13)],i*3);steamA[i]=rand();}
  const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(steamPos,3));sg.setAttribute('phase',new T.BufferAttribute(steamA,1));
  const sm=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0}},vertexShader:`attribute float phase;uniform float uTime;varying float age;void main(){age=fract(position.y+uTime*.13+phase);vec3 p=vec3(-2.78+position.x+sin(age*8.+phase*6.)*.06,1.82+age*.62,-1.60+position.z);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(9.+age*15.)*(${Math.min(devicePixelRatio,1.7).toFixed(2)})/max(1.,-mv.z*.15);}`,
    fragmentShader:`varying float age;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(.95,.87,.68,(1.-d)*(1.-age)*.08);}`});
  const steam=new T.Points(sg,sm);steam.frustumCulled=false;scene.add(steam);

  const clock=new T.Clock();let frames=0,elapsed=0,frozen=false,manualTime=0;
  const ease=v=>v*v*(3-2*v);
  function update(t) {
    rainMat.uniforms.uTime.value=t;dripMat.uniforms.uTime.value=t;wet.material.uniforms.uTime.value=t;
    rippleMat.uniforms.uTime.value=t;sm.uniforms.uTime.value=t;
    const c=t%15;let open=0;
    if(c>4&&c<5.8)open=ease((c-4)/1.8);else if(c>=5.8&&c<=9)open=1;else if(c>9&&c<10.8)open=1-ease((c-9)/1.8);
    for(let {g,side} of doors)g.position.x=side*(.585+open*.91);
    const flicker=.985+.012*Math.sin(t*8)+.006*Math.sin(t*23);
    signMat.color.setScalar(flicker);spill.intensity=8*flicker;
    vendingLight.intensity=2.8*(.99+.01*Math.sin(t*5.7));
    return open;
  }
  function render(){requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.05);if(!frozen)elapsed+=dt;update(frozen?manualTime:elapsed);controls.update();renderer.info.reset();composer.render();if(frames===0)renderer.shadowMap.autoUpdate=false;frames++;}
  render();
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=viewFov(camera.aspect);camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
  addEventListener('contextmenu',e=>e.preventDefault());
  // Introspection for local QA, with no visible controls or on-screen interface.
  window.__rainyCorner={scene,camera,controls,renderer,composer,doors,wet,rain,drips,rippleMesh,
    get stats(){return {three:T.REVISION,frames,elapsed,primitives:primitiveCount,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,doorOpen:update(frozen?manualTime:elapsed),viewport:[innerWidth,innerHeight],pixelRatio:renderer.getPixelRatio()};},
    freeze(t=elapsed){frozen=true;manualTime=t;update(t);},resume(){elapsed=manualTime;frozen=false;},
    resetView(){camera.position.set(15.9,12.0,18.9);controls.target.set(0,1.1,-.35);controls.update();}
  };
})();
