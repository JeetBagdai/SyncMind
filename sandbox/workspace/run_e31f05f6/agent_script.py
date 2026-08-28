# Import necessary library
import os

# Define the content for the summary
summary_content = """
Q3 2026 Distillation Unit Inspection Report Summary:

- **Executive Summary:** Routine Q3 inspection of Primary Distillation Unit #2 (PDU-2) was carried out using ultrasonic thickness gauging and visual inspection. The overall structural integrity of the unit is satisfactory, with one critical finding regarding a high-pressure steam valve.
- **Detailed Findings:**
  - **Heat Exchangers (HX-101 to HX-104):** No significant fouling detected. Thickness readings are within the 2mm corrosion allowance.
  - **Piping Network (Line L-205):** Minor surface oxidation observed on the external insulation cladding. Recommended for painting in Q4.
  - **Valves and Instrumentation:**
    - Valve A-403 (HP Steam line) showed signs of micro-fissures on the upstream flange during dye-penetrant testing.
    - The acoustic emission sensor indicated a faint internal bypass leak when fully closed.
- **Action Items:**
  1. Schedule immediate replacement of Valve A-403 as per SOP-MRPL-402.
  2. Order 2 units of A-403 valves from vendor (Larsen & Toubro).

"""

# Create the file 'Q3_Summary.txt' and write the summary content to it
with open('Q3_Summary.txt', 'w') as file:
    file.write(summary_content)

# Confirm the file has been created
os.path.exists('Q3_Summary.txt')