const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'site', 'assets', 'templates');
const OUT = path.join(ROOT, 'site', 'data', 'templates.json');

const templates = [];
const sandbox = {
  window: {
    __JERRY_REGISTER_TEMPLATE: (template) => templates.push(template)
  }
};
vm.createContext(sandbox);

for (const file of fs.readdirSync(TEMPLATE_DIR).filter(name => name.endsWith('.js')).sort()) {
  const source = fs.readFileSync(path.join(TEMPLATE_DIR, file), 'utf8');
  vm.runInContext(source, sandbox, { filename: file });
}

const manifest = {
  format: 'jerry-templates/v1',
  generatedAt: new Date().toISOString(),
  templates: templates.map((t) => ({
    id: t.id,
    name: t.name,
    cat: t.cat,
    mat: t.mat,
    tags: Array.isArray(t.tags) ? t.tags : [],
    spell: t.spell || '',
    core: t.core || '',
    knobs: (t.knobs || []).map((k) => ({
      key: k.k,
      label: k.label || k.k,
      default: k.v,
      min: k.min,
      max: k.max,
      step: k.step
    })),
    credit: t.credit || null,
    source: '/assets/templates/' + t.id + '.js'
  }))
};

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('Generated ' + manifest.templates.length + ' templates -> ' + path.relative(ROOT, OUT));
