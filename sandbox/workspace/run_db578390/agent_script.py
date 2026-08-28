import pandas as pd

# Create a DataFrame to store the key points about CyberTriage
key_points = {
    'Feature': [
        'Guided flow with no progress loss',
        'Support for 10 Indian languages via voice input',
        'Automatically converts user description to a court-admissible English FIR',
        'Automatically pre-fills forms with UTR numbers or scam SMS',
        'Generates CFCFRMS-compliant bank freeze payload',
        'Provides a verified PDF docket for police station submission'
    ],
    'Description': [
        'A step-by-step process that ensures users do not lose their progress during the reporting process.',
        'Users can input information in their preferred Indian language, and the system converts it to English for legal purposes.',
        'The system automatically generates a legal document that can be used in court, citing relevant laws.',
        'Users can easily upload screenshots or paste scam SMS, and the system pre-fills the form, reducing the stress of manual entry.',
        'The backend generates a JSON payload that can be used to freeze scammer accounts, turning a complaint into an active intervention.',
        'Users receive a verified PDF docket that can be used as evidence at a police station.'
    ]
}

df = pd.DataFrame(key_points)
df.to_csv('CyberTriage_KeyPoints.csv', index=False)