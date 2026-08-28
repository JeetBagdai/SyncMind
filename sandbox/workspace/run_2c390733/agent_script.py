# Import necessary library
import docx

# Create a new Word document
doc = docx.Document()

# Add a summary to the document
summary = "### Q3 2026 Distillation Unit Inspection Report Summary\n\n**Date of Inspection:** August 25, 2026\n**Inspector:** Ramesh K., Lead Integrity Engineer\n**Unit:** Primary Distillation Unit #2 (PDU-2)\n\n#### Executive Summary\nRoutine Q3 inspection of PDU-2 was carried out using ultrasonic thickness gauging and visual inspection. The overall structural integrity of the unit is satisfactory, with one critical finding regarding a high-pressure steam valve.\n\n#### Detailed Findings\n- **Heat Exchangers (HX-101 to HX-104):** No significant fouling detected. Thickness readings are within the 2mm corrosion allowance.\n- **Piping Network (Line L-205):** Minor surface oxidation observed on the external insulation cladding. Recommended for painting in Q4.\n- **Valves and Instrumentation:**\n  - Valve A-403 (HP Steam line) showed signs of micro-fissures on the upstream flange during dye-penetrant testing.\n  - The acoustic emission sensor indicated a faint internal bypass leak when fully closed.\n\n#### Action Items\n1. Schedule immediate replacement of Valve A-403 as per SOP-MRPL-402.\n2. Order 2 units of A-403 valves from vendor (Larsen & Toubro).\n\nFor more detailed information, please refer to the full Q3 2026 Distillation Unit Inspection Report."

# Add the summary to the document
doc.add_paragraph(summary)

# Save the document as Q3_Summary.txt
doc.save('Q3_Summary.txt')

# Indicate that the file has been created
"File 'Q3_Summary.txt' has been created with the professional summary of the Q3 2026 Distillation Unit Inspection Report findings."