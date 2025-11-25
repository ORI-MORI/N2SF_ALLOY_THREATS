/* ============================================================
   [표준 템플릿 v2.0] N2SF 기관 현황 인스턴스 (Layer 4)
   * 변경사항: Core의 확장된 자산/데이터 속성 반영
   ============================================================ */
module Org_Instance

open N2SF_Model2_Catalog // [변경] 선택한 모델
open N2SF_Controls_DB    // 고정

/* ============================================================
   1. 자산(Asset) 정의 - [속성 추가됨]
   ============================================================ */
/* ============================================================
   1. 자산(Asset) 정의 - [속성 추가됨]
   ============================================================ */

one sig Obj_a25bbb4e_093f_4238_a620_31efdee452dc extends Asset {}
fact {
    Obj_a25bbb4e_093f_4238_a620_31efdee452dc.level = Open
    Obj_a25bbb4e_093f_4238_a620_31efdee452dc.zone = Internal
    Obj_a25bbb4e_093f_4238_a620_31efdee452dc.status = Secure
    Obj_a25bbb4e_093f_4238_a620_31efdee452dc.is_registered = True
    Obj_a25bbb4e_093f_4238_a620_31efdee452dc.has_agent = True
}

one sig Obj_936557f9_22e2_4bac_bb70_0089c5c2fbe1 extends Asset {}
fact {
    Obj_936557f9_22e2_4bac_bb70_0089c5c2fbe1.level = Open
    Obj_936557f9_22e2_4bac_bb70_0089c5c2fbe1.zone = External
    Obj_936557f9_22e2_4bac_bb70_0089c5c2fbe1.status = Secure
    Obj_936557f9_22e2_4bac_bb70_0089c5c2fbe1.is_registered = True
    Obj_936557f9_22e2_4bac_bb70_0089c5c2fbe1.has_agent = True
}

one sig Obj_bdd3e115_4b92_4020_90b7_c3351dba292b extends Asset {}
fact {
    Obj_bdd3e115_4b92_4020_90b7_c3351dba292b.level = Open
    Obj_bdd3e115_4b92_4020_90b7_c3351dba292b.zone = Internal
    Obj_bdd3e115_4b92_4020_90b7_c3351dba292b.status = Secure
    Obj_bdd3e115_4b92_4020_90b7_c3351dba292b.is_registered = True
    Obj_bdd3e115_4b92_4020_90b7_c3351dba292b.has_agent = True
}

one sig Obj_ec574fb4_87e7_494b_88dc_2a3c99172067 extends Asset {}
fact {
    Obj_ec574fb4_87e7_494b_88dc_2a3c99172067.level = Open
    Obj_ec574fb4_87e7_494b_88dc_2a3c99172067.zone = Internal
    Obj_ec574fb4_87e7_494b_88dc_2a3c99172067.status = Secure
    Obj_ec574fb4_87e7_494b_88dc_2a3c99172067.is_registered = True
    Obj_ec574fb4_87e7_494b_88dc_2a3c99172067.has_agent = True
}

one sig Obj_3e75b596_9c70_41b6_a2cf_a15899c254d3 extends Asset {}
fact {
    Obj_3e75b596_9c70_41b6_a2cf_a15899c254d3.level = Open
    Obj_3e75b596_9c70_41b6_a2cf_a15899c254d3.zone = Internal
    Obj_3e75b596_9c70_41b6_a2cf_a15899c254d3.status = Secure
    Obj_3e75b596_9c70_41b6_a2cf_a15899c254d3.is_registered = True
    Obj_3e75b596_9c70_41b6_a2cf_a15899c254d3.has_agent = True
}

one sig Obj_0d9909ea_1398_4898_be81_cf1c808324dc extends Asset {}
fact {
    Obj_0d9909ea_1398_4898_be81_cf1c808324dc.level = Open
    Obj_0d9909ea_1398_4898_be81_cf1c808324dc.zone = Internal
    Obj_0d9909ea_1398_4898_be81_cf1c808324dc.status = Secure
    Obj_0d9909ea_1398_4898_be81_cf1c808324dc.is_registered = True
    Obj_0d9909ea_1398_4898_be81_cf1c808324dc.has_agent = True
}

