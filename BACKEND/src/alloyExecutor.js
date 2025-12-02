const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeAlloy(filePath) {
    return new Promise((resolve, reject) => {
        // Paths
        // Use process.cwd() which is /app in Docker or local root
        const cwd = process.cwd();
        // Normalize paths to use forward slashes to avoid Windows shell escaping issues
        const normalizePath = (p) => p.replace(/\\/g, '/');

        const jarPath = normalizePath(path.join(cwd, 'alloy/alloy4.2_2015-02-22.jar'));
        // Use semicolon for Windows classpath separator (Local Execution)
        const classpath = `.;${jarPath}`;
        const runnerPath = normalizePath(path.join(cwd, 'src/AlloyRunner.java'));
        const normalizedFilePath = normalizePath(filePath);
        const xmlPath = filePath.replace('.als', '.xml');

        console.log(`Execution Context: CWD=${cwd}, JAR=${jarPath}, Runner=${runnerPath}, File=${normalizedFilePath}`);

        // [Clean up] Delete existing XML file if it exists to prevent reading stale results
        if (fs.existsSync(xmlPath)) {
            try {
                fs.unlinkSync(xmlPath);
                console.log(`Existing XML file deleted: ${xmlPath}`);
            } catch (err) {
                console.error(`Failed to delete existing XML file: ${err.message}`);
            }
        }

        // 1. Compile
        const compileCmd = `javac -cp "${classpath}" "${runnerPath}"`;

        console.log(`Compiling: ${compileCmd}`);
        exec(compileCmd, { cwd: cwd }, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
                console.error(`Compilation error: ${compileError}`);
                return resolve({ success: false, error: compileStderr || compileError.message });
            }

            // 2. Execute
            // Added 'src' to classpath for java execution because AlloyRunner.class is in src/ folder
            // Use semicolon for Windows
            const runCmd = `java -cp "src;${classpath}" AlloyRunner "${normalizedFilePath}"`;

            console.log(`Executing: ${runCmd}`);
            exec(runCmd, { cwd: cwd }, (runError, runStdout, runStderr) => {
                if (runError) {
                    console.error(`Execution error: ${runError}`);
                    return resolve({ success: false, error: runStderr || runError.message });
                }

                console.log(`stdout: ${runStdout}`);

                // Parse XML
                const xmlPath = filePath.replace('.als', '.xml');
                if (fs.existsSync(xmlPath)) {
                    const xmlContent = fs.readFileSync(xmlPath, 'utf8');

                    const violations = parseAlloyXML(xmlContent);
                    resolve({ success: true, result: violations });
                } else {
                    resolve({ success: false, error: "XML output not found" });
                }
            });
        });
    });
}

