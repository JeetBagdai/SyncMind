import pandas as pd

# Define the maintenance schedule data
data = {
    'Equipment': ['Valve A-403', 'Heat Exchanger HX-101', 'Piping Network L-205'],
    'Date': ['2026-10-01', '2026-11-01', '2026-12-01'],
    'Task': ['Replace Valve A-403', 'Paint HX-101 Insulation', 'Paint L-205 Insulation'],
    'Assigned To': ['Mechanical Team Lead', 'Insulation Team Lead', 'Painting Team Lead']
}

# Create a DataFrame
df = pd.DataFrame(data)

# Save the DataFrame to a CSV file
df.to_csv('Maintenance_Schedule.csv', index=False)