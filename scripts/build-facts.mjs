import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import matter from 'gray-matter';

const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));

function readEntries(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, content } = matter(readFileSync(`${dir}/${f}`, 'utf8'));
      return { ...data, summary: content.trim().slice(0, 600) };
    });
}

const { chatEndpoint, ...identity } = site;
const facts = {
  ...identity,
  siteUrl: 'https://swapnillader.github.io/resume/',
  projects: readEntries('src/content/projects'),
  writing: readEntries('src/content/writing'),
};

mkdirSync('worker', { recursive: true });
writeFileSync('worker/facts.json', JSON.stringify(facts, null, 2));
console.log('Wrote worker/facts.json');
