module user_instance_real
open n2sf_base
open n2sf_rules


// ============================================================
// [GENERATED CONTENT START]
// ============================================================

one sig LocationInternet_Zone extends Location {}
fact { LocationInternet_Zone.grade = Open and LocationInternet_Zone.type = Internet }

one sig LocationInternal_Zone extends Location {}
fact { LocationInternal_Zone.grade = Sensitive and LocationInternal_Zone.type = Intranet }

one sig DataSensitive_Data extends Data {}
fact { DataSensitive_Data.grade = Sensitive and DataSensitive_Data.fileType = Document }

one sig SystemHacker_Mobile extends System {}
fact {
    SystemHacker_Mobile.grade = Open
    SystemHacker_Mobile.loc = LocationInternet_Zone
    SystemHacker_Mobile.type = Mobile
    SystemHacker_Mobile.authType = Single
    SystemHacker_Mobile.isCDS = False
    SystemHacker_Mobile.isRegistered = True
    SystemHacker_Mobile.isStorageEncrypted = True
    SystemHacker_Mobile.isManagement = False
    SystemHacker_Mobile.isolation = None
    SystemHacker_Mobile.hasMDM = False
    SystemHacker_Mobile.stores = none
}

one sig SystemAdmin_Server extends System {}
fact {
    SystemAdmin_Server.grade = Sensitive
    SystemAdmin_Server.loc = LocationInternal_Zone
    SystemAdmin_Server.type = Server
    SystemAdmin_Server.authType = MFA
    SystemAdmin_Server.isCDS = False
    SystemAdmin_Server.isRegistered = True
    SystemAdmin_Server.isStorageEncrypted = True
    SystemAdmin_Server.isManagement = True
    SystemAdmin_Server.isolation = None
    SystemAdmin_Server.hasMDM = False
    SystemAdmin_Server.stores = DataSensitive_Data
}

one sig ConnectionAttack_Conn extends Connection {}
fact {
    ConnectionAttack_Conn.from = SystemHacker_Mobile
    ConnectionAttack_Conn.to = SystemAdmin_Server
    ConnectionAttack_Conn.carries = DataSensitive_Data
    ConnectionAttack_Conn.protocol = HTTPS
    ConnectionAttack_Conn.isEncrypted = True
    ConnectionAttack_Conn.hasCDR = True
    ConnectionAttack_Conn.hasDLP = False
    ConnectionAttack_Conn.hasAntiVirus = True
}

// ============================================================
// [GENERATED] 결과 집합 (Analysis Result)
// ============================================================

one sig AnalysisResult {
    FindStorageViolations: set System -> Data,
    FindFlowViolations: set Connection -> Data,
    FindLocationViolations: set System,
    FindBypassViolations: set Connection,
    FindUnencryptedChannels: set Connection,
    FindAuthIntegrityGaps: set System,
    FindContentControlFailures: set Connection -> Data,
    FindUnencryptedStorage: set System -> Data,
    FindAdminAccessViolation: set Connection
}

fact DefineAnalysisResult {
    AnalysisResult.FindStorageViolations = FindStorageViolations
    AnalysisResult.FindFlowViolations = FindFlowViolations
    AnalysisResult.FindLocationViolations = FindLocationViolations
    AnalysisResult.FindBypassViolations = FindBypassViolations
    AnalysisResult.FindUnencryptedChannels = FindUnencryptedChannels
    AnalysisResult.FindAuthIntegrityGaps = FindAuthIntegrityGaps
    AnalysisResult.FindContentControlFailures = FindContentControlFailures
    AnalysisResult.FindUnencryptedStorage = FindUnencryptedStorage
    AnalysisResult.FindAdminAccessViolation = FindAdminAccessViolation
}



run {}