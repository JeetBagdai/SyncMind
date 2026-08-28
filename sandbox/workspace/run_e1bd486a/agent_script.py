import pandas as pd
from datetime import datetime, timedelta

# Define the equipment and their tasks
equipment_tasks = {
    'Valve A-403': [
        ('Inspection', '2023-10-01', 'Maintenance Tech 1'),
        ('Cleaning', '2023-10-15', 'Maintenance Tech 2'),
        ('Inspection', '2023-10-30', 'Maintenance Tech 1'),
        ('Cleaning', '2023-11-14', 'Maintenance Tech 2'),
        ('Inspection', '2023-11-29', 'Maintenance Tech 1'),
        ('Cleaning', '2023-12-13', 'Maintenance Tech 2'),
        ('Inspection', '2023-12-28', 'Maintenance Tech 1'),
        ('Cleaning', '2024-01-12', 'Maintenance Tech 2'),
        ('Inspection', '2024-01-27', 'Maintenance Tech 1'),
        ('Cleaning', '2024-02-11', 'Maintenance Tech 2'),
        ('Inspection', '2024-02-26', 'Maintenance Tech 1'),
        ('Cleaning', '2024-03-10', 'Maintenance Tech 2')
    ],
    'Heat Exchanger HX-101': [
        ('Inspection', '2023-10-10', 'Maintenance Lead 1'),
        ('Cleaning', '2023-10-25', 'Maintenance Lead 2'),
        ('Inspection', '2023-11-09', 'Maintenance Lead 1'),
        ('Cleaning', '2023-11-24', 'Maintenance Lead 2'),
        ('Inspection', '2023-12-09', 'Maintenance Lead 1'),
        ('Cleaning', '2023-12-24', 'Maintenance Lead 2'),
        ('Inspection', '2024-01-08', 'Maintenance Lead 1'),
        ('Cleaning', '2024-01-23', 'Maintenance Lead 2'),
        ('Inspection', '2024-02-08', 'Maintenance Lead 1'),
        ('Cleaning', '2024-02-23', 'Maintenance Lead 2'),
        ('Inspection', '2024-03-08', 'Maintenance Lead 1'),
        ('Cleaning', '2024-03-23', 'Maintenance Lead 2')
    ],
    'Piping Network L-205': [
        ('Inspection', '2023-10-05', 'Piping Tech 1'),
        ('Cleaning', '2023-10-20', 'Piping Tech 2'),
        ('Inspection', '2023-11-04', 'Piping Tech 1'),
        ('Cleaning', '2023-11-19', 'Piping Tech 2'),
        ('Inspection', '2023-12-04', 'Piping Tech 1'),
        ('Cleaning', '2023-12-19', 'Piping Tech 2'),
        ('Inspection', '2024-01-03', 'Piping Tech 1'),
        ('Cleaning', '2024-01-18', 'Piping Tech 2'),
        ('Inspection', '2024-02-02', 'Piping Tech 1'),
        ('Cleaning', '2024-02-17', 'Piping Tech 2'),
        ('Inspection', '2024-03-02', 'Piping Tech 1'),
        ('Cleaning', '2024-03-17', 'Piping Tech 2')
    ]
}

# Create a DataFrame for each equipment
data = {}
for equipment, tasks in equipment_tasks.items():
    df = pd.DataFrame(tasks, columns=['Task', 'Date', 'Assigned To'])
    df['Equipment'] = equipment
    data[equipment] = df

# Combine all DataFrames into one
combined_df = pd.concat(data.values(), ignore_index=True)

# Convert 'Date' column to datetime
combined_df['Date'] = pd.to_datetime(combined_df['Date'])

# Save to CSV
combined_df.to_csv('Maintenance_Schedule.csv', index=False)

# Display the first few rows of the DataFrame
combined_df.head()