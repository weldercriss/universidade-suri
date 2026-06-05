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
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    if (file.endsWith('api.ts')) {
        if (content.includes('export const API_BASE_URL = "http://localhost:3000";')) {
            content = content.replace(
                'export const API_BASE_URL = "http://localhost:3000";',
                'export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";'
            );
            modified = true;
        }
    } else {
        if (content.includes('http://localhost:3000')) {
            content = content.replace(/http:\/\/localhost:3000/g, "${import.meta.env.VITE_API_URL || 'http://localhost:3000'}");
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed', file);
    }
}
