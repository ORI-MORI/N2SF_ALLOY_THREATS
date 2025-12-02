module n2sf_base

// 1. 보안 등급 정의 (순서: 공개 < 민감 < 기밀)
open util/ordering[Grade]
enum Grade { Open, Sensitive, Classified }

// 2. 각종 열거형(Enum) 정의
// [ZoneType] PPP(민관협력), Cloud 추가
enum ZoneType { Internet, Intranet, DMZ, Wireless, PPP, Cloud } 

// [NodeType] Mobile, WirelessAP, SaaS 추가
enum NodeType { Terminal, Server, SecurityDevice, NetworkDevice, Mobile, WirelessAP, SaaS }

// [IsolationType] 논리적 망분리용 (VDI, RBI)
enum IsolationType { None, VDI, RBI }

enum AuthType { Single, MFA }
enum Protocol { HTTPS, SSH, VPN_Tunnel, ClearText, SQL }
enum FileType { Document, Executable, Media }
enum Boolean { True, False }

// 3. 위치 (Location/망 영역)
// 3. 위치 (Location/망 영역)
abstract sig Location {
    grade: Grade,
    type: ZoneType
}

// 4. 업무 정보 (Data)
// 4. 업무 정보 (Data)
abstract sig Data {
    grade: Grade,
    fileType: FileType
}

// 5. 정보시스템 (System - 주체/객체)
// 5. 정보시스템 (System - 주체/객체)
abstract sig System {
    grade: Grade,
    loc: Location,
    type: NodeType,
    
    // [보안 속성]
    isolation: IsolationType,   // 망분리 방식 (None/VDI/RBI)
    authType: AuthType,         // 인증 방식 (Single/MFA)
    
    // [기능/상태 플래그]
    isCDS: Boolean,             // 연계체계(망연계) 여부
    isRegistered: Boolean,      // 자산 등록 여부
    hasMDM: Boolean,            // 모바일 단말 관리(MDM) 여부
    isStorageEncrypted: Boolean,// 저장 데이터 암호화 여부 (NEW)
    isManagement: Boolean,      // 관리자 전용 단말/포트 여부 (NEW)
    
    stores: set Data            // 저장 중인 데이터
}

// 6. 연결 (Connection - 데이터 흐름)
// 6. 연결 (Connection - 데이터 흐름)
abstract sig Connection {
    from: System,
    to: System,
    carries: set Data,          // 운반 데이터
    
    // [전송 보안 속성]
    protocol: Protocol,
    isEncrypted: Boolean,
    hasCDR: Boolean,            // 무해화 (악성코드 유입 방지)
    hasDLP: Boolean,            // 정보 유출 방지 (NEW)
    hasAntiVirus: Boolean       // 백신 검사
}