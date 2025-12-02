module user_instance
open n2sf_base
open n2sf_rules

// [Generator에 의해 아래와 같이 생성되어야 함]
/*
one sig [ZoneID] extends Location {}
fact { [ZoneID].grade = [Grade] and [ZoneID].type = [Type] }

one sig [DataID] extends Data {}
fact { [DataID].grade = [Grade] and [DataID].fileType = [Type] }

one sig [SysID] extends System {}
fact {
    [SysID].grade = [Grade]
    [SysID].loc = [LocationID]
    [SysID].type = [NodeType]
    [SysID].isolation = [IsolationType]
    [SysID].authType = [AuthType]
    [SysID].isCDS = [Bool]
    [SysID].isRegistered = [Bool]
    [SysID].hasMDM = [Bool]
    [SysID].isStorageEncrypted = [Bool]
    [SysID].isManagement = [Bool]
    [SysID].stores = [DataList]
}
// Connection도 동일 패턴...
*/

run {}