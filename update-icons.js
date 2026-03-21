const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        let filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'frontend/src'));
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    const importRegex = /import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/g;
    let match;
    let icons = [];
    while ((match = importRegex.exec(content)) !== null) {
        if (match[1]) {
            const imported = match[1].split(',').map(s => s.trim().split(' as ')[0]).filter(s => s);
            icons = icons.concat(imported);
        }
    }

    if (icons.length > 0) {
        let modified = false;
        icons = [...new Set(icons)];

        for (const icon of icons) {
            if (icon === 'LucideIcon' || icon === 'LucideProps' || icon === 'createLucideIcon') continue;
            
            const iconRegex = new RegExp("<(" + icon + ")(\\\\s|>)", "g");
            content = content.replace(iconRegex, (str, p1, p2) => {
                if (str.includes('strokeWidth')) return str;
                if (p2 === '>') return "<" + p1 + " strokeWidth={1.25}>";
                return "<" + p1 + " strokeWidth={1.25} ";
            });
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(file, content);
            count++;
        }
    }
}
console.log("Updated", count, "files with lucide icons to strokeWidth={1.25}");
