import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const rootUrl = new URL('../', import.meta.url);
const [html, css, script] = await Promise.all([
  readFile(new URL('index.html', rootUrl), 'utf8'),
  readFile(new URL('styles.css', rootUrl), 'utf8'),
  readFile(new URL('script.js', rootUrl), 'utf8')
]);

test('exposes the introduction from the primary navigation', () => {
  assert.match(html, /class="top-nav-link" href="#about">简介<\/a>/);
  assert.match(html, /class="intro-panel" id="about" aria-labelledby="introTitle"/);
  assert.match(script, /'#home, #about, #github, #projects, #contact'/);
});

test('presents a single concise professional introduction', () => {
  assert.match(html, /id="introTitle">个人简介<\/h2>/);
  assert.match(html, /class="intro-copy"/);
  assert.match(html, /桌面应用开发工程师/);
  assert.match(html, /C\+\+20/);
  assert.match(html, /Qt 6 Quick/);
  assert.match(html, /ARM \/ x64/);
  assert.doesNotMatch(html, /class="resume-(?:grid|block|skills|work)/);
  assert.doesNotMatch(html, /代表产出|INDEPENDENT DEVELOPER/);
});

test('styles the introduction as a readable text block', () => {
  assert.match(css, /\.intro-panel\s*\{/);
  assert.match(css, /\.intro-copy\s*\{/);
  assert.doesNotMatch(css, /\.resume-grid\s*\{/);
});

test('uses the redesigned editorial layout at desktop and mobile breakpoints', () => {
  assert.match(css, /\.personal-layout\s*\{[\s\S]*grid-template-columns: minmax\(0, 0\.92fr\) minmax\(0, 1\.08fr\)/);
  assert.match(css, /\.identity-stage\s*\{[\s\S]*min-height: min\(calc\(100vh - 132px\), 760px\)/);
  assert.match(css, /\.top-nav\s*\{[\s\S]*width: min\(560px/);
  assert.match(css, /@media \(max-width: 860px\)[\s\S]*\.personal-layout\s*\{\s*display: block;/);
});
