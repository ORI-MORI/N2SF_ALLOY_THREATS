const fs = require('fs');
const path = require('path');

/**
 * Deterministic Template Engine for N2SF Alloy Generation
 * Maps JSON data strictly to the defined Alloy templates.
 */
const generateAlloyFile = (jsonData) => {
    console.log("Starting generateAlloyFile...");
    const alloyDir = path.join(process.cwd(), 'alloy');
    const templatePath = path.join(alloyDir, 'user_instance.als');
    const outputPath = path.join(alloyDir, 'user_instance_real.als');
    console.log(`Template path: ${templatePath}`);

    if (!fs.existsSync(templatePath)) {
        console.error(`Template file not found at: ${templatePath}`);
        throw new Error(`Template file not found: ${templatePath}`);
    }

    // [Clean up] Delete existing file if it exists
    if (fs.existsSync(outputPath)) {
        try {
            fs.unlinkSync(outputPath);
            console.log(`Existing file deleted: ${outputPath}`);
        } catch (err) {
            console.error(`Failed to delete existing file: ${err.message}`);
        }
    }

    let als = fs.readFileSync(templatePath, 'utf8');
    console.log("Template read successfully.");

    // 0. Update Module Name
    als = als.replace(/module\s+user_instance/, 'module user_instance_real');

    // Helper Functions
    const formatBoolean = (val) => val ? 'True' : 'False';

    const formatList = (list, prefix = '') => {
        if (!list || list.length === 0) return 'none';
        return list.map(item => prefix ? `${prefix}${item}` : item).join(' + ');
    };

    let generatedContent = "\n// ============================================================\n";
    generatedContent += "// [GENERATED CONTENT START]\n";
    generatedContent += "// ============================================================\n\n";

    // [1. Zone 정의]
    console.log("Processing Zones...");
    if (jsonData.locations && jsonData.locations.length > 0) {
        jsonData.locations.forEach(loc => {
            generatedContent += `one sig Location${loc.id} extends Location {}\n`;
            generatedContent += `fact { Location${loc.id}.grade = ${loc.grade} and Location${loc.id}.type = ${loc.type} }\n\n`;
        });
    }

    // [2. Data 정의]
    console.log("Processing Data...");
    if (jsonData.data && jsonData.data.length > 0) {
        jsonData.data.forEach(d => {
            generatedContent += `one sig Data${d.id} extends Data {}\n`;
            generatedContent += `fact { Data${d.id}.grade = ${d.grade} and Data${d.id}.fileType = ${d.fileType} }\n\n`;
        });
    }

    // [3. System 정의]
    console.log("Processing Systems...");
    if (jsonData.systems && jsonData.systems.length > 0) {
        jsonData.systems.forEach(sys => {
            const stores = formatList(sys.stores, 'Data');
            const isolation = sys.isolation || 'None';

            generatedContent += `one sig System${sys.id} extends System {}\n`;
            generatedContent += `fact {\n`;
            generatedContent += `    System${sys.id}.grade = ${sys.grade}\n`;
            generatedContent += `    System${sys.id}.loc = Location${sys.loc}\n`;
            generatedContent += `    System${sys.id}.type = ${sys.type}\n`;
            generatedContent += `    System${sys.id}.authType = ${sys.authType}\n`;
            generatedContent += `    System${sys.id}.isCDS = ${formatBoolean(sys.isCDS)}\n`;
            generatedContent += `    System${sys.id}.isRegistered = ${formatBoolean(sys.isRegistered)}\n`;
            generatedContent += `    System${sys.id}.isStorageEncrypted = ${formatBoolean(sys.isStorageEncrypted)}\n`;
            generatedContent += `    System${sys.id}.isManagement = ${formatBoolean(sys.isManagement)}\n`;
            generatedContent += `    System${sys.id}.isolation = ${isolation}\n`;
            generatedContent += `    System${sys.id}.hasMDM = ${formatBoolean(sys.hasMDM)}\n`;
            generatedContent += `    System${sys.id}.stores = ${stores}\n`;
            generatedContent += `}\n\n`;
        });
    }

    // [4. Connection 정의]
    console.log("Processing Connections...");
    if (jsonData.connections && jsonData.connections.length > 0) {
        jsonData.connections.forEach((conn, index) => {
            const connId = conn.id || index;
            const carries = formatList(conn.carries, 'Data');

            generatedContent += `one sig Connection${connId} extends Connection {}\n`;
            generatedContent += `fact {\n`;
            generatedContent += `    Connection${connId}.from = System${conn.from}\n`;
            generatedContent += `    Connection${connId}.to = System${conn.to}\n`;
            generatedContent += `    Connection${connId}.carries = ${carries}\n`;
            generatedContent += `    Connection${connId}.protocol = ${conn.protocol}\n`;
            generatedContent += `    Connection${connId}.isEncrypted = ${formatBoolean(conn.isEncrypted)}\n`;
            generatedContent += `    Connection${connId}.hasCDR = ${formatBoolean(conn.hasCDR)}\n`;
            generatedContent += `    Connection${connId}.hasDLP = ${formatBoolean(conn.hasDLP)}\n`;
            generatedContent += `    Connection${connId}.hasAntiVirus = ${formatBoolean(conn.hasAntiVirus)}\n`;
            generatedContent += `}\n\n`;
        });
    }

    // [5. AnalysisResult 정의]
    generatedContent += `// ============================================================\n`;
    generatedContent += `// [GENERATED] 결과 집합 (Analysis Result)\n`;
    generatedContent += `// ============================================================\n\n`;
    generatedContent += `one sig AnalysisResult {\n`;
    generatedContent += `    FindStorageViolations: set System -> Data,\n`;
    generatedContent += `    FindFlowViolations: set Connection -> Data,\n`;
    generatedContent += `    FindLocationViolations: set System,\n`;
    generatedContent += `    FindBypassViolations: set Connection,\n`;
    generatedContent += `    FindUnencryptedChannels: set Connection,\n`;
    generatedContent += `    FindAuthIntegrityGaps: set System,\n`;
    generatedContent += `    FindContentControlFailures: set Connection -> Data,\n`;
    generatedContent += `    FindUnencryptedStorage: set System -> Data,\n`;
    generatedContent += `    FindAdminAccessViolation: set Connection\n`;
    generatedContent += `}\n\n`;

    generatedContent += `fact DefineAnalysisResult {\n`;
    generatedContent += `    AnalysisResult.FindStorageViolations = FindStorageViolations\n`;
    generatedContent += `    AnalysisResult.FindFlowViolations = FindFlowViolations\n`;
    generatedContent += `    AnalysisResult.FindLocationViolations = FindLocationViolations\n`;
    generatedContent += `    AnalysisResult.FindBypassViolations = FindBypassViolations\n`;
    generatedContent += `    AnalysisResult.FindUnencryptedChannels = FindUnencryptedChannels\n`;
    generatedContent += `    AnalysisResult.FindAuthIntegrityGaps = FindAuthIntegrityGaps\n`;
    generatedContent += `    AnalysisResult.FindContentControlFailures = FindContentControlFailures\n`;
    generatedContent += `    AnalysisResult.FindUnencryptedStorage = FindUnencryptedStorage\n`;
    generatedContent += `    AnalysisResult.FindAdminAccessViolation = FindAdminAccessViolation\n`;
    generatedContent += `}\n\n`;

    // Inject generated content into the template
    // Replacing the placeholder block
    const placeholderRegex = /\/\/ \[Generator[\s\S]*?\*\//;
    if (placeholderRegex.test(als)) {
        als = als.replace(placeholderRegex, generatedContent);
    } else {
        // Fallback: append before run {}
        als = als.replace('run {}', generatedContent + '\nrun {}');
    }

    fs.writeFileSync(outputPath, als);
    console.log(`Alloy file generated successfully at ${outputPath}`);
    return outputPath;
}

module.exports = { generateAlloyFile };
