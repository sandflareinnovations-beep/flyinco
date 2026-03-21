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

// These icon names leaked into visible text strings. Map: wrong text -> correct label
const textFixes = {
    // Admin page leaks
    'Agent PiPulse': 'Agent Activity',
    'PiPulse Monitoring': 'Activity Monitoring',
    '"PiUsers"': '"Users"',
    'label: "PiUsers"': 'label: "Users"',
    'Total PiUsers': 'Total Users',
    'Fetching PiUsers...': 'Fetching Users...',
    '"PiUser Updated"': '"User Updated"',
    '"PiUser Added"': '"User Added"',
    '"PiUser Deleted"': '"User Deleted"',
    'PiUser Management': 'User Management',
    'Add PiUser': 'Add User',
    'PiUser Management': 'User Management',
    '>PiUser<': '>User<',
    'Customer / PiUser': 'Customer / User',
    '"Adding..."': '"Adding..."',
    'Edit PiUser Profile': 'Edit User Profile',
    'Delete PiUser': 'Delete User',
    '"Deleting..."': '"Deleting..."',
    '>PiUsers<': '>Users<',
    '"PiUsers Management"': '"Users Management"',
    // Layout nav
    'label: "PiUsers"': 'label: "Users"',
    '">PiUser<"': '">User<"',
};

const files = walk(path.join(__dirname, 'frontend/src'));
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Match Pi icon names that appear in text strings & JSX text nodes (not as component names or imports)
    // Strategy: find patterns like ">PiXxx<" or text like `"PiXxx"` or template strings like `PiXxx foo`
    
    // Fix direct text content patterns: >PiWord< means it appears as rendered text
    content = content.replace(/>Pi([A-Z][a-zA-Z]+)</g, (match, iconSuffix) => {
        // These are valid JSX TEXT nodes showing icon names - shouldn't happen
        // But some also look like self-closing tags... skip those
        return '>' + iconSuffix + '<';
    });

    // Fix string literals: "PiSomething" that appear to be labels/text, not code
    // Specifically target known leaked patterns
    content = content.replace(/"PiUsers Updated"/g, '"User Updated"');
    content = content.replace(/"PiUsers Added"/g, '"User Added"');
    content = content.replace(/"PiUsers Deleted"/g, '"User Deleted"');
    content = content.replace(/"PiUser Updated"/g, '"User Updated"');
    content = content.replace(/"PiUser Added"/g, '"User Added"');
    content = content.replace(/"PiUser Deleted"/g, '"User Deleted"');
    content = content.replace(/PiUser Management/g, 'User Management');
    content = content.replace(/Add PiUser\b/g, 'Add User');
    content = content.replace(/Edit PiUser Profile/g, 'Edit User Profile');
    content = content.replace(/Delete PiUser\b/g, 'Delete User');
    content = content.replace(/Total PiUsers/g, 'Total Users');
    content = content.replace(/Fetching PiUsers/g, 'Fetching Users');
    content = content.replace(/Agent PiPulse/g, 'Agent Activity');
    content = content.replace(/"PiUsers"\s*:/, '"Users":');
    content = content.replace(/label: "PiUsers"/g, 'label: "Users"');
    content = content.replace(/Customer \/ PiUser\b/g, 'Customer / User');
    content = content.replace(/label: "PiUser"/g, 'label: "User"');
    
    // Fix any remaining >PiXxx< text nodes (avoid matching JSX tags <PiXxx> or </PiXxx>)
    // A TEXT node would look like: >PiWord text< where PiWord is followed by a space or <
    content = content.replace(/>Pi(Pulse|Users|User|Calendar|AirplaneTilt|Shield|Square|SignOut|BookOpen|Megaphone|Briefcase|Star|Check|Arrow|Caret|Spinner|WarnThreshold|Warning|Trend)(\s|<)/g, (match, word, after) => {
        const readable = {
            Pulse: 'Activity', Users: 'Users', User: 'User', Calendar: 'Calendar',
            AirplaneTilt: 'Flights', Shield: 'Security', Square: 'Dashboard',
            SignOut: 'Sign Out', BookOpen: 'Bookings', Megaphone: 'Announcements',
            Briefcase: 'Baggage', Star: 'Rating', Check: 'Verified', Arrow: '→',
            Caret: '›', Spinner: 'Loading', Warning: 'Warning', Trend: 'Trend'
        };
        return '>' + (readable[word] || word) + after;
    });

    if (original !== content) {
        fs.writeFileSync(file, content);
        count++;
        console.log('Fixed:', file);
    }
}

console.log('\nFixed text leakage in', count, 'files');
