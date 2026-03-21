const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
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
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    // If it has "use client" anywhere
    if (content.includes('"use client"') || content.includes("'use client'")) {
        // Remove ALL instances of "use client" or 'use client'
        content = content.replace(/["']use client["'];?\s*/g, '');
        // Add it to the absolute top
        content = '"use client";\n' + content;
        fs.writeFileSync(file, content);
        console.log("Fixed use client in", file);
    }
}
