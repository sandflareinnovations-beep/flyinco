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

    // Fix PiUserLight text replacing
    // We want to replace "PiUserLight" with "User", EXCEPT in two cases:
    // 1. In `import { ... PiUserLight ... }`
    // 2. In `<PiUserLight`
    // Easy way: replace globally, then put it back for the valid cases.
    
    content = content.replace(/PiUserLight/g, 'User');
    // Restore valid usages
    content = content.replace(/import \{([^}]+)\} from "react-icons\/pi";/g, (match) => {
        return match.replace(/\bUser\b/g, 'PiUserLight');
    });
    content = content.replace(/<User(\s|>)/g, '<PiUserLight$1');
    content = content.replace(/<\/User>/g, '</PiUserLight>');
    
    // Fix PiCalendarBlankLight text replacing
    content = content.replace(/PiCalendarBlankLight/g, 'Calendar');
    // Restore valid usages
    content = content.replace(/import \{([^}]+)\} from "react-icons\/pi";/g, (match) => {
        return match.replace(/\bCalendar\b/g, 'PiCalendarBlankLight');
    });
    content = content.replace(/<Calendar(\s|>)/g, '<PiCalendarBlankLight$1');
    content = content.replace(/<\/Calendar>/g, '</PiCalendarBlankLight>');
    
    // For good measure, what about Home?
    content = content.replace(/PiHouseLight/g, 'Home');
    content = content.replace(/import \{([^}]+)\} from "react-icons\/pi";/g, (match) => {
        return match.replace(/\bHome\b/g, 'PiHouseLight');
    });
    content = content.replace(/<Home(\s|>)/g, '<PiHouseLight$1');
    content = content.replace(/<\/Home>/g, '</PiHouseLight>');

    // What about Map?
    content = content.replace(/PiMapTrifoldLight/g, 'Map');
    content = content.replace(/import \{([^}]+)\} from "react-icons\/pi";/g, (match) => {
        return match.replace(/\bMap\b/g, 'PiMapTrifoldLight');
    });
    content = content.replace(/<Map(\s|>)/g, '<PiMapTrifoldLight$1');
    content = content.replace(/<\/Map>/g, '</PiMapTrifoldLight>');
    
    if (original !== content) {
        fs.writeFileSync(file, content);
        count++;
    }
}

console.log("Fixed text leakage in", count, "files");
