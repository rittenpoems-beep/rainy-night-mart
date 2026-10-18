import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const lib = await build({ entryPoints: [path.join(import.meta.dirname, 'library.js')], bundle: true, minify: true, format: 'iife', write: false, legalComments: 'inline', target: 'es2020' });
const scene = await readFile(path.join(import.meta.dirname, 'scene.js'), 'utf8');
const license = await readFile(path.join(import.meta.dirname, 'node_modules/three/LICENSE'), 'utf8');
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#080f21"><meta name="description" content="雨宿り。纯程序化 Three.js 雨夜便利店微缩场景。拖拽旋转，滚轮缩放，右键平移。"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231f665d'/%3E%3Cpath d='M10 32a22 22 0 0 1 44 0H10M32 30v19q-10 9-10-1' fill='%23ffe2a5' stroke='%23ffe2a5' stroke-width='4'/%3E%3C/svg%3E"><title>雨宿り · After the last train</title>
<style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#080f21}canvas{display:block;width:100%;height:100%;outline:none;touch-action:none}body{overscroll-behavior:none}</style></head>
<body><script>/* Three.js r170 and official addons, MIT License (c) Three.js authors. Bundled locally; no network, images or models are loaded. */\n${lib.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>
<script>\n${scene.replace(/<\/script/gi, '<\\/script')}\n</script><!--\n${license}\n--></body></html>`;
await mkdir(path.join(root, 'outputs'), { recursive: true });
await writeFile(path.join(root, 'outputs', 'index.html'), html);
console.log(`Built outputs/index.html (${(Buffer.byteLength(html)/1024).toFixed(0)} KiB), fully offline.`);
