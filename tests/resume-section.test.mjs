import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const rootUrl = new URL('../', import.meta.url);
const [html, css, script] = await Promise.all([
  readFile(new URL('index.html', rootUrl), 'utf8'),
  readFile(new URL('styles.css', rootUrl), 'utf8'),
  readFile(new URL('script.js', rootUrl), 'utf8')
]);

test('exposes the resume from the primary navigation', () => {
  assert.match(html, /class="top-nav-link" href="#resume">简历<\/a>/);
  assert.match(html, /class="resume-panel" id="resume" aria-labelledby="resumeTitle"/);
  assert.match(script, /'#home, #resume, #github, #projects, #contact'/);
});

test('presents an evidence-based technical profile', () => {
  assert.match(html, /id="resumeTitle">个人简历<\/h2>/);
  assert.match(html, /Windows 系统与桌面体验开发者/);
  assert.match(html, /C\+\+20/);
  assert.match(html, /Qt 6 Quick/);
  assert.match(html, /macdowsOS Tool/);
  assert.match(html, /Windows ARM/);
  assert.doesNotMatch(html, /填写个人简介/);
});

test('includes responsive resume layout rules', () => {
  assert.match(css, /\.resume-panel\s*\{/);
  assert.match(css, /\.resume-grid\s*\{/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*\.resume-grid/);
});
