Smart Lighting Control System
A web-based smart lighting control system with password-protected data access, English interface, and model integration capabilities.
Features
Light Control Panel: Real-time control of lights (on/off, brightness adjustment) across multiple rooms
Password-Protected Data Access: 
Secure access to historical data with fixed credentials to show how it works:
Username: password_is_123456
Password: 123456
Historical Data Visualization:
Training data display from training_data.csv
Brightness trend charts (first week data)
Energy consumption statistics (daily/weekly/monthly/yearly)
Model Integration: Connects to custom models to display predicted lighting rules
Device Management: Pair/unpair mobile devices via Bluetooth, QR code, or manual input
Energy-Saving Mode: Automatic brightness adjustment to reduce power consumption
English Interface: All text and voice prompts in English
Data Export: Export historical data in CSV or PDF format
File Structure
plaintext
SMART_LIGHT_PAGE/                # Project root
├─ backend/                      # Backend components
│  ├─ data/                      # Data storage
│  │  └─ training_data.csv       # Your training data (first week)
│  ├─ model_api.py               # Model API server (optional)
│  └─ [other backend files]      # Your existing backend scripts
├─ index.html                    # Main frontend page
├─ script.js                     # Main application logic
├─ styles.css                    # Styling
└─ tec_requirements.txt          # Technical requirements
Setup & Usage
1. Prerequisites
A modern web browser (Chrome, Firefox, Edge, etc.)
Python 3.x (for running local server and optional model API)
2. Basic Setup (No Model Integration)
Place your training_data.csv in the backend/data/ directory
Start a local web server from the project root:
bash
python -m http.server 8000
Open your browser and navigate to http://localhost:8000
3. Full Setup (With Model Integration)
Complete the basic setup steps above
Place your model script (e.g., model4.py) in the backend/ directory
Start the model API server:
bash
cd backend
python model_api.py
The frontend will automatically connect to the model API at http://localhost:5000
4. Accessing Protected Data
Navigate to the "Historical Data" page
Enter the password 123456 (username is fixed as password_is_123456)
View your training data, statistics, and model-predicted rules
Key Components
Light Control: Adjust individual lights or use global controls (all on/off, energy-saving mode)
Data Visualization: Automatic rendering of brightness trends and energy statistics
Model Integration: The system calls http://localhost:5000/api/predict_rule to get lighting rules
Voice Feedback: English text-to-speech for user actions and system status
Settings: Customize voice preferences, theme, and other system options
Troubleshooting
Training Data Not Loading:
Verify training_data.csv exists in backend/data/
Check file permissions and CSV format (ensure first row contains headers)
The system will automatically use mock data if the file is missing
Model Connection Issues:
Ensure the model API server is running
Verify the API URL in script.js matches your server address
Check browser console (F12) for connection errors
Authentication Problems:
Maximum 5 password attempts before temporary lockout
Refresh the page to reset login attempts
Customization
Modify Model API Endpoint: Change the URL in HistoryData.fetchModelRule() in script.js
Adjust CSV Path: Update the path in Utils.loadTrainingData() if your CSV is in a different location
Change Voice Settings: Modify speech parameters in Utils.speak() or via the Settings page
Update Lighting Configuration: Edit the lights array in AppState to match your physical setup
