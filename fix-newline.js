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
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('react-icons/pi";\\n')) {
        content = content.replace(/react-icons\/pi";\\n/g, 'react-icons/pi";\n');
        fs.writeFileSync(file, content);
        console.log("Fixed newline in", file);
    }
}
