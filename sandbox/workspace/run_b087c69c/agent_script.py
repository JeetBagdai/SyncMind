import os

# Define the summary content
summary_content = f"""
### Q3 2026 Distillation Unit Inspection Report Summary

**Date of Inspection:** August 25, 2026
**Inspector:** Ramesh K., Lead Integrity Engineer
**Unit:** Primary Distillation Unit #2 (PDU-2)

#### Executive Summary
Routine Q3 inspection of PDU-2 was carried out using ultrasonic thickness gauging and visual inspection. The overall structural integrity of the unit is satisfactory, with one critical finding regarding a high-pressure steam valve.

#### Detailed Findings
- **Heat Exchangers (HX-101 to HX-104):** No significant fouling detected. Thickness readings are within the 2mm corrosion allowance.
- **Piping Network (Line L-205):** Minor surface oxidation observed on the external insulation cladding. Recommended for painting in Q4.
- **Valves and Instrumentation:**
  - Valve A-403 (HP Steam line) showed signs of micro-fissures on the upstream flange during dye-penetrant testing.
  - The acoustic emission sensor indicated a faint internal bypass leak when fully closed.

#### Action Items
1. Schedule immediate replacement of Valve A-403 as per SOP-MRPL-402.
2. Order 2 units of A-403 valves from vendor (Larsen & Toubro).

For more detailed information, please refer to the full Q3 2026 Distillation Unit Inspection Report and the MRPL Pipeline Maintenance Standard Operating Procedure (SOP).
"""

# Create the file and write the summary content
file_path = os.path.join(os.getcwd(), 'Q3_Summary.txt')
with open(file_path, 'w') as file:
    file.write(summary_content)

print(f"Summary written to {file_path}")
```

This Python script will create a file named 'Q3_Summary.txt' containing a professional summary of the Q3 2026 Distillation Unit Inspection Report findings. The file will be saved in the current working directory.