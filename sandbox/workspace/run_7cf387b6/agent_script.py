import pandas as pd
from datetime import datetime, timedelta

# Define the equipment and their tasks
equipment = {
    'Valve A-403': [
        ('Inspection', 'Maintenance Tech 1'),
        ('Cleaning', 'Maintenance Tech 2'),
        ('Inspection', 'Maintenance Tech 1'),
        ('Cleaning', 'Maintenance Tech 2'),
        ('Inspection', 'Maintenance Tech 1'),
        ('Cleaning', 'Maintenance Tech 2')
    ],
    'Heat Exchanger HX-101': [
        ('Inspection', 'Maintenance Lead 1'),
        ('Cleaning', 'Maintenance Lead 2'),
        ('Inspection', 'Maintenance Lead 1'),
        ('Cleaning', 'Maintenance Lead 2'),
        ('Inspection', 'Maintenance Lead 1'),
        ('Cleaning', 'Maintenance Lead 2')
    ],
    'Piping Network L-205': [
        ('Inspection', 'Piping Tech 1'),
        ('Cleaning', 'Piping Tech 2'),
        ('Inspection', 'Piping Tech 1'),
        ('Cleaning', 'Piping Tech 2'),
        ('Inspection', 'Piping Tech 1'),
        ('Cleaning', 'Piping Tech 2')
    ]
}

# Generate the schedule
schedule = []
current_date = datetime(2023, 10, 1)

for equipment_name, tasks in equipment.items():
    for task, assignee in tasks:
        schedule.append([equipment_name, current_date.strftime('%Y-%m-%d'), task, assignee])
        current_date += timedelta(days=15)

# Create a DataFrame and save it as a CSV file
df = pd.DataFrame(schedule, columns=['Equipment', 'Date', 'Task', 'Assigned To'])
df.to_csv('Maintenance_Schedule.csv', index=False)

df