one sig Obj_b394f9f7_07ca_42bc_b616_ad77c6fbfcce extends Asset {}
fact {
    Obj_b394f9f7_07ca_42bc_b616_ad77c6fbfcce.level = Open
    Obj_b394f9f7_07ca_42bc_b616_ad77c6fbfcce.zone = Internal
    Obj_b394f9f7_07ca_42bc_b616_ad77c6fbfcce.status = Secure
    Obj_b394f9f7_07ca_42bc_b616_ad77c6fbfcce.is_registered = True
    Obj_b394f9f7_07ca_42bc_b616_ad77c6fbfcce.has_agent = True
}


/* ============================================================
   2. 데이터(Data) 정의 - [속성 추가됨]
   ============================================================ */

one sig Data_Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee extends Data {}
fact {
    Data_Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee.classification = Open
    Data_Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee.content = Clean
    Data_Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee.is_sanitized = True
}

one sig Data_Obj_86347588_6629_45e3_a441_09ca11bce894 extends Data {}
fact {
    Data_Obj_86347588_6629_45e3_a441_09ca11bce894.classification = Open
    Data_Obj_86347588_6629_45e3_a441_09ca11bce894.content = Clean
    Data_Obj_86347588_6629_45e3_a441_09ca11bce894.is_sanitized = True
}

one sig Data_Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72 extends Data {}
fact {
    Data_Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72.classification = Open
    Data_Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72.content = Clean
    Data_Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72.is_sanitized = True
}

one sig Data_Obj_75949d2c_0449_4a10_add3_07ac91a0c608 extends Data {}
fact {
    Data_Obj_75949d2c_0449_4a10_add3_07ac91a0c608.classification = Open
    Data_Obj_75949d2c_0449_4a10_add3_07ac91a0c608.content = Clean
    Data_Obj_75949d2c_0449_4a10_add3_07ac91a0c608.is_sanitized = True
}

one sig Data_Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107 extends Data {}
fact {
    Data_Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107.classification = Open
    Data_Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107.content = Clean
    Data_Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107.is_sanitized = True
}

one sig Data_Obj_c8c746d8_2a26_464e_8524_3350be8dcae5 extends Data {}
fact {
    Data_Obj_c8c746d8_2a26_464e_8524_3350be8dcae5.classification = Open
    Data_Obj_c8c746d8_2a26_464e_8524_3350be8dcae5.content = Clean
    Data_Obj_c8c746d8_2a26_464e_8524_3350be8dcae5.is_sanitized = True
}

one sig Data_Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42 extends Data {}
fact {
    Data_Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42.classification = Open
    Data_Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42.content = Clean
    Data_Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42.is_sanitized = True
}

one sig Data_Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b extends Data {}
fact {
    Data_Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b.classification = Open
    Data_Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b.content = Clean
    Data_Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b.is_sanitized = True
}

one sig Data_Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5 extends Data {}
fact {
    Data_Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5.classification = Open
    Data_Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5.content = Clean
    Data_Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5.is_sanitized = True
}

one sig Data_Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb extends Data {}
fact {
    Data_Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb.classification = Open
    Data_Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb.content = Clean
    Data_Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb.is_sanitized = True
}


/* ============================================================
   3. 흐름(Flow) 정의
   ============================================================ */

one sig Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee extends Flow {}
fact {
    Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee.from = Obj_b394f9f7_07ca_42bc_b616_ad77c6fbfcce
    Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee.to = Obj_0d9909ea_1398_4898_be81_cf1c808324dc
    Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee.data = Data_Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee
    Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee.via = none // Default to none for now, unless parsed
    Obj_56b56e8c_751d_4d8a_a9c7_6554c9f142ee.is_encrypted = True
}

one sig Obj_86347588_6629_45e3_a441_09ca11bce894 extends Flow {}
fact {
    Obj_86347588_6629_45e3_a441_09ca11bce894.from = Obj_0d9909ea_1398_4898_be81_cf1c808324dc
    Obj_86347588_6629_45e3_a441_09ca11bce894.to = Obj_ec574fb4_87e7_494b_88dc_2a3c99172067
    Obj_86347588_6629_45e3_a441_09ca11bce894.data = Data_Obj_86347588_6629_45e3_a441_09ca11bce894
    Obj_86347588_6629_45e3_a441_09ca11bce894.via = none // Default to none for now, unless parsed
    Obj_86347588_6629_45e3_a441_09ca11bce894.is_encrypted = False
}

one sig Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72 extends Flow {}
fact {
    Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72.from = Obj_ec574fb4_87e7_494b_88dc_2a3c99172067
    Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72.to = Obj_3e75b596_9c70_41b6_a2cf_a15899c254d3
    Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72.data = Data_Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72
    Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72.via = none // Default to none for now, unless parsed
    Obj_4bbf279c_49c7_436d_9afa_e94435e6ec72.is_encrypted = False
}

