import pandas as pd
from datetime import datetime, timedelta

# Define the equipment and tasks
equipment = ['Valve A-403', 'Heat Exchanger HX-101', 'Piping Network L-205']
tasks = ['Inspection', 'Cleaning', 'Pressure Test']
assigned_to = ['Tech 1', 'Tech 2', 'Tech 3']

# Generate dates for the next 3 months
start_date = datetime.now()
end_date = start_date + timedelta(days=90)
date_range = pd.date_range(start=start_date, end=end_date, freq='W-MON')

# Create an empty DataFrame
df = pd.DataFrame(columns=['Equipment', 'Date', 'Task', 'Assigned To'])

# Populate the DataFrame with mock data
for date in date_range:
    for i in range(len(equipment)):
        df = df.append({
            'Equipment': equipment[i],
            'Date': date.strftime('%Y-%m-%d'),
            'Task': tasks[i % len(tasks)],
            'Assigned To': assigned_to[i % len(assigned_to)]
        }, ignore_index=True)

# Save the DataFrame to a CSV file
df.to_csv('Maintenance_Schedule.csv', index=False)