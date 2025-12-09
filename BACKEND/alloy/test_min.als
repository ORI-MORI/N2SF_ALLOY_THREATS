module test
open n2sf_base
one sig C extends Connection {}
fact { C.encQuality = NoEncryption }
run {}