one sig Obj_75949d2c_0449_4a10_add3_07ac91a0c608 extends Flow {}
fact {
    Obj_75949d2c_0449_4a10_add3_07ac91a0c608.from = Obj_936557f9_22e2_4bac_bb70_0089c5c2fbe1
    Obj_75949d2c_0449_4a10_add3_07ac91a0c608.to = Obj_3e75b596_9c70_41b6_a2cf_a15899c254d3
    Obj_75949d2c_0449_4a10_add3_07ac91a0c608.data = Data_Obj_75949d2c_0449_4a10_add3_07ac91a0c608
    Obj_75949d2c_0449_4a10_add3_07ac91a0c608.via = none // Default to none for now, unless parsed
    Obj_75949d2c_0449_4a10_add3_07ac91a0c608.is_encrypted = False
}

one sig Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107 extends Flow {}
fact {
    Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107.from = Obj_0d9909ea_1398_4898_be81_cf1c808324dc
    Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107.to = Obj_b394f9f7_07ca_42bc_b616_ad77c6fbfcce
    Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107.data = Data_Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107
    Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107.via = none // Default to none for now, unless parsed
    Obj_1b1cf1eb_d9ac_463b_a9ae_d816c42e7107.is_encrypted = True
}

one sig Obj_c8c746d8_2a26_464e_8524_3350be8dcae5 extends Flow {}
fact {
    Obj_c8c746d8_2a26_464e_8524_3350be8dcae5.from = Obj_bdd3e115_4b92_4020_90b7_c3351dba292b
    Obj_c8c746d8_2a26_464e_8524_3350be8dcae5.to = Obj_0d9909ea_1398_4898_be81_cf1c808324dc
    Obj_c8c746d8_2a26_464e_8524_3350be8dcae5.data = Data_Obj_c8c746d8_2a26_464e_8524_3350be8dcae5
    Obj_c8c746d8_2a26_464e_8524_3350be8dcae5.via = none // Default to none for now, unless parsed
    Obj_c8c746d8_2a26_464e_8524_3350be8dcae5.is_encrypted = False
}

one sig Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42 extends Flow {}
fact {
    Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42.from = Obj_a25bbb4e_093f_4238_a620_31efdee452dc
    Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42.to = Obj_3e75b596_9c70_41b6_a2cf_a15899c254d3
    Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42.data = Data_Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42
    Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42.via = none // Default to none for now, unless parsed
    Obj_6cba52e8_0d26_481f_bcc1_dbf0b66d8b42.is_encrypted = False
}

one sig Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b extends Flow {}
fact {
    Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b.from = Obj_0d9909ea_1398_4898_be81_cf1c808324dc
    Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b.to = Obj_936557f9_22e2_4bac_bb70_0089c5c2fbe1
    Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b.data = Data_Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b
    Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b.via = none // Default to none for now, unless parsed
    Obj_2fd00bd2_c603_4d72_a12f_c20a3a1ba77b.is_encrypted = True
}

one sig Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5 extends Flow {}
fact {
    Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5.from = Obj_936557f9_22e2_4bac_bb70_0089c5c2fbe1
    Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5.to = Obj_0d9909ea_1398_4898_be81_cf1c808324dc
    Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5.data = Data_Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5
    Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5.via = none // Default to none for now, unless parsed
    Obj_d117ddba_2508_45ce_b9ea_fb9df56a79e5.is_encrypted = True
}

one sig Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb extends Flow {}
fact {
    Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb.from = Obj_3e75b596_9c70_41b6_a2cf_a15899c254d3
    Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb.to = Obj_936557f9_22e2_4bac_bb70_0089c5c2fbe1
    Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb.data = Data_Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb
    Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb.via = none // Default to none for now, unless parsed
    Obj_015880b7_fb7a_4fe3_b729_fbd40bd7afcb.is_encrypted = False
}



/* ============================================================
   4. 구현 현황 (Implementation)
   ============================================================ */
fact Define_Org_Security {
    Org_Implementation.implemented = 
        // [템플릿] N2SF_XX_1 + N2SF_XX_2
        none
        
    Org_Implementation.exceptions = none
}

/* ============================================================
   5. 검증 (Verification)
   ============================================================ */
assert Policy_Compliance {
    Check_Security_Pass
}
check Policy_Compliance for 3
