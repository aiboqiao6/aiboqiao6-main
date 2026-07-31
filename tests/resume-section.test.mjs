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
