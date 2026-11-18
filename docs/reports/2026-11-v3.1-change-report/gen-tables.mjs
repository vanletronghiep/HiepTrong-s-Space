// Generates the file tables for report.tex from the git working tree (run from repo root).
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const dir = 'docs/reports/2026-11-v3.1-change-report';
const sh = (c) => execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const tex = (s) => s.replace(/([_&#%$])/g, '\\$1').replace(/\//g, '/\\allowbreak{}');

const modified = sh('git diff --numstat')
  .trim()
  .split('\n')
  .map((l) => l.split('\t'))
  .sort((a, b) => (a[2] < b[2] ? -1 : 1));
const untracked = sh('git ls-files --others --exclude-standard')
  .trim()
  .split('\n')
  .filter((f) => f && !['desc.md', 'exp.md'].includes(f) && !f.startsWith('docs/reports/2026-11-v3.1-change-report/'));

let a = '\\begin{longtable}{p{0.72\\textwidth}rr}\n\\toprule File & Added & Removed \\\\\n\\midrule\\endhead\n';
for (const [add, del, f] of modified) a += `\\texttt{${tex(f)}} & ${add} & ${del} \\\\\n`;
a += '\\bottomrule\n\\end{longtable}\n';
writeFileSync(`${dir}/files-modified.tex`, a);

let b = '\\begin{longtable}{p{0.95\\textwidth}}\n\\toprule New file \\\\\n\\midrule\\endhead\n';
for (const f of untracked) b += `\\texttt{${tex(f)}} \\\\\n`;
b += '\\bottomrule\n\\end{longtable}\n';
writeFileSync(`${dir}/files-new.tex`, b);
console.log(modified.length, 'modified,', untracked.length, 'new');
