const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeAlloy(filePath) {
    return new Promise((resolve, reject) => {
        // Paths
        const cwd = process.cwd();
        const normalizePath = (p) => p.replace(/\\/g, '/');

        const jarPath = normalizePath(path.join(cwd, 'alloy/alloy4.2_2015-02-22.jar'));
        const classpath = `.;${jarPath}`;
        const runnerPath = normalizePath(path.join(cwd, 'src/AlloyRunner.java'));
        const normalizedFilePath = normalizePath(filePath);
        const xmlPath = filePath.replace('.als', '.xml');

        console.log(`Execution Context: CWD=${cwd}, JAR=${jarPath}, Runner=${runnerPath}, File=${normalizedFilePath}`);

        // [Clean up] Delete existing XML file if it exists
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
        exec(compileCmd, { cwd: cwd, maxBuffer: 1024 * 1024 * 10 }, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
                console.error(`Compilation error: ${compileError}`);
                return resolve({ success: false, error: compileStderr || compileError.message });
            }

            // 2. Execute
            const runCmd = `java -cp "src;${classpath}" AlloyRunner "${normalizedFilePath}"`;

            console.log(`Executing: ${runCmd}`);
            exec(runCmd, { cwd: cwd, maxBuffer: 1024 * 1024 * 10 }, (runError, runStdout, runStderr) => {
                if (runError) {
                    console.error(`Execution error: ${runError}`);
                    return resolve({ success: false, error: runStderr || runError.message });
                }

                console.log(`stdout: ${runStdout}`);

                // Parse XML
                if (fs.existsSync(xmlPath)) {
                    const xmlContent = fs.readFileSync(xmlPath, 'utf8');
                    const violations = parseAlloyXML(xmlContent);

                    // Log final result to file
                    const result = violations; // parseAlloyXML returns { threats, total_count }

                    try {
                        fs.writeFileSync('debug_result.json', JSON.stringify(result, null, 2));
                        console.log("Final Result Saved to debug_result.json");
                    } catch (e) {
                        console.error("Failed to write debug_result.json", e);
                    }

                    resolve({ success: true, result });
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
        // Handle cases like "n2sf_base/Connection$1" or "Connection123$0"
        const parts = l.split('/');
        let lastPart = parts[parts.length - 1];
        lastPart = lastPart.split('$')[0];

        // Strip prefixes added by alloyGenerator.js
        if (lastPart.startsWith('System') && lastPart.length > 6) return lastPart.substring(6);
        if (lastPart.startsWith('Location') && lastPart.length > 8) return lastPart.substring(8);
        if (lastPart.startsWith('Connection') && lastPart.length > 10) return lastPart.substring(10);
        if (lastPart.startsWith('Data') && lastPart.length > 4) return lastPart.substring(4);

        return lastPart;
    };

    // Initialize Threats
    const engines = [
        'FindSplitTunneling', 'FindDirectConnection', 'FindFlowViolations',
        'FindStorageViolations', 'FindWeakCrypto', 'FindIntegrityLoss', 'FindInsecureKey',
        'FindWeakAuth', 'FindExposedAdmin', 'FindPermanentAdmin',
        'FindShadowIT', 'FindIntegrityFailure', 'FindUnpatchedExposure', 'FindEOL', 'FindUncertifiedGear',
        'FindWirelessThreat', 'FindPortRisk', 'FindMobileRisk',
        'FindMissingCDR', 'FindFormatRisk', 'FindDLPFailure', 'FindAIFilterFailure', 'FindPIILeakage', 'FindBrowserIsolation', 'FindVirtRisk',
        'FindAuditFailure', 'FindTimeSyncFailure', 'FindHardeningFailure', 'FindRedundancyFailure', 'FindFailOpenRisk', 'FindDDoSRisk', 'FindWeakSession', 'FindPersistentRisk', 'FindResidualData', 'FindDNSViolation', 'FindDevProdViolation', 'FindOpaqueTraffic',
        'FindTransitiveLeaks', 'FindBypass'
    ];
    engines.forEach(key => threats[key] = []);

    // Configuration for Threat Messages and Parsing Types
    const threatConfig = {
        // Group A. 구조 및 흐름 위협
        'FindSplitTunneling': { msg: "[N2SF-EB-4] 망 분리 위반: 업무망 단말이 인터넷망과 동시에 연결되어 있습니다. 망 분리 기술을 적용하십시오.", type: 'System' },
        'FindDirectConnection': { msg: "[N2SF-EB-5] 망 간 직접 연결: 이종 보안 구역 간에는 반드시 Gateway/CDS를 경유해야 합니다.", type: 'Connection' },
        'FindFlowViolations': { msg: "[N2SF-IF-5] 정보 흐름 위반: 하위 등급으로 데이터 전송 시 적절한 망연계(CDS) 장비를 경유해야 합니다.", type: 'ConnectionData' },

        // Group B. 데이터 및 암호화 위협
        'FindStorageViolations': { msg: "[N2SF-Data] 저장 위반: 시스템이 취급 인가 등급보다 높은 데이터를 저장하고 있습니다.", type: 'SystemData' },
        'FindWeakCrypto': { msg: "[N2SF-EA-1] 암호화 품질 미비: 외부/무선 구간 전송 시 검증필 암호 모듈을 사용해야 합니다.", type: 'Connection' },
        'FindIntegrityLoss': { msg: "[N2SF-DT-6] 전송 무결성 미비: 중요 정보 전송 시 위변조 방지(HMAC 등) 조치가 필요합니다.", type: 'Connection' },
        'FindInsecureKey': { msg: "[N2SF-EK-3] 키 관리 위반: 암호 키는 HSM 등 안전한 별도 저장소에 보관해야 합니다.", type: 'System' },

        // Group C. 접근 통제 및 인증
        'FindWeakAuth': { msg: "[N2SF-MA-1] 인증 강도 미비: 관리자 또는 원격 접속 시 MFA(다중 인증)를 적용하십시오.", type: 'System' },
        'FindExposedAdmin': { msg: "[N2SF-EB-8] 관리 포트 노출: 관리 트래픽은 관리망 또는 전용 단말에서만 허용되어야 합니다.", type: 'Connection' },
        'FindPermanentAdmin': { msg: "[N2SF-LP-4] 상시 원격 관리: 외부 원격 관리는 한시적 허용 정책을 적용해야 합니다.", type: 'Connection' },

        // Group D. 자산 및 무결성
        'FindShadowIT': { msg: "[N2SF-DV-M1] 미등록 자산: 보안 관리 대장에 등록되지 않은 자산이 연결되었습니다.", type: 'System' },
        'FindIntegrityFailure': { msg: "[N2SF-DV-1] 시스템 무결성: 중요 시스템은 TPM 및 SW 서명 검증 등 무결성 확보가 필요합니다.", type: 'System' },
        'FindUnpatchedExposure': { msg: "[N2SF-IN-1] 취약점 노출: 외부 접점에 패치되지 않은 취약한 시스템이 존재합니다.", type: 'System' },
        'FindEOL': { msg: "[N2SF-IN-9] EOL 자산: 기술 지원이 종료된 자산(EOL)을 중요 시스템으로 사용 중입니다.", type: 'System' },
        'FindUncertifiedGear': { msg: "[부록2] 미인증 보안 제품: 보안 기능이 있는 장비는 CC인증 등 적합성 검증을 받아야 합니다.", type: 'System' },

        // Group E. 물리 및 환경 보안
        'FindWirelessThreat': { msg: "[N2SF-Wireless] 무선 보안 미비: 무선망 사용 시 WIPS(무선침입방지) 등을 적용해야 합니다.", type: 'System' },
        'FindPortRisk': { msg: "[N2SF-DV-3] 물리 포트 미통제: 중요 정보를 다루는 단말은 물리적 포트(USB 등) 통제가 필요합니다.", type: 'System' },
        'FindMobileRisk': { msg: "[N2SF-MD-5] 모바일 보안 미비: 중요 정보를 다루는 모바일 기기는 컨테이너 기술 등을 적용해야 합니다.", type: 'System' },

        // Group F. 콘텐츠 및 신기술 위협
        'FindMissingCDR': { msg: "[N2SF-CD-6] CDR 미적용: 망 간 파일 전송 시 악성코드 무해화(CDR) 솔루션을 적용하십시오.", type: 'Connection' },
        'FindFormatRisk': { msg: "[N2SF-Format] 포맷 검증 미비: 파일 전송 시 알려진 포맷인지 검증해야 합니다.", type: 'Connection' },
        'FindDLPFailure': { msg: "[N2SF-IF-6] DLP 미적용: 외부로 나가는 중요 정보에 대해 유출 방지(DLP) 솔루션이 필요합니다.", type: 'Connection' },
        'FindAIFilterFailure': { msg: "[N2SF-AI] AI 필터링 미비: AI/클라우드 서비스 이용 시 개인/민감 정보 입력 방지 필터가 필요합니다.", type: 'Connection' },
        'FindPIILeakage': { msg: "[N2SF-EB-M1] 개인정보 유출: 개인정보(PII) 등은 비식별화 조치 후 클라우드로 전송해야 합니다.", type: 'Connection' },
        'FindBrowserIsolation': { msg: "[N2SF-Web] 브라우저 격리 미비: 민감 업무 단말에서의 인터넷 접속은 VDI/RBI 분리가 권장됩니다.", type: 'Connection' },
        'FindVirtRisk': { msg: "[N2SF-IS-5] 가상화 격리 미비: 클라우드/가상환경에서 테넌트 간 분리 및 하이퍼바이저 보안이 미흡합니다.", type: 'System' },

        // Group G. 운영 및 가용성
        'FindAuditFailure': { msg: "[N2SF-Log] 감사 로그 미비: 중요 시스템의 감사 로그 기록 설정이 비활성화되어 있습니다.", type: 'System' },
        'FindTimeSyncFailure': { msg: "[N2SF-Log] 시각 동기화 미비: 로그의 신뢰성을 위해 안전한 시각 동기화(NTP)가 필요합니다.", type: 'System' },
        'FindHardeningFailure': { msg: "[N2SF-AM-4] 보안 설정 미흡: 기본 패스워드 제거 등 OS Hardening 조치가 안 되어 있습니다.", type: 'System' },
        'FindRedundancyFailure': { msg: "[N2SF-IF-12] 이중화 미비: 가용성이 중요한 관문 장비는 이중화(HA) 구성이 필수입니다.", type: 'System' },
        'FindFailOpenRisk': { msg: "[N2SF-EB-11] Fail-Open 위험: 중요 보안 장비는 장애 시 차단(Fail-Secure) 모드로 동작해야 합니다.", type: 'System' },
        'FindDDoSRisk': { msg: "[N2SF-DDoS] DDoS 대응 미비: 인터넷 접점에는 DDoS 방어 장비가 필요합니다.", type: 'System' },
        'FindWeakSession': { msg: "[N2SF-SN-3] 세션 설정 미흡: 타임아웃 및 동시 접속 제한 등 세션 통제 정책을 강화하십시오.", type: 'System' },
        'FindPersistentRisk': { msg: "[N2SF-IN-14] 불필요한 지속 연결: 관리자/외부 연결 세션은 업무 종료 시 즉시 해제되어야 합니다.", type: 'Connection' },
        'FindResidualData': { msg: "[N2SF-IN-13] 잔존 데이터: 중요/공용 단말은 사용 후 데이터 완전 소거(Volatility) 대책이 필요합니다.", type: 'System' },
        'FindDNSViolation': { msg: "[N2SF-EB-14] 비인가 DNS: 내부망에서는 인가된 내부 DNS만 사용해야 합니다.", type: 'Connection' },
        'FindDevProdViolation': { msg: "[N2SF-SG-5] 개발/운영 혼재: 개발계와 운영계는 물리적/논리적으로 완전히 분리되어야 합니다.", type: 'System' },
        'FindOpaqueTraffic': { msg: "[N2SF-IF-2] 불투명 트래픽: 암호화된 트래픽의 내부를 검사할 수 있는 가시성(SSL Decryption 등) 확보가 필요합니다.", type: 'Connection' },

        // Logic
        'FindTransitiveLeaks': { msg: "[Logic] 전이적 데이터 유출: 다단계 경로를 통해 낮은 등급의 시스템으로 데이터가 흘러갈 수 있습니다.", type: 'SystemData' },
        'FindBypass': { msg: "[Logic] 우회 경로 발견: 보안 Gateway를 거치지 않고 내부망으로 연결되는 경로가 존재합니다.", type: 'Connection' }
    };

    // Regex to find fields in AnalysisResult
    const fieldRegex = /<field label="([^"]+)"[^>]*>([\s\S]*?)<\/field>/g;
    let fieldMatch;

    // Debug: Save XML to file
    try {
        fs.writeFileSync('debug_last_run.xml', xml);
        console.log('Saved XML to debug_last_run.xml');
    } catch (err) {
        console.error('Failed to save debug XML:', err);
    }

    // Debug: Log XML content length and first 500 chars
    console.log(`XML Content Length: ${xml.length}`);
    console.log(`XML Preview: ${xml.substring(0, 500)}`);

    while ((fieldMatch = fieldRegex.exec(xml)) !== null) {
        const fieldName = fieldMatch[1];
        const content = fieldMatch[2];
        console.log(`Found field: ${fieldName}`);

        if (threatConfig[fieldName]) {
            const config = threatConfig[fieldName];
            const tupleRegex = /<tuple>([\s\S]*?)<\/tuple>/g;
            let tupleMatch;

            while ((tupleMatch = tupleRegex.exec(content)) !== null) {
                const tupleContent = tupleMatch[1];
                // Allow optional whitespace before />
                const atomRegex = /<atom label="([^"]+)"\s*\/>/g;
                const atoms = [];
                let am;
                while ((am = atomRegex.exec(tupleContent)) !== null) {
                    atoms.push(cleanLabel(am[1]));
                }

                console.log(`Parsed atoms for ${fieldName}:`, atoms);

                // atoms[0] is usually AnalysisResult$0
                // Data starts from atoms[1]
                if (!atoms || atoms.length < 2) continue;

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

    // Helper: Cleanup Temp Files
    const cleanupTempFiles = (directory) => {
        try {
            if (!fs.existsSync(directory)) return;
            const files = fs.readdirSync(directory);
            files.forEach(file => {
                // Delete patterns: tmp*, *.cnf, *.tmp
                if (file.startsWith('tmp') || file.endsWith('.cnf') || file.endsWith('.tmp')) {
                    const fullPath = path.join(directory, file);
                    try {
                        fs.unlinkSync(fullPath);
                        console.log(`Cleaned up temp file: ${fullPath}`);
                    } catch (e) {
                        console.warn(`Failed to delete temp file ${fullPath}: ${e.message}`);
                    }
                }
            });
        } catch (err) {
            console.warn(`Error during cleanup of ${directory}: ${err.message}`);
        }
    };

    console.log(`Parsed Threats:`, JSON.stringify(threats, null, 2));

    // Cleanup 'alloy' directory
    const alloyDir = path.join(process.cwd(), 'alloy');
    cleanupTempFiles(alloyDir);

    return { threats, total_count };
}

module.exports = { executeAlloy };
