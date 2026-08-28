import pandas as pd
from datetime import datetime, timedelta

# Define the equipment and tasks
equipment = ['Valve A-403', 'Heat Exchanger HX-101', 'Piping Network L-205']
tasks = ['Inspection', 'Cleaning', 'Pressure Test']
assigned_to = ['Tech A', 'Tech B', 'Tech C']

# Generate a 3-month mock maintenance schedule
start_date = datetime.now()
end_date = start_date + timedelta(days=90)
date_range = pd.date_range(start=start_date, end=end_date, freq='ME')

# Create an empty DataFrame to store the schedule
schedule = pd.DataFrame(columns=['Equipment', 'Date', 'Task', 'Assigned To'])

# Populate the schedule
for date in date_range:
    for i in range(len(equipment)):
        schedule = pd.concat([schedule, pd.DataFrame({
            'Equipment': [equipment[i]],
            'Date': [date.strftime('%Y-%m-%d')],
            'Task': [tasks[i % len(tasks)]],
            'Assigned To': [assigned_to[i % len(assigned_to)]]
        })], ignore_index=True)

# Save the schedule to a CSV file
schedule.to_csv('Maintenance_Schedule.csv', index=False)