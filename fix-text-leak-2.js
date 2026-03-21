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
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Fix PiPulse text replacing
    content = content.replace(/Agent PiPulse/g, 'Agent Activity');
    
    // Fix PiUsers text replacing
    content = content.replace(/"PiUsers"/g, '"Users"');
    content = content.replace(/>PiUsers</g, '>Users<');
    content = content.replace(/Total PiUsers/g, 'Total Users');
    content = content.replace(/Fetching PiUsers.../g, 'Fetching Users...');

    if (original !== content) {
        fs.writeFileSync(file, content);
        count++;
    }
}

console.log("Fixed text leakage again in", count, "files");
