module user_instance

open n2sf_rules

one sig Location1 extends Location {}
fact {
    Location1.id = 1
    Location1.type = Internet
    Location1.grade = Open
}

one sig Data999 extends Data {}
fact {
    Data999.id = 999
    Data999.grade = Classified
}

one sig System99 extends System {}
fact {
    System99.id = 99
    System99.location = Location1
    System99.grade = Open
    System99.type = PC
    System99.authType = NoAuth
    System99.stores = Data999
}

fact {
    Location = Location1
    Data = Data999
    System = System99
    Connection = none
}

check NoStorageViolation
check NoTransmissionViolation
check NoLocationInappropriateness
check NoBypassConnection
check NoUnencryptedTransmission
check NoAuthIntegrityMissing
check NoContentControlMissing
