module n2sf_rules
open n2sf_base

// ============================================================
// Group A. 구조 및 흐름 위협 (Structure & Flow)
// ============================================================

// 1. 망 분리 우회 (Split Tunneling) [N2SF-EB-4]
// 인터넷과 업무망에 '동시' 연결된 단말 탐지
// 1. 망 분리 우회 (Split Tunneling) [N2SF-EB-4]
// 인터넷과 업무망에 '동시' 연결된 단말 탐지
fun FindSplitTunneling: System {
    { s: System |
      s.physicalLoc.type = Internet
      and (Intranet in s.connectedZones.type)
      and (some c: Connection | c.from = s and c.to.physicalLoc.type = Internet and c.connType = FileTransfer)
    }
}

// 2. 망 간 직접 연결 위반 (Direct Connection Violation) [N2SF-EB-5]
// 서로 다른 보안 구역 간 통신은 반드시 Gateway를 경유해야 함
fun FindDirectConnection: Connection {
    { c: Connection |
      c.from.physicalLoc.type != c.to.physicalLoc.type
      and c.from.deviceType != Gateway
      and c.to.deviceType != Gateway
    }
}

// 3. 등급 간 자료 전송 위반 (Flow Control) [N2SF-IF-5, IF-14]
// CDS 없이 하위 등급으로 파일 전송 금지, 기밀 정보는 일방향(OneWay) 필수
fun FindFlowViolations: Connection -> Data {
    { c: Connection, d: Data |
      d in c.carries and c.connType = FileTransfer
      and lt[c.to.grade, d.grade]
      and (
          c.from.cdsType = NotCDS
          or (d.grade = Classified and c.from.cdsType != OneWay_Out)
      )
    }
}

// ============================================================
// Group B. 데이터 및 암호화 위협 (Data Security)
// ============================================================

// 4. 기밀 데이터 저장 위반 (Storage Violation) [N2SF 본문]
// MLS 장비가 아닌데 상위 등급 데이터를 저장하면 위반
fun FindStorageViolations: System -> Data {
    { s: System, d: Data |
      d in s.stores
      and (
          (s.cdsType != MLS_CDS and lt[s.grade, d.grade])
          or (s.cdsType = MLS_CDS and !(d.grade in s.supportedGrades))
      )
    }
}

// 5. 암호화 품질 미비 (Weak Crypto) [N2SF-EA-1]
// 외부/무선 구간 전송 시 검증필 암호모듈(Validated) 필수
fun FindWeakCrypto: Connection {
    { c: Connection |
      (c.from.physicalLoc.type in Internet + Wireless or c.to.physicalLoc.type in Internet + Wireless)
      and c.encQuality in NoEncryption + Weak_Algo
    }
}

// 6. 전송 무결성 미비 (Integrity Loss) [N2SF-DT-6]
// 중요 정보 전송 시 위변조 방지(HMAC/Sig) 필수
fun FindIntegrityLoss: Connection {
    { c: Connection |
      (some d: c.carries | d.grade in Sensitive + Classified)
      and c.integrityStatus = NoIntegrity
    }
}

// 7. 암호 키 보관 위반 (Insecure Key) [N2SF-EK-3]
// S등급 이상 데이터 저장 시 키는 HSM 등에 분리 보관
fun FindInsecureKey: System {
    { s: System |
      (some d: s.stores | d.grade in Sensitive + Classified)
      and s.keyMgmt in Local_Storage + NoKey
    }
}

// ============================================================
// Group C. 접근 통제 및 인증 (Access & Auth)
// ============================================================

// 8. 인증 강도 위반 (Weak Auth) [N2SF-MA-1, RA-3]
// 관리자/원격 접속은 MFA 필수
fun FindWeakAuth: System {
    { s: System |
      (s.isManagementDevice = 1 or s.physicalLoc.type in Internet + Cloud)
      and s.authMechanism = Single_Factor
    }
}

// 9. 관리 포트 노출 (Exposed Admin Port) [N2SF-EB-8]
// 관리 포트는 관리망/관리장비에서만 접근 가능
fun FindExposedAdmin: Connection {
    { c: Connection |
      c.targetPortType = ManagementPort
      and (c.from.isManagementDevice = 0 and c.from.physicalLoc.type != ManagementZone)
    }
}

// 10. 상시적 원격 관리 (Permanent Remote Access) [N2SF-LP-4(1)]
// 외부 원격 관리는 '한시적'으로만 허용
fun FindPermanentAdmin: Connection {
    { c: Connection |
      c.isAdminTraffic = 1 and c.from.physicalLoc.type = Internet and c.accessPolicy = Permanent
    }
}

// ============================================================
// Group D. 자산 및 무결성 (Asset Integrity)
// ============================================================

