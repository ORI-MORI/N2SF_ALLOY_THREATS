module user_instance
open n2sf_rules

one sig Location1, Location2 extends Location {}
fact { Location1.id = 1 and Location1.grade = Open and Location1.type = Internet }
fact { Location2.id = 2 and Location2.grade = Sensitive and Location2.type = Internet }
fact { Location = Location1 + Location2 }

fact { no Data }

one sig System100, System101, System102 extends System {}
fact { 
    System100.id = 100 
    System100.location = Location1 
    System100.grade = Open 
    System100.type = Server 
    System100.isCDS = False 
    System100.isDeidentifier = False 
    System100.authType = Single 
    System100.isRegistered = False 
    System100.stores = none 
}
fact { 
    System101.id = 101 
    System101.location = Location2 
    System101.grade = Sensitive 
    System101.type = Terminal 
    System101.isCDS = False 
    System101.isDeidentifier = False 
    System101.authType = Single 
    System101.isRegistered = False 
    System101.stores = none 
}
fact { 
    System102.id = 102 
    System102.location = Location1 
    System102.grade = Open 
    System102.type = NetworkDevice 
    System102.isCDS = False 
    System102.isDeidentifier = False 
    System102.authType = Single 
    System102.isRegistered = False 
    System102.stores = none 
}
fact { System = System100 + System101 + System102 }

one sig Connection0 extends Connection {}
fact { 
    Connection0.from = System102 
    Connection0.to = System101 
    Connection0.carries = none 
    Connection0.protocol = HTTPS 
    Connection0.hasCDR = False 
    Connection0.hasAntiVirus = False 
}
fact { Connection = Connection0 }

// Run the check defined in n2sf_rules
run CheckViolations
