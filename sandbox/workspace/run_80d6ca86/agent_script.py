# Define the findings from the Q3 2026 Distillation Unit Inspection Report
findings = [
    "Routine Q3 inspection of PDU-2 was carried out using ultrasonic thickness gauging and visual inspection.",
    "Overall structural integrity of the unit is satisfactory, with one critical finding regarding a high-pressure steam valve.",
    "Heat Exchangers (HX-101 to HX-104): No significant fouling detected. Thickness readings are within the 2mm corrosion allowance.",
    "Piping Network (Line L-205): Minor surface oxidation observed on the external insulation cladding. Recommended for painting in Q4.",
    "Valves and Instrumentation: Valve A-403 (HP Steam line) showed signs of micro-fissures on the upstream flange during dye-penetrant testing. The acoustic emission sensor indicated a faint internal bypass leak when fully closed.",
    "Action Items: Schedule immediate replacement of Valve A-403 as per SOP-MRPL-402. Order 2 units of A-403 valves from vendor (Larsen & Toubro)."
]

# Write the findings to a file named 'Q3_Summary.txt'
with open('Q3_Summary.txt', 'w') as file:
    file.write("Professional Summary of Q3 2026 Distillation Unit Inspection Report:\n\n")
    for finding in findings:
        file.write(f"{finding}\n\n")

print("File 'Q3_Summary.txt' created successfully.")