import os

def generate_mock_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    kb_dir = os.path.join(base_dir, "knowledge_base")
    
    # Create directories
    os.makedirs(kb_dir, exist_ok=True)
    
    # Document 1: SOP
    sop_content = """# MRPL Pipeline Maintenance Standard Operating Procedure (SOP)
Document ID: SOP-MRPL-402
Date Effective: January 15, 2026
Confidentiality: STRICTLY INTERNAL

## 1. Overview
This document outlines the standard operating procedure for the maintenance and replacement of High-Pressure (HP) steam valves in the primary distillation unit.

## 2. Safety Prerequisites
- All personnel must wear Class-3 protective gear.
- Ensure the pipeline is fully depressurized before any structural intervention.
- The master control room must issue an overriding digital permit (Permit Type: Hot Work / Pressure).

## 3. Procedure for Valve Replacement (Type A-403)
1. Isolate the valve section using upstream and downstream block valves.
2. Vent the trapped steam via the secondary bleeder line.
3. Loosen the flange bolts using a calibrated pneumatic wrench set to 150 Nm.
4. Remove the faulty valve and inspect the gasket seating area for erosion.
5. Install the new A-403 valve with a fresh graphite-coated spiral wound gasket.
6. Tighten bolts in a star pattern.
7. Conduct a pneumatic pressure test at 1.5x operating pressure before signing off.

## 4. Emergency Escalation
If a leak is detected during the pneumatic test, immediately trigger the Zone 2 evacuation alarm and notify the Shift In-Charge.
"""
    
    sop_path = os.path.join(kb_dir, "MRPL_Pipeline_Maintenance_SOP.md")
    with open(sop_path, "w") as f:
        f.write(sop_content)
        
    # Document 2: Inspection Report
    report_content = """# Q3 2026 Distillation Unit Inspection Report
Date of Inspection: August 25, 2026
Inspector: Ramesh K., Lead Integrity Engineer
Unit: Primary Distillation Unit #2 (PDU-2)

## Executive Summary
Routine Q3 inspection of PDU-2 was carried out using ultrasonic thickness gauging and visual inspection. The overall structural integrity of the unit is satisfactory, with one critical finding regarding a high-pressure steam valve.

## Detailed Findings
- **Heat Exchangers (HX-101 to HX-104):** No significant fouling detected. Thickness readings are within the 2mm corrosion allowance.
- **Piping Network (Line L-205):** Minor surface oxidation observed on the external insulation cladding. Recommended for painting in Q4.
- **Valves and Instrumentation:** 
  - Valve A-403 (HP Steam line) showed signs of micro-fissures on the upstream flange during dye-penetrant testing.
  - The acoustic emission sensor indicated a faint internal bypass leak when fully closed.

## Action Items
1. Schedule immediate replacement of Valve A-403 as per SOP-MRPL-402.
2. Order 2 units of A-403 valves from vendor (Larsen & Toubro Flow Control).
3. Draft an approval note for plant manager sign-off to initiate a 4-hour scheduled shutdown next Tuesday.
"""
    
    report_path = os.path.join(kb_dir, "Q3_2026_Inspection_Report.md")
    with open(report_path, "w") as f:
        f.write(report_content)
        
    print(f"Successfully generated mock knowledge base documents in: {kb_dir}")

if __name__ == "__main__":
    generate_mock_data()
