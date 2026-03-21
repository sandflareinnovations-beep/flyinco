const fs = require('fs');
const path = require('path');

const iconMap = {
    ArrowLeft: 'PiArrowLeftLight',
    ArrowRight: 'PiArrowRightLight',
    Calendar: 'PiCalendarBlankLight',
    Lock: 'PiLockKeyLight',
    AlertTriangle: 'PiWarningLight',
    Minus: 'PiMinusLight',
    Plus: 'PiPlusLight',
    Luggage: 'PiSuitcaseRollingLight',
    Clock: 'PiClockLight',
    User: 'PiUserLight',
    Loader2: 'PiSpinnerLight',
    Phone: 'PiPhoneLight',
    Mail: 'PiEnvelopeSimpleLight',
    CreditCard: 'PiCreditCardLight',
    Check: 'PiCheckLight',
    ChevronDown: 'PiCaretDownLight',
    ChevronUp: 'PiCaretUpLight',
    ChevronRight: 'PiCaretRightLight',
    ChevronLeft: 'PiCaretLeftLight',
    Circle: 'PiCircleLight',
    CheckCircle: 'PiCheckCircleLight',
    Plane: 'PiAirplaneTiltLight',
    Home: 'PiHouseLight',
    ClipboardList: 'PiClipboardTextLight',
    Copy: 'PiCopyLight',
    Briefcase: 'PiBriefcaseLight',
    Eye: 'PiEyeLight',
    EyeOff: 'PiEyeClosedLight',
    ShieldCheck: 'PiShieldCheckLight',
    LogOut: 'PiSignOutLight',
    Map: 'PiMapTrifoldLight',
    Settings: 'PiGearLight',
    FileText: 'PiFileTextLight',
    MapPin: 'PiMapPinLight',
    AlertCircle: 'PiWarningCircleLight',
    Moon: 'PiMoonLight',
    Sun: 'PiSunLight',
    PanelLeft: 'PiSidebarLight',
    Users: 'PiUsersLight',
    DollarSign: 'PiCurrencyDollarLight',
    Activity: 'PiActivityLight',
    TrendingUp: 'PiTrendUpLight',
    PlaneTakeoff: 'PiAirplaneTakeoffLight',
    Trash2: 'PiTrashLight',
    Megaphone: 'PiMegaphoneLight',
    Printer: 'PiPrinterLight',
    Download: 'PiDownloadSimpleLight',
    X: 'PiXLight',
    Upload: 'PiUploadSimpleLight',
    Building: 'PiBuildingsLight',
    Receipt: 'PiReceiptLight',
    Image: 'PiImageLight',
    ImageIcon: 'PiImageLight',
    KeyRound: 'PiKeyLight',
    Search: 'PiMagnifyingGlassLight',
    Sparkles: 'PiSparkleLight',
    LayoutDashboard: 'PiSquaresFourLight',
    BookOpen: 'PiBookOpenLight'
};

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
    const originalContent = content;

    const importRegex = /import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/g;
    let match;
    let iconsToReplace = [];
    
    while ((match = importRegex.exec(content)) !== null) {
        if (match[1]) {
            const imported = match[1].split(',').map(s => {
                let parts = s.trim().split(' as ');
                return { original: parts[0], alias: parts[1] || parts[0] };
            }).filter(s => s.original);
            iconsToReplace = iconsToReplace.concat(imported);
        }
    }

    if (iconsToReplace.length > 0) {
        let replacementImports = [];
        
        // Remove the lucide-react imports using a fresh regex instance without /g state
        content = content.replace(/import\s+\{[^}]+\}\s+from\s+["']lucide-react["'];?/g, '');

        for (const iconObj of iconsToReplace) {
            const original = iconObj.original;
            const alias = iconObj.alias;
            
            if (original === 'LucideIcon' || original === 'LucideProps' || original === 'createLucideIcon') continue;
            
            const newIcon = iconMap[original] || 'PiStarLight';
            replacementImports.push(newIcon);
            
            const varRegex = new RegExp("\\b" + alias + "\\b", "g");
            content = content.replace(varRegex, newIcon);
        }

        if (replacementImports.length > 0) {
            replacementImports = [...new Set(replacementImports)];
            const newImportStatement = 'import { ' + replacementImports.join(', ') + ' } from "react-icons/pi";\\n';
            content = newImportStatement + content;
        }

        // Clean up strokeWidth={1.25} which lucide needed but phosphor doesn't need
        content = content.replace(/ strokeWidth=\{1\.25\}/g, '');
        content = content.replace(/strokeWidth=\{1\.25\} /g, '');

        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            count++;
            console.log("Migrated to Phosphor in: " + file);
        }
    }
}
console.log("Successfully updated", count, "files to Phosphor UI Icons");
