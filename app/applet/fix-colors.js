const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('components').filter(f => f.endsWith('.tsx'));
files.push('app/login/page.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/-blue-/g, '-emerald-');
  newContent = newContent.replace(/text-blue/g, 'text-emerald');
  newContent = newContent.replace(/bg-blue/g, 'bg-emerald');
  newContent = newContent.replace(/border-blue/g, 'border-emerald');
  newContent = newContent.replace(/ring-blue/g, 'ring-emerald');
  newContent = newContent.replace(/shadow-blue/g, 'shadow-emerald');
  newContent = newContent.replace(/from-blue/g, 'from-emerald');
  newContent = newContent.replace(/to-blue/g, 'to-emerald');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
});
