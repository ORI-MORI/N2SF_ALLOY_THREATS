module n2sf_rules

open n2sf_base

// ============================================================
// Group A: Structural Threats
// ============================================================

// 1. Storage Violation
// A system stores data that has a higher grade than the system's clearance.
pred StorageViolation[s: System, d: Data] {
    d in s.stores
    gt[d.grade, s.grade]
}

// 2. Transmission Violation
// A connection carries data to a destination with a lower grade than the data,
// UNLESS the destination is a CDS or Gateway (Exception).
pred TransmissionViolation[c: Connection, d: Data] {
    d in c.carries
    gt[d.grade, c.to.grade]
    // Exception: Allow if destination is CDS or Gateway
    not (c.to.type in CDS + Gateway)
}

// 3. Location Inappropriateness
// A system is located in a zone (Location) that has a lower grade than the system's grade.
// (e.g., A Classified System placed in an Open/Internet Zone)
pred LocationInappropriateness[s: System] {
    gt[s.grade, s.location.grade]
}

// 4. Bypass Connection (Gateway/CDS Bypass)
// A connection exists between different security zones (Locations) 
// without passing through a Gateway or CDS.
// We define "passing through" as the destination being a Gateway/CDS if the locations differ.
// If direct connection between different locations and neither end is a Gateway/CDS, it's a bypass.
pred BypassConnection[c: Connection] {
    c.from.location != c.to.location
    not (c.from.type in Gateway + CDS)
    not (c.to.type in Gateway + CDS)
}

// ============================================================
// Group B: Attribute Threats
// ============================================================

// 5. Unencrypted Transmission
// Sensitive or Classified data is transmitted without encryption.
pred UnencryptedTransmission[c: Connection, d: Data] {
    d in c.carries
    d.grade in Sensitive + Classified
    c.isEncrypted = False
}

// 6. Auth/Integrity Missing
// A system stores Sensitive or Classified data but has weak authentication (NoAuth).
pred AuthIntegrityMissing[s: System] {
    (some d: s.stores | d.grade in Sensitive + Classified)
    s.authType = NoAuth
}

// 7. Content Control Missing (CDR/AV)
// A connection carries data (file transfer) but lacks Content Disarm & Reconstruction (CDR) or Anti-Virus.
// We assume all data transfer requires inspection in this strict model, or specifically for external/cross-domain.
// For now, if it carries data and hasCDR is False, it's a violation.
// Refinement: Maybe only for Sensitive/Classified or Cross-Zone?
// Let's apply it generally for now as "Content Control Missing" implies the capability is absent where needed.
// To be precise: If connection carries data and hasCDR is False.
pred ContentControlMissing[c: Connection] {
    some c.carries
    c.hasCDR = False
}

// ============================================================
// Verification Asserts (7 Detection Engines)
// ============================================================

assert NoStorageViolation {
    no s: System, d: Data | StorageViolation[s, d]
}

assert NoTransmissionViolation {
    no c: Connection, d: Data | TransmissionViolation[c, d]
}

assert NoLocationInappropriateness {
    no s: System | LocationInappropriateness[s]
}

assert NoBypassConnection {
    no c: Connection | BypassConnection[c]
}

assert NoUnencryptedTransmission {
    no c: Connection, d: Data | UnencryptedTransmission[c, d]
}

assert NoAuthIntegrityMissing {
    no s: System | AuthIntegrityMissing[s]
}

assert NoContentControlMissing {
    no c: Connection | ContentControlMissing[c]
}

// ============================================================
// Execution Commands
// ============================================================

check NoStorageViolation
check NoTransmissionViolation
check NoLocationInappropriateness
check NoBypassConnection
check NoUnencryptedTransmission
check NoAuthIntegrityMissing
check NoContentControlMissing
