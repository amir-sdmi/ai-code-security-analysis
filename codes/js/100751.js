// newTask.js
// Usage: node scripts/newTask.js <short-description> [--priority=medium] [--assignee=copilot] [--related=artifact1,script2]
// Onboarding: Creates a new task artifact with standardized metadata for AI/human workflow.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTIFACTS_DIR = path.join(__dirname, '../artifacts');
const today = new Date().toISOString().slice(0, 10);

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function printHelp() {
  console.log(`\nUsage: node scripts/newTask.js <short-description> [--priority=medium] [--assignee=copilot] [--related=artifact1,script2] [--json] [--help]\n`);
  console.log('Onboarding: Creates a new task artifact with standardized metadata for AI/human workflow.');
  console.log('\nOptions:');
  console.log('  --json   Output result in machine-readable JSON format.');
  console.log('  --help   Show this help message.');
}

const args = process.argv.slice(2);
if (args.includes('--help')) {
  printHelp();
  process.exit(0);
}
const outputJson = args.includes('--json');
const filtered = args.filter(a => !a.startsWith('--'));
if (filtered.length < 1) {
  if (outputJson) {
    console.log(JSON.stringify({ error: 'Missing short-description', usage: 'node scripts/newTask.js <short-description> [--priority=medium] [--assignee=copilot] [--related=artifact1,script2] [--json] [--help]' }, null, 2));
  } else {
    printHelp();
  }
  process.exit(1);
}
const desc = filtered[0];
const priority = (args.find(a => a.startsWith('--priority=')) || '').split('=')[1] || 'medium';
const assignee = (args.find(a => a.startsWith('--assignee=')) || '').split('=')[1] || 'copilot';
const related = (args.find(a => a.startsWith('--related=')) || '').split('=')[1] || '';
const relatedArr = related ? related.split(',') : [];
const id = `task_${slugify(desc)}_${today.replace(/-/g, '')}`;
const filename = path.join(ARTIFACTS_DIR, `${id}.artifact`);

const header = `---\nartifact: ${id}\ncreated: ${today}\npurpose: ${desc}\ntype: task\ntags: [task, ${priority}, open, ${assignee}]\nstatus: open\npriority: ${priority}\nassignee: ${assignee}\nrelated: [${relatedArr.map(r => `'${r}'`).join(', ')}]\nhistory:\n  - { date: ${today}, action: created, by: copilot, notes: initial creation }\nformat: markdown\n---\n`;
const body = `\n# Task: ${desc}\n\n## Details\n- ...\n\n## Subtasks\n- [ ] ...\n\n## Comments/History\n- Created by Copilot on ${today}.\n`;

fs.writeFileSync(filename, header + body);
if (outputJson) {
  console.log(JSON.stringify({ created: filename, id, desc, priority, assignee, related: relatedArr, usage: 'node scripts/newTask.js <short-description> [--priority=medium] [--assignee=copilot] [--related=artifact1,script2] [--json] [--help]' }, null, 2));
} else {
  console.log(`Created ${filename}`);
}
