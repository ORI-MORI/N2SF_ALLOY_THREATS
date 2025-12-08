const fs = require('fs');
const path = require('path');

/**
 * [Implementation Principles]
 * 1. Enum Mapping: JSON strings must map to Alloy Enum Atoms (e.g., "HTTPS" -> HTTPS).
 * 2. Set Operations: Arrays must be joined with '+' or become 'none' if empty.
 * 3. Boolean Conversion: JSON true/false -> Alloy True/False (Atoms).
 */
const generateAlloyFile = (jsonData) => {
    console.log("Starting generateAlloyFile...");

    // Directory Configuration
    // Directory Configuration
    // Use __dirname to resolve paths relative to this file (src/alloyGenerator.js) checks BACKEND/alloy
    const alloyDir = path.join(__dirname, '..', 'alloy');
    const templatePath = path.join(alloyDir, 'user_instance.als');
    const outputPath = path.join(alloyDir, 'user_instance_real.als');
    console.log(`Template path resolved to: ${templatePath}`);
    console.log(`Template path: ${templatePath}`);

    console.log(`Current Working Directory: ${process.cwd()}`);
    console.log(`Constructed Template Path: ${templatePath}`);
    console.log(`File exists? ${fs.existsSync(templatePath)}`);

    if (!fs.existsSync(templatePath)) {
        console.error(`Template file not found at: ${templatePath}`);
        throw new Error(`Template file not found: ${templatePath}`);
    }

    let als = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            if (fs.existsSync(templatePath)) {
                als = fs.readFileSync(templatePath, 'utf8');
                console.log("Template read successfully.");
                break;
            } else {
                console.warn(`Attempt ${attempts + 1}: Template file not found at ${templatePath}`);
            }
        } catch (err) {
            console.warn(`Attempt ${attempts + 1}: Error reading template file: ${err.message}`);
        }
        attempts++;
        if (attempts < maxAttempts) {
            const delay = 100 * attempts; // Exponential backoff-ish
            console.log(`Waiting ${delay}ms before retry...`);
            const start = Date.now();
            while (Date.now() - start < delay) { } // Busy wait to avoid async complexity in this sync function
        }
    }

    if (!als) {
        console.error(`Failed to read template file after ${maxAttempts} attempts.`);
        throw new Error(`Template file not found or unreadable: ${templatePath}`);
    }

    // 0. Update Module Name
    als = als.replace('module user_instance', 'module user_instance_real');

    // Helper Functions
    const formatBoolean = (val) => val ? 'True' : 'False';

    const formatList = (list, prefix = '') => {
        if (!list || list.length === 0) return 'none';

        // Handle array of IDs (e.g., [101, 102])
        if (typeof list[0] === 'number' || typeof list[0] === 'string') {
            return list.map(id => prefix + id).join(' + ');
        }
        // Handle array of objects (if any) - not expected for stores/carries usually
        return 'none';
    };

    let zonesCode = "";
    let dataCode = "";
    let systemsCode = "";
    let connectionsCode = "";

    // [1. Zone 정의]
    console.log("Processing Zones...");
    if (jsonData.locations && jsonData.locations.length > 0) {
        jsonData.locations.forEach(loc => {
            const wips = loc.wips_enabled ? 'WIPS_Active' : 'NoProtection';
            zonesCode += `one sig Zone${loc.id} extends Zone {}\n`;
            zonesCode += `fact { Zone${loc.id}.grade = ${loc.grade} and Zone${loc.id}.type = ${loc.type} and Zone${loc.id}.wipsStatus = ${wips} }\n\n`;
        });
    }

    // [2. Data 정의]
    console.log("Processing Data...");
    if (jsonData.data && jsonData.data.length > 0) {
        jsonData.data.forEach(d => {
            // Default to GeneralData if not specified
            const dataType = d.dataType || 'GeneralData';
            dataCode += `one sig Data${d.id} extends Data {}\n`;
            dataCode += `fact { Data${d.id}.grade = ${d.grade} and Data${d.id}.dataType = ${dataType} }\n\n`;
        });
    }

    // [3. System 정의]
    console.log("Processing Systems...");
    if (jsonData.systems && jsonData.systems.length > 0) {
        jsonData.systems.forEach(sys => {
            console.log(`[DEBUG] Processing System ID: ${sys.id}, LOC: ${sys.loc}, LOCATION: ${sys.location}`);
            // List Handling: stores -> Data1 + Data2
            const stores = formatList(sys.stores, 'Data');

            // Enum Mapping
            const grade = sys.grade || 'Open';
            const deviceType = sys.deviceType || 'Server';
            const serviceModel = sys.serviceModel || 'OnPremise';
            const lifeCycle = sys.eol_status || sys.lifeCycle || 'Active';
            const patchStatus = sys.patch_status || sys.patchStatus || 'UpToDate';
            const cdsType = sys.cds_type || sys.cdsType || 'NotCDS';
            const authRaw = sys.auth_type || sys.authType || 'Single_Factor';
            const authMechanism = (authRaw === 'Single') ? 'Single_Factor' : (authRaw === 'Multi' ? 'Multi_Factor' : authRaw);
            const keyMgmt = sys.key_storage || sys.keyMgmt || 'Local_Storage';
            const virtStatus = sys.virt_status || sys.virtStatus || 'Physical';
            const isolationRaw = sys.tenant_isolation || sys.tenantIsolation || 'Dedicated';
            const tenantIsolation = (isolationRaw === 'None') ? 'Dedicated' : isolationRaw;
            const dataVolatility = sys.data_volatility || sys.dataVolatility || 'Persistent_Disk';
            const failureMode = sys.failure_mode || sys.failureMode || (deviceType === 'Gateway' ? 'Fail_Secure' : 'Fail_Open'); // Template Logic
            const sessionPolicy = sys.session_policy || sys.sessionPolicy || 'Unsafe';

            // Boolean / Int Conversions
            const isManagementDevice = (sys.is_admin || sys.isManagement) ? '1' : '0';
            const isRegistered = (sys.is_registered !== undefined ? sys.is_registered : (sys.isRegistered !== undefined ? sys.isRegistered : true)) ? '1' : '0';
            const isCertified = (sys.is_certified || sys.isCertified) ? '1' : '0';
            const hasHwIntegrity = (sys.has_tpm || sys.hasHwIntegrity) ? '1' : '0';
            const hasSwIntegrity = (sys.has_os_sign || sys.hasSwIntegrity) ? '1' : '0';
            const hasContainer = (deviceType === 'Mobile' || sys.has_container || sys.hasContainer) ? '1' : '0'; // Template Logic
            const hasWirelessInterface = (deviceType === 'Mobile' || sys.has_wifi || sys.hasWirelessInterface) ? '1' : '0';
            const hasPhysicalPortControl = (sys.usb_control || sys.hasPhysicalPortControl) ? '1' : '0';
            const hasAuditLogging = (sys.audit_log || sys.hasAuditLogging) ? '1' : '0';
            const isHardened = (sys.os_hardening || sys.isHardened) ? '1' : '0';
            const isRedundant = (deviceType === 'Gateway' && (sys.is_ha || sys.isRedundant)) ? '1' : '0'; // Gateway default
            const hasSecureClock = (sys.ntp_sync || sys.hasSecureClock) ? '1' : '0';
            const hasDDoSProtection = (sys.ddos_agent || sys.hasDDoSProtection) ? '1' : '0';

            systemsCode += `one sig System${sys.id} extends System {}\n`;
            systemsCode += `fact {\n`;
            systemsCode += `    // [Basic Info]\n`;
            systemsCode += `    System${sys.id}.grade = ${grade}\n`;
            systemsCode += `    System${sys.id}.stores = ${stores}\n`;
            systemsCode += `    System${sys.id}.supportedGrades = ${grade}\n`; // Default to self grade for now
            systemsCode += `    System${sys.id}.physicalLoc = Zone${sys.location || sys.loc}\n`;
            systemsCode += `    System${sys.id}.connectedZones = Zone${sys.location || sys.loc}\n`; // Simplified

            systemsCode += `    // [Asset Info]\n`;
            systemsCode += `    System${sys.id}.deviceType = ${deviceType}\n`;
            systemsCode += `    System${sys.id}.serviceModel = ${serviceModel}\n`;
            systemsCode += `    System${sys.id}.isManagementDevice = ${isManagementDevice}\n`;
            systemsCode += `    System${sys.id}.isRegistered = ${isRegistered}\n`;
            systemsCode += `    System${sys.id}.lifeCycle = ${lifeCycle}\n`;
            systemsCode += `    System${sys.id}.patchStatus = ${patchStatus}\n`;
            systemsCode += `    System${sys.id}.isCertified = ${isCertified}\n`;

            systemsCode += `    // [Security State]\n`;
            systemsCode += `    System${sys.id}.cdsType = ${cdsType}\n`;
            systemsCode += `    System${sys.id}.hasHwIntegrity = ${hasHwIntegrity}\n`;
            systemsCode += `    System${sys.id}.hasSwIntegrity = ${hasSwIntegrity}\n`;
            systemsCode += `    System${sys.id}.authMechanism = ${authMechanism}\n`;
            systemsCode += `    System${sys.id}.hasContainer = ${hasContainer}\n`;
            systemsCode += `    System${sys.id}.hasWirelessInterface = ${hasWirelessInterface}\n`;
            systemsCode += `    System${sys.id}.hasPhysicalPortControl = ${hasPhysicalPortControl}\n`;
            systemsCode += `    System${sys.id}.keyMgmt = ${keyMgmt}\n`;
            systemsCode += `    System${sys.id}.virtStatus = ${virtStatus}\n`;
            systemsCode += `    System${sys.id}.tenantIsolation = ${tenantIsolation}\n`;

            systemsCode += `    // [Ops State]\n`;
            systemsCode += `    System${sys.id}.dataVolatility = ${dataVolatility}\n`;
            systemsCode += `    System${sys.id}.failureMode = ${failureMode}\n`;
            systemsCode += `    System${sys.id}.hasAuditLogging = ${hasAuditLogging}\n`;
            systemsCode += `    System${sys.id}.isHardened = ${isHardened}\n`;
            systemsCode += `    System${sys.id}.isRedundant = ${isRedundant}\n`;
            systemsCode += `    System${sys.id}.hasSecureClock = ${hasSecureClock}\n`;
            systemsCode += `    System${sys.id}.hasDDoSProtection = ${hasDDoSProtection}\n`;
            systemsCode += `    System${sys.id}.sessionPolicy = ${sessionPolicy}\n`;
            systemsCode += `}\n\n`;
        });
    }

    // [4. Connection 정의]
    console.log("Processing Connections...");
    if (jsonData.connections && jsonData.connections.length > 0) {
        jsonData.connections.forEach((conn, index) => {
            const connId = conn.id || index;

            // List Handling: carries -> Data1 + Data2
            const carries = formatList(conn.carries, 'Data');

            // Set Handling: inspections -> DLP + AntiVirus + ...
            const inspections = formatList(conn.inspections, '');

            // Mappings
            const connType = conn.conn_type || conn.connType || 'FileTransfer';
            const protocol = conn.protocol || 'Generic_TCP';
            // Ensure protocol is valid Enum
            const validProtocols = ['Generic_TCP', 'DNS', 'SSH', 'RDP', 'HTTPS', 'VPN_Tunnel', 'ClearText', 'SQL'];
            const safeProtocol = validProtocols.includes(protocol) ? protocol : 'Generic_TCP';
            const encQuality = conn.encryption || conn.encQuality || (conn.isEncrypted ? 'SSL_TLS' : 'NoEncryption');
            const integrityStatus = conn.integrity_check || conn.integrityStatus || 'NoIntegrity';
            const duration = conn.duration || 'Ephemeral';
            const accessPolicy = conn.access_policy || conn.accessPolicy || 'Temporary_Approval';
            const targetPortType = conn.target_port || conn.targetPortType || 'ServicePort';
            const isolationMethod = conn.isolation || conn.isolationMethod || 'Direct_Browser';

            // Int Conversions
            const isAdminTraffic = (conn.is_admin_traffic || conn.isAdminTraffic) ? '1' : '0';
            const hasContentFilter = (conn.has_dlp || conn.hasDLP) ? '1' : '0'; // Or redundant with inspections
            const hasCDR = (conn.has_cdr || conn.hasCDR) ? '1' : '0';

            connectionsCode += `one sig Connection${connId} extends Connection {}\n`;
            connectionsCode += `fact {\n`;
            connectionsCode += `    Connection${connId}.from = System${conn.from}\n`;
            connectionsCode += `    Connection${connId}.to = System${conn.to}\n`;
            connectionsCode += `    Connection${connId}.carries = ${carries}\n`;

            connectionsCode += `    // [Connection Properties]\n`;
            connectionsCode += `    Connection${connId}.connType = ${connType}\n`;
            connectionsCode += `    Connection${connId}.protocol = ${safeProtocol}\n`;
            connectionsCode += `    Connection${connId}.encQuality = ${encQuality}\n`;
            connectionsCode += `    Connection${connId}.integrityStatus = ${integrityStatus}\n`;
            connectionsCode += `    Connection${connId}.duration = ${duration}\n`;
            connectionsCode += `    Connection${connId}.accessPolicy = ${accessPolicy}\n`;
            connectionsCode += `    Connection${connId}.targetPortType = ${targetPortType}\n`;
            connectionsCode += `    Connection${connId}.isAdminTraffic = ${isAdminTraffic}\n`;
            connectionsCode += `    Connection${connId}.isolationMethod = ${isolationMethod}\n`;

            connectionsCode += `    // [Security Filtering]\n`;
            connectionsCode += `    Connection${connId}.hasContentFilter = ${hasContentFilter}\n`;
            connectionsCode += `    Connection${connId}.hasCDR = ${hasCDR}\n`;
            connectionsCode += `    Connection${connId}.inspections = ${inspections}\n`;
            connectionsCode += `}\n\n`;
        });
    }

    // [5. AnalysisResult 정의]
    let analysisResultCode = "";
    analysisResultCode += `// ============================================================\n`;
    analysisResultCode += `// [GENERATED] 결과 집합 (Analysis Result)\n`;
    analysisResultCode += `// 39개 위협 탐지 규칙 모두 매핑\n`;
    analysisResultCode += `// ============================================================\n`;
    analysisResultCode += `one sig AnalysisResult {\n`;
    analysisResultCode += `    // Group A. 구조 및 흐름 위협\n`;
    analysisResultCode += `    FindSplitTunneling: set System,\n`;
    analysisResultCode += `    FindDirectConnection: set Connection,\n`;
    analysisResultCode += `    FindFlowViolations: set Connection -> Data,\n`;

    analysisResultCode += `    // Group B. 데이터 및 암호화 위협\n`;
    analysisResultCode += `    FindStorageViolations: set System -> Data,\n`;
    analysisResultCode += `    FindWeakCrypto: set Connection,\n`;
    analysisResultCode += `    FindIntegrityLoss: set Connection,\n`;
    analysisResultCode += `    FindInsecureKey: set System,\n`;

    analysisResultCode += `    // Group C. 접근 통제 및 인증\n`;
    analysisResultCode += `    FindWeakAuth: set System,\n`;
    analysisResultCode += `    FindExposedAdmin: set Connection,\n`;
    analysisResultCode += `    FindPermanentAdmin: set Connection,\n`;

    analysisResultCode += `    // Group D. 자산 및 무결성\n`;
    analysisResultCode += `    FindShadowIT: set System,\n`;
    analysisResultCode += `    FindIntegrityFailure: set System,\n`;
    analysisResultCode += `    FindUnpatchedExposure: set System,\n`;
    analysisResultCode += `    FindEOL: set System,\n`;
    analysisResultCode += `    FindUncertifiedGear: set System,\n`;

    analysisResultCode += `    // Group E. 물리 및 환경 보안\n`;
    analysisResultCode += `    FindWirelessThreat: set System,\n`;
    analysisResultCode += `    FindPortRisk: set System,\n`;
    analysisResultCode += `    FindMobileRisk: set System,\n`;

    analysisResultCode += `    // Group F. 콘텐츠 및 신기술 위협\n`;
    analysisResultCode += `    FindMissingCDR: set Connection,\n`;
    analysisResultCode += `    FindFormatRisk: set Connection,\n`;
    analysisResultCode += `    FindDLPFailure: set Connection,\n`;
    analysisResultCode += `    FindAIFilterFailure: set Connection,\n`;
    analysisResultCode += `    FindPIILeakage: set Connection,\n`;
    analysisResultCode += `    FindBrowserIsolation: set Connection,\n`;
    analysisResultCode += `    FindVirtRisk: set System,\n`;

    analysisResultCode += `    // Group G. 운영 및 가용성\n`;
    analysisResultCode += `    FindAuditFailure: set System,\n`;
    analysisResultCode += `    FindTimeSyncFailure: set System,\n`;
    analysisResultCode += `    FindHardeningFailure: set System,\n`;
    analysisResultCode += `    FindRedundancyFailure: set System,\n`;
    analysisResultCode += `    FindFailOpenRisk: set System,\n`;
    analysisResultCode += `    FindDDoSRisk: set System,\n`;
    analysisResultCode += `    FindWeakSession: set System,\n`;
    analysisResultCode += `    FindPersistentRisk: set Connection,\n`;
    analysisResultCode += `    FindResidualData: set System,\n`;
    analysisResultCode += `    FindDNSViolation: set Connection,\n`;
    analysisResultCode += `    FindDevProdViolation: set System,\n`;
    analysisResultCode += `    FindOpaqueTraffic: set Connection,\n`;
    analysisResultCode += `    FindTransitiveLeaks: set System -> Data,\n`;
    analysisResultCode += `    FindBypass: set Connection\n`;
    analysisResultCode += `}\n\n`;

    analysisResultCode += `fact DefineAnalysisResult {\n`;
    analysisResultCode += `    AnalysisResult.FindSplitTunneling = FindSplitTunneling\n`;
    analysisResultCode += `    AnalysisResult.FindDirectConnection = FindDirectConnection\n`;
    analysisResultCode += `    AnalysisResult.FindFlowViolations = FindFlowViolations\n`;

    analysisResultCode += `    AnalysisResult.FindStorageViolations = FindStorageViolations\n`;
    analysisResultCode += `    AnalysisResult.FindWeakCrypto = FindWeakCrypto\n`;
    analysisResultCode += `    AnalysisResult.FindIntegrityLoss = FindIntegrityLoss\n`;
    analysisResultCode += `    AnalysisResult.FindInsecureKey = FindInsecureKey\n`;

    analysisResultCode += `    AnalysisResult.FindWeakAuth = FindWeakAuth\n`;
    analysisResultCode += `    AnalysisResult.FindExposedAdmin = FindExposedAdmin\n`;
    analysisResultCode += `    AnalysisResult.FindPermanentAdmin = FindPermanentAdmin\n`;

    analysisResultCode += `    AnalysisResult.FindShadowIT = FindShadowIT\n`;
    analysisResultCode += `    AnalysisResult.FindIntegrityFailure = FindIntegrityFailure\n`;
    analysisResultCode += `    AnalysisResult.FindUnpatchedExposure = FindUnpatchedExposure\n`;
    analysisResultCode += `    AnalysisResult.FindEOL = FindEOL\n`;
    analysisResultCode += `    AnalysisResult.FindUncertifiedGear = FindUncertifiedGear\n`;

    analysisResultCode += `    AnalysisResult.FindWirelessThreat = FindWirelessThreat\n`;
    analysisResultCode += `    AnalysisResult.FindPortRisk = FindPortRisk\n`;
    analysisResultCode += `    AnalysisResult.FindMobileRisk = FindMobileRisk\n`;

    analysisResultCode += `    AnalysisResult.FindMissingCDR = FindMissingCDR\n`;
    analysisResultCode += `    AnalysisResult.FindFormatRisk = FindFormatRisk\n`;
    analysisResultCode += `    AnalysisResult.FindDLPFailure = FindDLPFailure\n`;
    analysisResultCode += `    AnalysisResult.FindAIFilterFailure = FindAIFilterFailure\n`;
    analysisResultCode += `    AnalysisResult.FindPIILeakage = FindPIILeakage\n`;
    analysisResultCode += `    AnalysisResult.FindBrowserIsolation = FindBrowserIsolation\n`;
    analysisResultCode += `    AnalysisResult.FindVirtRisk = FindVirtRisk\n`;

    analysisResultCode += `    AnalysisResult.FindAuditFailure = FindAuditFailure\n`;
    analysisResultCode += `    AnalysisResult.FindTimeSyncFailure = FindTimeSyncFailure\n`;
    analysisResultCode += `    AnalysisResult.FindHardeningFailure = FindHardeningFailure\n`;
    analysisResultCode += `    AnalysisResult.FindRedundancyFailure = FindRedundancyFailure\n`;
    analysisResultCode += `    AnalysisResult.FindFailOpenRisk = FindFailOpenRisk\n`;
    analysisResultCode += `    AnalysisResult.FindDDoSRisk = FindDDoSRisk\n`;
    analysisResultCode += `    AnalysisResult.FindWeakSession = FindWeakSession\n`;
    analysisResultCode += `    AnalysisResult.FindPersistentRisk = FindPersistentRisk\n`;
    analysisResultCode += `    AnalysisResult.FindResidualData = FindResidualData\n`;
    analysisResultCode += `    AnalysisResult.FindDNSViolation = FindDNSViolation\n`;
    analysisResultCode += `    AnalysisResult.FindDevProdViolation = FindDevProdViolation\n`;
    analysisResultCode += `    AnalysisResult.FindOpaqueTraffic = FindOpaqueTraffic\n`;

    analysisResultCode += `    AnalysisResult.FindTransitiveLeaks = FindTransitiveLeaks\n`;
    analysisResultCode += `    AnalysisResult.FindBypass = FindBypass\n`;
    analysisResultCode += `}\n\n`;

    // Inject generated content into the template
    als = als.replace('// [ZONES_HERE]', zonesCode);
    als = als.replace('// [DATA_HERE]', dataCode);
    als = als.replace('// [SYSTEMS_HERE]', systemsCode);
    als = als.replace('// [CONNECTIONS_HERE]', connectionsCode);

    // Append AnalysisResult and run command at the end
    als += '\n' + analysisResultCode + '\nrun CheckViolations { some AnalysisResult }\n';

    fs.writeFileSync(outputPath, als);
    try {
        fs.writeFileSync(path.join(alloyDir, 'server_debug.als'), als);
        console.log("Saved debug copy to server_debug.als");
    } catch (e) { console.error("Failed to save debug copy", e); }
    console.log(`Alloy file generated successfully at ${outputPath}`);
    console.log(`Generated ALS Content Length: ${als.length}`);
    // console.log(`Generated ALS Content Preview:\n${als.substring(0, 500)}`);
    return outputPath;
};

module.exports = { generateAlloyFile };
