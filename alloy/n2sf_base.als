module n2sf_base

open util/ordering[Grade]

// 1. Grade Definition (Ordering: Open < Sensitive < Classified)
abstract sig Grade {}
one sig Open, Sensitive, Classified extends Grade {}

// 2. Location (Network Zones)
enum LocationType { Internet, Intranet, DMZ }
abstract sig Location {
    id: one Int,
    type: one LocationType,
    grade: one Grade // The security level of the zone itself
}

// 3. Data (Information Assets)
abstract sig Data {
    id: one Int,
    grade: one Grade
}

// 4. System (Assets: Server, PC, Gateway, etc.)
enum SystemType { Server, PC, Gateway, CDS }
enum AuthType { NoAuth, ID_PW, MFA }

abstract sig System {
    id: one Int,
    location: one Location,
    grade: one Grade, // The security clearance of the system
    type: one SystemType,
    authType: one AuthType,
    stores: set Data
}

// 5. Connection (Network Links)
enum Protocol { HTTP, HTTPS, SSH, FTP, SFTP, TCP, UDP }
enum Bool { True, False }

abstract sig Connection {
    from: one System,
    to: one System,
    carries: set Data, // Trace which data is flowing
    protocol: one Protocol,
    isEncrypted: one Bool,
    hasCDR: one Bool
}