// 11. 자산 미등록 (Shadow IT) [N2SF-DV-M1]
fun FindShadowIT: System { { s: System | s.isRegistered = 0 and #s.connectedZones > 0 } }

// 12. 시스템 무결성 위반 (Integrity Failure) [N2SF-DV-1, IN-15]
// S/C 등급 시스템은 TPM 및 SW 서명 검증 필수
fun FindIntegrityFailure: System {
    { s: System |
      s.grade in Sensitive + Classified
      and (s.hasHwIntegrity = 0 or s.hasSwIntegrity = 0)
    }
}

// 13. 취약한 시스템 노출 (Unpatched Exposure) [N2SF-IN-1]
// 패치 안 된 시스템이 외부 접점에 있으면 위협
fun FindUnpatchedExposure: System {
    { s: System |
      s.patchStatus = Vulnerable
      and (s.physicalLoc.type in Internet + DMZ + Cloud)
    }
}

// 14. EOL 자산 사용 (EOL Risk) [N2SF-IN-9]
fun FindEOL: System { { s: System | s.grade in Sensitive + Classified and s.lifeCycle = EOL } }

// 15. 미인증 보안 제품 (Uncertified Gear) [부록2 모델 9]
// 보안 장비는 CC인증 등 필수
fun FindUncertifiedGear: System {
    { s: System |
      (s.deviceType in SecurityGear + Gateway or s.cdsType != NotCDS)
      and s.isCertified = 0
    }
}

// ============================================================
// Group E. 물리 및 환경 보안 (Physical & Env)
// ============================================================

// 16. 무선망 WIPS 미비 (Wireless Threat) [N2SF 모델 10]
fun FindWirelessThreat: System {
    { s: System |
      (s.hasWirelessInterface = 1 or s.physicalLoc.type = Wireless)
      and s.physicalLoc.wipsStatus = NoProtection
    }
}

// 17. 물리적 포트 미통제 (Port Risk) [N2SF-DV-3]
fun FindPortRisk: System {
    { s: System |
      (some d: s.stores | d.grade in Sensitive + Classified)
      and s.hasPhysicalPortControl = 0 and s.serviceModel = OnPremise
    }
}

// 18. 모바일 격리 미비 (Mobile Risk) [N2SF-MD-5]
fun FindMobileRisk: System {
    { s: System | s.deviceType = Mobile and (some d: s.stores | d.grade in Sensitive + Classified) and s.hasContainer = 0 }
}

// ============================================================
// Group F. 콘텐츠 및 신기술 위협 (Content & New Tech)
// ============================================================

// 19. 콘텐츠 무해화 미비 (Missing CDR) [N2SF-CD-6]
// 망 간 파일 전송 시 CDR 필수
fun FindMissingCDR: Connection {
    { c: Connection |
      c.connType = FileTransfer and c.from.physicalLoc != c.to.physicalLoc
      and c.hasCDR = 0
    }
}

// 20. 파일 포맷 검증 미비 (Format Risk) [N2SF 모델 11]
fun FindFormatRisk: Connection {
    { c: Connection |
      c.connType = FileTransfer and c.from.physicalLoc != c.to.physicalLoc
      and !(FormatCheck in c.inspections)
    }
}

// 21. 정보 유출 필터링 미비 (DLP Failure) [N2SF-IF-6]
fun FindDLPFailure: Connection {
    { c: Connection |
      (some d: c.carries | d.grade in Sensitive + Classified)
      and c.to.physicalLoc.type in Internet + Cloud
      and c.hasContentFilter = 0
    }
}

// 22. AI 필터링 미비 (AI Filter Gap) [N2SF 모델 2, 5]
fun FindAIFilterFailure: Connection {
    { c: Connection |
      c.to.serviceModel in SaaS + PaaS
      and c.to.physicalLoc.type in Internet + Cloud
      and !(AI_Filter in c.inspections)
    }
}

// 23. 개인정보 유출 위협 (PII Leakage) [N2SF-EB-M1]
fun FindPIILeakage: Connection {
    { c: Connection |
      (some d: c.carries | d.dataType = PII)
      and c.to.physicalLoc.type in Internet + Cloud
      and !(DeIdentification in c.inspections)
    }
}

// 24. 인터넷 접속 격리 미비 (Browser Isolation Failure) [N2SF 모델 1, 4]
fun FindBrowserIsolation: Connection {
    { c: Connection |
      c.from.grade = Sensitive and c.to.physicalLoc.type = Internet
      and c.isolationMethod = Direct_Browser
    }
}

// 25. 클라우드/가상화 격리 미비 (Virt Risk) [N2SF-IS-5, 모델 3]
fun FindVirtRisk: System {
    { s: System |
      (some d: s.stores | d.grade in Sensitive + Classified)
      and (
          (s.serviceModel in OnPremise + IaaS and s.virtStatus = Virtual_Insecure)
          or (s.serviceModel in SaaS + PaaS and s.tenantIsolation = Shared_Unsafe)
      )
    }
}

// ============================================================
// Group G. 운영 및 가용성 (Ops & Availability)
// ============================================================

// 26. 감사 로그 미비 (Audit Failure) [공통]
fun FindAuditFailure: System { { s: System | s.grade in Sensitive + Classified and s.hasAuditLogging = 0 } }

// 27. 시각 동기화 미비 (Time Sync Failure) [공통]
fun FindTimeSyncFailure: System { { s: System | s.hasAuditLogging = 1 and s.hasSecureClock = 0 } }

// 28. 보안 설정 강화 미흡 (Hardening Failure) [N2SF-AM-4]
fun FindHardeningFailure: System {
    { s: System | (some d: s.stores | d.grade in Sensitive + Classified) and s.isHardened = 0 }
}

// 29. 이중화 미비 (Redundancy Failure) [N2SF-IF-12]
// 기밀망 접점 장비는 SPOF 방지 필수
fun FindRedundancyFailure: System {
    { s: System | s.grade = Classified and s.deviceType = Gateway and s.isRedundant = 0 }
}

// 30. 장애 시 보안 무력화 (Fail-Open Risk) [N2SF-EB-11]
// 장애 시 Fail-Secure(차단)여야 함
fun FindFailOpenRisk: System {
    { s: System |
      (s.deviceType in SecurityGear + Gateway or s.cdsType != NotCDS)
      and s.grade in Sensitive + Classified
      and s.failureMode = Fail_Open
    }
}

// 31. DDoS 방어 미비 (DDoS Risk) [N2SF 모델 10]
fun FindDDoSRisk: System {
    { s: System |
      s.deviceType = Gateway and s.physicalLoc.type in Internet + Cloud
      and s.hasDDoSProtection = 0
    }
}

// 32. 세션 정책 미비 (Session Policy) [N2SF-SN-3]
fun FindWeakSession: System {
    { s: System | s.grade in Sensitive + Classified and s.sessionPolicy != Strict_Timeout_Concurrency }
}

// 33. 불필요한 지속 연결 (Persistent Conn) [N2SF-IN-14]
fun FindPersistentRisk: Connection {
    { c: Connection | (c.isAdminTraffic = 1 or c.from.physicalLoc.type in Internet) and c.duration = Persistent }
}

// 34. 잔존 데이터 위협 (Residual Data) [N2SF-IN-13]
fun FindResidualData: System {
    { s: System | (s.cdsType = Access_CDS or s.deviceType = Mobile) and (s.grade in Sensitive + Classified) and s.dataVolatility = Persistent_Disk }
}

// 35. 외부 DNS 직연결 (DNS Bypass) [N2SF-EB-14]
fun FindDNSViolation: Connection {
    { c: Connection | c.protocol = DNS and c.from.physicalLoc.type = Intranet and c.to.physicalLoc.type = Internet and c.to.deviceType != DNS_Server }
}

// 36. 개발/운영 혼재 (Dev/Prod Mix) [N2SF-SG-5]
fun FindDevProdViolation: System {
    { s: System | s.physicalLoc.type = DevTestZone and ((some z: s.connectedZones | z.type = Intranet) or (some d: s.stores | d.grade in Sensitive + Classified)) }
}

// 37. 불투명한 암호화 트래픽 (Opaque Traffic) [N2SF-IF-2]
// 암호화되었으나 검사 불가한 트래픽은 악성코드 통로
fun FindOpaqueTraffic: Connection {
    { c: Connection | c.from.physicalLoc.type in Internet and c.to.physicalLoc.type = Intranet and c.encQuality = Opaque_Traffic }
}

// 38. 다단계 데이터 세탁 (Transitive Leak) [논리적 추론]
// A(기밀) -> B(중계) -> C(공개) 흐름 탐지
fun insecureLink: System -> System {
    { s1, s2: System | some c: Connection | c.from = s1 and c.to = s2 and s1.cdsType = NotCDS }
}
fun FindTransitiveLeaks: System -> Data {
    { s: System, d: Data | d in s.stores and some dest: s.^insecureLink | lt[dest.grade, d.grade] }
}

// 39. 우회 경로 탐지 (Bypass Detection)
// Gateway를 통하지 않는 모든 외부 연결
fun FindBypass: Connection {
    { c: Connection | 
      c.from.physicalLoc.type in Internet 
      and c.to.physicalLoc.type = Intranet 
      and c.to.deviceType != Gateway 
      and c.from.deviceType != Gateway 
    }
}

run {}