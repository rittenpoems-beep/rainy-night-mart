# Route B · 离线打包 + 合并几何

入口：[`outputs/index.html`](outputs/index.html)。完全离线，双击即可运行，不需要服务器或网络。

![Route B 全景](outputs/preview.png)

## 技术路线

- **运行时**：Three.js r0.170.0 + OrbitControls、RoundedBoxGeometry、mergeGeometries、Reflector、EffectComposer、RenderPass、UnrealBloomPass、OutputPass。
- **交付方式**：`esbuild` 把 Three.js 与官方 addons 打成 IIFE，内嵌进 HTML 的第一段 `<script>`；`scene.js` 作为带注释的第二段 `<script>` 原样注入；Three.js 的 MIT 许可文本附在文件末尾。运行时零外部请求。
- **渲染器**：`ACESFilmicToneMapping`（曝光 1.05）、sRGB 输出、`PCFSoftShadowMap`、`FogExp2`，DPR 上限 1.7。
- **后期**：`EffectComposer` + `RenderPass` + `UnrealBloomPass`（强度 0.32、半径 0.48、阈值 1.1）+ `OutputPass`。
- **三渲二**：4 级 `DataTexture` 渐变（100/148/200/242）+ `MeshToonMaterial`。建筑描边用 `EdgesGeometry`（28° 阈值）生成，所有线段合并成一个 `LineSegments`，用统一的深墨色 `LineBasicMaterial` 绘制。
- **静态几何合并**：每个零件先变换到世界坐标，再按材质合并；最终静态物体只占少量 draw call。场景记录为 2,101 个图元、247,038 个三角形、255 次 draw call、93 个几何体、36 张纹理。
- **湿地反射**：`Reflector` 1024×1024，位于 `y = 0.095`；自定义片元着色器用 fbm 噪声生成水洼遮罩与湿润变化，对反射 UV 施加时间扰动和 5 抽样模糊，再与深色沥青按 0.13–0.71 的比例混合。
- **雨**：1,450 条 GPU `LineSegments`，每条雨线按自身碰撞高度决定落点（屋顶、人行道或路面）；另有 68 条屋檐滴水、100 个实例化涟漪环、30 个关东煮蒸汽点精灵。
- **自动门**：15 秒周期；`4.0–5.8s` 打开，`5.8–9.0s` 保持，`9.0–10.8s` 关闭；门扇在关闭位 `±0.585` 与开启位 `±1.495` 之间移动。
- **构图**：以 39° 为基准，按 `max(1, (4/3) / aspect)` 反算垂直 FOV；相机 `(15.9, 12.0, 18.9)`，目标 `(0, 1.1, -0.35)`；OrbitControls 带阻尼，距离限制 7–40。
- **室内**：货架、收银台、关东煮柜、热食柜、饮料冷柜均为真实三维陈设，位于玻璃之后。

## 工程结构

```text
codex-threejs/
├─ outputs/
│  ├─ index.html          # 完全离线的成品
│  ├─ preview.png         # 浏览器实拍
│  ├─ 使用说明.md
│  └─ 验证记录.json
└─ work/
   ├─ scene.js            # 可编辑场景源码
   ├─ library.js          # Three.js/addons 入口
   ├─ build.mjs           # esbuild 构建脚本
   ├─ verify.cjs          # 离线、门体、交互、构图断言
   ├─ inspect.cjs         # 本地检查脚本
   ├─ verification.json   # 本机验证结果
   ├─ package.json
   └─ package-lock.json
```

## 源码索引

| 模块 | 位置 |
| --- | --- |
| 渲染器、相机、后期 | [`work/scene.js#L1`](work/scene.js#L1) |
| 4 级卡通渐变与材质表 | [`work/scene.js#L51`](work/scene.js#L51) |
| 静态几何按材质合并 | [`work/scene.js#L85`](work/scene.js#L85) |
| 货架与商品 | [`work/scene.js#L200`](work/scene.js#L200) |
| 收银台 | [`work/scene.js#L246`](work/scene.js#L246) |
| 关东煮柜 | [`work/scene.js#L258`](work/scene.js#L258) |
| 自动门装配 | [`work/scene.js#L324`](work/scene.js#L324) |
| 自动贩卖机 | [`work/scene.js#L363`](work/scene.js#L363) |
| 雨伞架 | [`work/scene.js#L386`](work/scene.js#L386) |
| 电线杆与电缆 | [`work/scene.js#L506`](work/scene.js#L506) |
| 湿地反射着色器 | [`work/scene.js#L574`](work/scene.js#L574) |
| GPU 雨 | [`work/scene.js#L619`](work/scene.js#L619) |
| 涟漪与蒸汽 | [`work/scene.js#L646`](work/scene.js#L646) |
| 门、招牌、贩卖机动画 | [`work/scene.js#L671`](work/scene.js#L671) |
| 场景内省接口 | [`work/scene.js#L686`](work/scene.js#L686) |

## 运行与构建

直接双击 `outputs/index.html`。

从源码重建：

```bash
cd codex-threejs/work
npm install
node build.mjs
```

`build.mjs` 会把 Three.js、addons 与 `scene.js` 重新内嵌到 `outputs/index.html`。

## 验证

`work/verification.json` 记录了一次本机验证：

- `offline: true`，`externalRequests: []`，`errors: []`。
- 门体：`t=2` 关闭于 `±0.585`，`t=7` 开启于 `±1.495`，`t=12` 关闭，`t=22` 再次开启。
- 初始底座四角 NDC 坐标均在 `[-1, 1]` 内。
- 旋转、缩放、平移均通过断言；竖屏 720×960 自适应通过。
- 1440×1080、Intel UHD 样本：2,101 图元、247,038 三角形、255 draw calls、93 几何体、36 纹理、36.9 fps。

### 复跑 QA 脚本（可选）

`verify.cjs` 与 `inspect.cjs` 需要 Playwright 与 Edge；场景本身不依赖它们。脚本已改为通用 `require('playwright')`，可用 `EDGE_PATH` 指定浏览器路径：

```bash
cd codex-threejs/work
npm install --no-save playwright
node verify.cjs
```

`inspect.cjs` 需要一个运行在 `http://127.0.0.1:8765/` 的静态服务器。

## 约束

- 不使用 Blender、预制模型或外部图片/模型/字体。
- 所有几何、材质、灯光与动画都在 `scene.js` 中生成；CanvasTexture 仅用于文字、招牌、海报与地面图案。
- Three.js r170 与官方 addons 依 MIT License，许可文本附在成品 HTML 末尾。
