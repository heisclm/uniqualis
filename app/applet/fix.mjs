import fs from 'fs';
let content = fs.readFileSync('components/Settings.tsx', 'utf8');

content = content.replace(/focus:ring-blue-500\/20 focus:border-blue-500/g, '${t.focus}');
content = content.replace(/peer-checked:bg-blue-600/g, '${t.peerChecked}');
content = content.replace(/bg-blue-600 text-white hover:bg-blue-700/g, '${t.bg} text-white ${t.bgHover}');
content = content.replace(/peer-checked:border-blue-600/g, '${t.border}');
content = content.replace(/bg-blue-600/g, '${t.bg}');

fs.writeFileSync('components/Settings.tsx', content);
