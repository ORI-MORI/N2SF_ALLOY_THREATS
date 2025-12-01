module n2sf_rules

/* ==========================================================================
   [N2SF Rules Module - Full Spec Implementation]
   - Defines Enums: Grade, ZoneType, NodeType, AuthType, Protocol, FileType
   - Defines Signatures: Location, System, Connection, Data
   - Implements 7 Detection Engines
   ========================================================================== */

// 1. Enums & Hierarchy

enum Grade { Classified, Sensitive, Open } // C > S > O
enum ZoneType { Internet, Intranet, DMZ, Wireless }
enum NodeType { Terminal, Server, SecurityDevice, NetworkDevice }
enum AuthType { Single, MFA }
enum Protocol { HTTPS, SSH, VPN, ClearText }
enum FileType { Document, Executable, Media }
enum Bool { True, False }

// 2. Signatures

sig Location {
    id: one Int,
    grade: one Grade,
    type: one ZoneType
}

sig Data {
    id: one Int,
    grade: one Grade,
    fileType: one FileType
}

sig System {
    id: one Int,
    location: one Location,
    grade: one Grade, // Inherited or explicit
    type: one NodeType,
    isCDS: one Bool,
    isDeidentifier: one Bool, // Kept for future extensibility, though not in main spec
    authType: one AuthType,
    isRegistered: one Bool,
    stores: set Data
}

sig Connection {
    from: one System,
    to: one System,
    carries: set Data,
    protocol: one Protocol,
    hasCDR: one Bool,
    hasAntiVirus: one Bool // Kept for completeness
}

// 3. Helper Functions

// [Grade Comparison]
// Returns true if g1 is strictly greater than g2 (Higher Security)
// [Grade Comparison]
// Returns true if g1 is strictly greater than g2 (Higher Security)
pred gradeGt[g1, g2: Grade] {
    (g1 = Classified and (g2 = Sensitive or g2 = Open)) or
    (g1 = Sensitive and g2 = Open)
}

// [Transitive Reachability with CDS Stop]
// Returns the set of Systems reachable from 'start', stopping at CDS.
fun reachable[start: System]: set System {
    start.^({ s1, s2: System | 
        some c: Connection | 
            c.from = s1 and c.to = s2 and 
            (s1.isCDS = False) 
    })
}

// 4. Detection Engines (7 Core Rules)

// [Engine 1] FindStorageViolations (Information Storage Principle)
// System Grade < Data Grade
fun FindStorageViolations: set System -> Data {
    { s: System, d: Data |
        d in s.stores and
        gradeGt[d.grade, s.grade]
    }
}

// [Engine 2] FindFlowViolations (Information Movement Principle)
// Target System Grade < Data Grade (Transitive, CDS Exception)
fun FindFlowViolations: set Connection -> Data {
    { c: Connection, d: Data |
        d in c.carries and
        some target: reachable[c.from] | {
            (target = c.to or target in reachable[c.to]) and
            gradeGt[d.grade, target.grade] and
            // CDS Exception is handled by 'reachable' stopping at CDS.
            // If path goes through CDS, 'target' beyond CDS won't be in reachable set from c.from
            // UNLESS we need to check the specific link *into* the CDS?
            // Spec says: "passing through CDS is considered controlled".
            // So if A -> CDS -> B, and A > B.
            // A->CDS link: CDS is target. If CDS grade >= Data grade, OK.
            // CDS->B link: CDS is source. CDS stops reachability from A.
            // So we just need to check if *any reachable target* has lower grade.
            true
        }
    }
}

// [Engine 3] FindLocationViolations (Location Principle)
// Zone Grade < System Grade
// (System cannot exist in a location with lower security grade)
fun FindLocationViolations: set System {
    { s: System |
        gradeGt[s.grade, s.location.grade]
    }
}

// [Engine 4] FindBypassViolations (Bypass Connection)
// Internet Zone -> Intranet Zone without CDS
fun FindBypassViolations: set Connection {
    { c: Connection |
        c.from.location.type = Internet and
        c.to.location.type = Intranet and
        c.from.isCDS = False and // Source is not CDS
        c.to.isCDS = False       // Destination is not CDS (if dest is CDS, it's a valid gateway)
        // Note: Strict interpretation might require checking the *path*, but spec says "connection"
        // If it's a direct connection, this covers it.
        // If it's multi-hop, the transitive closure in Flow might cover data, 
        // but this specific rule targets the *existence* of a path.
        // For now, we check direct connections as per "Edge" definition in spec.
    }
}

// [Engine 5] FindUnencryptedChannels (Encryption)
// Internet or Wireless Zone + ClearText Protocol
fun FindUnencryptedChannels: set Connection {
    { c: Connection |
        (c.from.location.type = Internet or c.from.location.type = Wireless or
         c.to.location.type = Internet or c.to.location.type = Wireless) and
        c.protocol = ClearText
    }
}

// [Engine 6] FindAuthIntegrityGaps (Auth/Integrity)
// Sensitive+ System AND (Single Auth OR Unregistered)
fun FindAuthIntegrityGaps: set System {
    { s: System |
        (s.grade = Sensitive or s.grade = Classified) and
        (s.authType = Single or s.isRegistered = False)
    }
}

// [Engine 7] FindContentControlFailures (Content Control)
// Document Data AND Zone Change AND No CDR
fun FindContentControlFailures: set Connection -> Data {
    { c: Connection, d: Data |
        d in c.carries and
        d.fileType = Document and
        c.from.location != c.to.location and
        c.hasCDR = False
    }
}

// 5. Analysis Result

one sig AnalysisResult {
    FindStorageViolations: set System -> Data,
    FindFlowViolations: set Connection -> Data,
    FindLocationViolations: set System,
    FindBypassViolations: set Connection,
    FindUnencryptedChannels: set Connection,
    FindAuthIntegrityGaps: set System,
    FindContentControlFailures: set Connection -> Data
}

fact DefineAnalysisResult {
    AnalysisResult.FindStorageViolations = FindStorageViolations
    AnalysisResult.FindFlowViolations = FindFlowViolations
    AnalysisResult.FindLocationViolations = FindLocationViolations
    AnalysisResult.FindBypassViolations = FindBypassViolations
    AnalysisResult.FindUnencryptedChannels = FindUnencryptedChannels
    AnalysisResult.FindAuthIntegrityGaps = FindAuthIntegrityGaps
    AnalysisResult.FindContentControlFailures = FindContentControlFailures
}

run CheckViolations { some AnalysisResult }