function parseAlloyXML(xml) {
    const threats = {};
    let total_count = 0;

    // 1. Parse XML to build in-memory graph
    const atoms = {}; // ID -> Label
    const relations = {}; // RelationName -> Array of Tuples (Arrays of IDs)

    // Helper to clean label
    const cleanLabel = (l) => {
        if (!l) return '';
        return l.split('/').pop().split('$')[0];
    };

    // Data Store
    const model = {
        locations: {}, // id -> { grade, type }
        systems: {},   // id -> { grade, loc, type, authType, isCDS, isRegistered, stores: [] }
        connections: {}, // id -> { from, to, carries: [], protocol, isEncrypted, hasCDR, hasAntiVirus }
        data: {}       // id -> { grade, fileType }
    };

    // Regex for Fields
    const fieldRegex = /<field label="([^"]+)"[^>]*>([\s\S]*?)<\/field>/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(xml)) !== null) {
        const fieldName = fieldMatch[1];
        const content = fieldMatch[2];
        const tupleRegex = /<tuple>([\s\S]*?)<\/tuple>/g;
        let tupleMatch;

        while ((tupleMatch = tupleRegex.exec(content)) !== null) {
            const tupleContent = tupleMatch[1];
            const atomRegex = /<atom label="([^"]+)"\/>/g;
            const tupleAtoms = [];
            let am;
            while ((am = atomRegex.exec(tupleContent)) !== null) {
                tupleAtoms.push(cleanLabel(am[1]));
            }

            // Populate Model based on Field Name
            // tupleAtoms[0] is usually the subject
            const subject = tupleAtoms[0];

            if (fieldName === 'grade') {
                // Could be Location, System, or Data
                const grade = tupleAtoms[1];
                if (subject.startsWith('Location')) {
                    if (!model.locations[subject]) model.locations[subject] = {};
                    model.locations[subject].grade = grade;
                } else if (subject.startsWith('System')) {
                    if (!model.systems[subject]) model.systems[subject] = {};
                    model.systems[subject].grade = grade;
                } else if (subject.startsWith('Data')) {
                    if (!model.data[subject]) model.data[subject] = {};
                    model.data[subject].grade = grade;
                }
            } else if (fieldName === 'type') {
                // Location or System
                const type = tupleAtoms[1];
                if (subject.startsWith('Location')) {
                    if (!model.locations[subject]) model.locations[subject] = {};
                    model.locations[subject].type = type;
                } else if (subject.startsWith('System')) {
                    if (!model.systems[subject]) model.systems[subject] = {};
                    model.systems[subject].type = type;
                }
            } else if (fieldName === 'fileType') {
                if (!model.data[subject]) model.data[subject] = {};
                model.data[subject].fileType = tupleAtoms[1];
            } else if (fieldName === 'loc') {
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].loc = tupleAtoms[1];
            } else if (fieldName === 'authType') {
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].authType = tupleAtoms[1];
            } else if (fieldName === 'isCDS') {
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].isCDS = tupleAtoms[1] === 'True';
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].isRegistered = tupleAtoms[1] === 'True';
            } else if (fieldName === 'isStorageEncrypted') {
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].isStorageEncrypted = tupleAtoms[1] === 'True';
            } else if (fieldName === 'isManagement') {
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].isManagement = tupleAtoms[1] === 'True';
            } else if (fieldName === 'isolation') {
                if (!model.systems[subject]) model.systems[subject] = {};
                model.systems[subject].isolation = tupleAtoms[1];
            } else if (fieldName === 'stores') {
                if (!model.systems[subject]) model.systems[subject] = {};
                if (!model.systems[subject].stores) model.systems[subject].stores = [];
                model.systems[subject].stores.push(tupleAtoms[1]);
            } else if (fieldName === 'from') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].from = tupleAtoms[1];
            } else if (fieldName === 'to') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].to = tupleAtoms[1];
            } else if (fieldName === 'carries') {
                if (!model.connections[subject]) model.connections[subject] = {};
                if (!model.connections[subject].carries) model.connections[subject].carries = [];
                model.connections[subject].carries.push(tupleAtoms[1]);
            } else if (fieldName === 'protocol') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].protocol = tupleAtoms[1];
            } else if (fieldName === 'isEncrypted') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].isEncrypted = tupleAtoms[1] === 'True';
            } else if (fieldName === 'hasCDR') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].hasCDR = tupleAtoms[1] === 'True';
            } else if (fieldName === 'hasAntiVirus') {
                if (!model.connections[subject]) model.connections[subject] = {};
                model.connections[subject].hasAntiVirus = tupleAtoms[1] === 'True';
            }
        }
    }

    // Helper for Grade Comparison (Open < Sensitive < Classified)
    const gradeOrder = { 'Open': 0, 'Sensitive': 1, 'Classified': 2 };
    const lt = (g1, g2) => gradeOrder[g1] < gradeOrder[g2];

    // Initialize Threats
    const engines = [
        ```javascript
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeAlloy(filePath) {
    return new Promise((resolve, reject) => {
        // Paths
        // Use process.cwd() which is /app in Docker or local root
        const cwd = process.cwd();
        // Normalize paths to use forward slashes to avoid Windows shell escaping issues
        const normalizePath = (p) => p.replace(/\\/g, '/');

        const jarPath = normalizePath(path.join(cwd, 'alloy/alloy4.2_2015-02-22.jar'));
        // Use semicolon for Windows classpath separator (Local Execution)
        const classpath = `.;${ jarPath } `;
        const runnerPath = normalizePath(path.join(cwd, 'src/AlloyRunner.java'));
        const normalizedFilePath = normalizePath(filePath);

        console.log(`Execution Context: CWD = ${ cwd }, JAR = ${ jarPath }, Runner = ${ runnerPath }, File = ${ normalizedFilePath } `);

        // 1. Compile
        const compileCmd = `javac - cp "${classpath}" "${runnerPath}"`;

        console.log(`Compiling: ${ compileCmd } `);
        exec(compileCmd, { cwd: cwd }, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
                console.error(`Compilation error: ${ compileError } `);
                return resolve({ success: false, error: compileStderr || compileError.message });
            }

            // 2. Execute
            // Added 'src' to classpath for java execution because AlloyRunner.class is in src/ folder
            // Use semicolon for Windows
            const runCmd = `java - cp "src;${classpath}" AlloyRunner "${normalizedFilePath}"`;

            console.log(`Executing: ${ runCmd } `);
            exec(runCmd, { cwd: cwd }, (runError, runStdout, runStderr) => {
                if (runError) {
                    console.error(`Execution error: ${ runError } `);
                    return resolve({ success: false, error: runStderr || runError.message });
                }

                console.log(`stdout: ${ runStdout } `);

                // Parse XML
                const xmlPath = filePath.replace('.als', '.xml');
                if (fs.existsSync(xmlPath)) {
                    const xmlContent = fs.readFileSync(xmlPath, 'utf8');

                    const violations = parseAlloyXML(xmlContent);
                    resolve({ success: true, result: violations });
                } else {
                    resolve({ success: false, error: "XML output not found" });
                }
            });
        });
    });
}

function parseAlloyXML(xml) {
    const threats = {};
    let total_count = 0;

    // Helper to clean label
    const cleanLabel = (l) => {
        if (!l) return '';
        return l.split('/').pop().split('$')[0];
    };

    // Initialize Threats
    const engines = [
        'FindStorageViolations', 'FindFlowViolations', 'FindLocationViolations',
        'FindBypassViolations', 'FindUnencryptedChannels', 'FindAuthIntegrityGaps',
        'FindContentControlFailures', 'FindUnencryptedStorage', 'FindAdminAccessViolation'
    ];
    engines.forEach(key => threats[key] = []);

    // Map Alloy Function Names to Remediation Messages
    const threatConfig = {
        'FindStorageViolations': {
            msg: "시스템의 보안 등급을 상향하거나, 해당 데이터를 더 높은 등급의 시스템으로 이동하십시오.",
            type: 'SystemData'
        },
        'FindFlowViolations': {
            msg: "해당 경로에 CDS를 배치하거나, 출발지에 VDI/RBI 등 망분리 기술을 적용하십시오.",
            type: 'ConnectionData'
        },
        'FindLocationViolations': {
            msg: "시스템을 적절한 보안 등급의 망(Zone)으로 이동시키십시오.",
            type: 'System'
        },
        'FindBypassViolations': {
            msg: "인터넷망에서 내부망으로의 직접 연결을 제거하고, 반드시 CDS를 경유하도록 구성하십시오.",
            type: 'Connection'
        },
        'FindUnencryptedChannels': {
            msg: "해당 구간의 통신 프로토콜을 암호화된 프로토콜(HTTPS, SSH, VPN 등)로 변경하십시오.",
            type: 'Connection'
        },
        'FindAuthIntegrityGaps': {
            msg: "해당 시스템에 다중 인증(MFA)을 적용하고 자산 대장에 등록하십시오.",
            type: 'System'
        },
        'FindContentControlFailures': {
            msg: "망 간 이동 시 문서 파일에 대해 CDR(콘텐츠 무해화) 솔루션을 적용하십시오.",
            type: 'ConnectionData'
        },
        'FindUnencryptedStorage': {
            msg: "중요 데이터 저장 시 DB 암호화 또는 디스크 암호화(BitLocker 등)를 적용하십시오.",
            type: 'SystemData'
        },
        'FindAdminAccessViolation': {
            msg: "관리자 인터페이스는 오직 관리자 전용 단말(Management Device)에서만 접근해야 합니다.",
            type: 'Connection'
        }
    };

    // Regex to find fields in AnalysisResult
    // We look for <field label="Find...">...</field>
    const fieldRegex = /<field label="([^"]+)"[^>]*>([\s\S]*?)<\/field>/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(xml)) !== null) {
        const fieldName = fieldMatch[1];
        const content = fieldMatch[2];

        if (threatConfig[fieldName]) {
            const config = threatConfig[fieldName];
            const tupleRegex = /<tuple>([\s\S]*?)<\/tuple>/g;
            let tupleMatch;

            while ((tupleMatch = tupleRegex.exec(content)) !== null) {
                const tupleContent = tupleMatch[1];
                const atomRegex = /<atom label="([^"]+)"\/>/g;
                const atoms = [];
                let am;
                while ((am = atomRegex.exec(tupleContent)) !== null) {
                    atoms.push(cleanLabel(am[1]));
                }

                // atoms[0] is usually AnalysisResult$0
                // Data starts from atoms[1]
                if (atoms.length < 2) continue;

                if (config.type === 'System') {
                    threats[fieldName].push({
                        system: atoms[1],
                        remediation: config.msg
                    });
                    total_count++;
                } else if (config.type === 'Connection') {
                    threats[fieldName].push({
                        connection: atoms[1],
                        remediation: config.msg
                    });
                    total_count++;
                } else if (config.type === 'SystemData') {
                    threats[fieldName].push({
                        system: atoms[1],
                        data: atoms[2],
                        remediation: config.msg
                    });
                    total_count++;
                } else if (config.type === 'ConnectionData') {
                    threats[fieldName].push({
                        connection: atoms[1],
                        data: atoms[2],
                        remediation: config.msg
                    });
                    total_count++;
                }
            }
        }
    }

    return { threats, total_count };
}

module.exports = { executeAlloy };
```
