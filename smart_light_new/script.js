// Smart Lighting Control System - English Version
// All text and voice prompts in English, with password authentication

// Global State Management
const AppState = {
    // Light data
    lights: [
        { id: 1, name: 'Living Room', location: 'Living Room', isOn: true, brightness: 80, color: '#ffffff' },
        { id: 2, name: 'Bedroom Light', location: 'Bedroom', isOn: false, brightness: 60, color: '#fef3c7' },
        { id: 3, name: 'Kitchen Light', location: 'Kitchen', isOn: true, brightness: 100, color: '#ffffff' },
        { id: 4, name: 'Bathroom Light', location: 'Bathroom', isOn: false, brightness: 70, color: '#ffffff' },
        { id: 5, name: 'Balcony Light', location: 'Balcony', isOn: true, brightness: 50, color: '#dbeafe' }
    ],
    
    // System status
    powerSaveMode: false,
    totalPower: 0,
    runtime: 0,
    errorStatus: 'Normal',
    
    // Authentication status
    isAuthenticated: false,
    authAttempts: 0,
    maxAttempts: 5,
    validUsername: 'password_is_123456',  // Fixed username
    validPassword: '123456',              // Fixed password
    
    // Bound devices
    boundDevices: [
        { id: 1, name: 'iPhone 15', type: 'bluetooth', connected: true, lastActive: '2024-10-20 14:30' },
        { id: 2, name: 'iPad Pro', type: 'wifi', connected: false, lastActive: '2024-10-19 20:15' }
    ],
    
    // Rule history
    ruleHistory: [
        { id: 1, date: '2024-10-20', action: 'Update', description: 'Adjust living room brightness based on habits', status: 'Active' },
        { id: 2, date: '2024-10-19', action: 'Create', description: 'Add night mode rule', status: 'Active' },
        { id: 3, date: '2024-10-18', action: 'Modify', description: 'Optimize energy-saving parameters', status: 'Active' }
    ],
    
    // Sensor data (first week)
    sensorData: {
        temperature: [22, 23, 21, 24, 22, 23, 25],
        humidity: [45, 47, 43, 46, 44, 48, 45],
        light: [300, 280, 320, 290, 310, 295, 305],
        motion: [1, 0, 1, 1, 0, 1, 0]
    },
    
    // Energy consumption data
    energyData: {
        daily: 2.5,
        weekly: 17.8,
        monthly: 75.2,
        yearly: 890.5
    },
    
    // Model output storage
    ruleFromModel: null
};

// Utility Functions
const Utils = {
    // Save to local storage
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to local storage:', e);
        }
    },
    
    // Load from local storage
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('Failed to load from local storage:', e);
            return defaultValue;
        }
    },
    
    // Format time
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString('en-US');
    },
    
    // Calculate power consumption
    calculatePower(lights) {
        return lights.reduce((total, light) => {
            if (light.isOn) {
                return total + (light.brightness * 0.1);
            }
            return total;
        }, 0);
    },
    
    // Text-to-speech (English)
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    },
    
    // Load training data from CSV
    async loadTrainingData() {
        try {
            // Adjust path according to your actual CSV location
            const response = await fetch('./backend/data/training_data.csv');
            if (!response.ok) {
                console.warn('training_data.csv not found, using mock data');
                return this.generateMockTrainingData();
            }
            const text = await response.text();
            const rows = text.split('\n');
            const headers = rows[0].split(',').map(h => h.trim());
            const data = [];
            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].trim()) continue;
                const rowData = rows[i].split(',').map(d => d.trim());
                const item = {};
                headers.forEach((header, index) => {
                    item[header] = rowData[index] || '';
                });
                data.push(item);
            }
            return data;
        } catch (e) {
            console.error('Failed to load training data, using mock data:', e);
            return this.generateMockTrainingData();
        }
    },
    
    // Generate mock training data if CSV is missing
    generateMockTrainingData() {
        const mockData = [];
        const dates = ['2024-10-14', '2024-10-15', '2024-10-16', '2024-10-17', '2024-10-18', '2024-10-19', '2024-10-20'];
        dates.forEach(date => {
            for (let hour = 8; hour <= 22; hour += 4) {
                const brightness = Math.floor(Math.random() * 50) + 50;
                mockData.push({
                    'Date': date,
                    'Time': `${hour}:00`,
                    'Brightness': brightness,
                    'Status': brightness > 0 ? 'On' : 'Off',
                    'Temperature': Math.floor(Math.random() * 5) + 22
                });
            }
        });
        return mockData;
    }
};

// Navigation Management
const Navigation = {
    currentPage: 'light-status',
    
    init() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                this.showPage(page);
            });
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.showTab(tab);
            });
        });
    },
    
    showPage(pageId) {
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');
        
        const targetBtn = document.querySelector(`[data-page="${pageId}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        
        this.currentPage = pageId;
        this.initPage(pageId);
    },
    
    showTab(tabId) {
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetPanel = document.getElementById(`${tabId}-tab`);
        if (targetPanel) targetPanel.classList.add('active');
        
        const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (targetBtn) targetBtn.classList.add('active');
    },
    
    initPage(pageId) {
        switch (pageId) {
            case 'light-status':
                LightControl.renderLights();
                LightControl.updateStatus();
                break;
            case 'history-data':
                // Show authentication first, don't render data until authenticated
                if (!AppState.isAuthenticated) {
                    document.querySelector('.authentication-container').classList.remove('hidden');
                    document.querySelector('.data-container').style.display = 'none';
                } else {
                    document.querySelector('.authentication-container').classList.add('hidden');
                    document.querySelector('.data-container').style.display = 'block';
                    HistoryData.renderData();
                }
                break;
            case 'renew-rules':
                RulesManager.renderCurrentRule();
                break;
            case 'mobile-link':
                MobileLink.renderDevices();
                break;
            case 'settings':
                Settings.loadSettings();
                break;
        }
    }
};

// Light Control Module
const LightControl = {
    renderLights() {
        const container = document.getElementById('lights-grid');
        if (!container) return;
        
        container.innerHTML = AppState.lights.map(light => `
            <div class="light-card">
                <div class="light-header">
                    <span class="light-name">${light.name}</span>
                    <span class="light-status ${light.isOn ? 'on' : 'off'}">
                        ${light.isOn ? 'On' : 'Off'}
                    </span>
                </div>
                <div class="light-controls">
                    <div class="toggle-control">
                        <label>Power:</label>
                        <div class="toggle-switch ${light.isOn ? 'active' : ''}" 
                             onclick="LightControl.toggleLight(${light.id})"></div>
                    </div>
                    <div class="brightness-control">
                        <label>Brightness:</label>
                        <input type="range" class="brightness-slider" 
                               min="0" max="100" value="${light.brightness}"
                               oninput="LightControl.setBrightness(${light.id}, this.value)">
                        <span class="brightness-value">${light.brightness}%</span>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    toggleLight(lightId) {
        const light = AppState.lights.find(l => l.id === lightId);
        if (light) {
            light.isOn = !light.isOn;
            this.renderLights();
            this.updateStatus();
            const status = light.isOn ? 'turned on' : 'turned off';
            Utils.speak(`${light.name} has been ${status}`);
        }
    },
    
    setBrightness(lightId, brightness) {
        const light = AppState.lights.find(l => l.id === lightId);
        if (light) {
            light.brightness = parseInt(brightness);
            light.isOn = brightness > 0;
            this.renderLights();
            this.updateStatus();
        }
    },
    
    updateStatus() {
        const totalPower = Utils.calculatePower(AppState.lights);
        document.getElementById('total-power').textContent = `${totalPower.toFixed(1)}W`;
        
        const runtime = Math.floor(Date.now() / 3600000) % 24;
        document.getElementById('runtime').textContent = `${runtime}h`;
        
        const hasError = AppState.lights.some(light => light.brightness > 0 && !light.isOn);
        document.getElementById('error-status').textContent = hasError ? 'Abnormal' : 'Normal';
        document.getElementById('error-status').style.color = hasError ? 'var(--error-color)' : 'var(--success-color)';
        
        AppState.totalPower = totalPower;
    },
    
    togglePowerSave() {
        AppState.powerSaveMode = !AppState.powerSaveMode;
        
        if (AppState.powerSaveMode) {
            AppState.lights.forEach(light => {
                if (light.isOn) {
                    light.brightness = Math.max(10, Math.floor(light.brightness * 0.7));
                }
            });
            Utils.speak('Power saving mode activated');
        } else {
            AppState.lights.forEach(light => {
                if (light.isOn) {
                    light.brightness = Math.min(100, Math.floor(light.brightness / 0.7));
                }
            });
            Utils.speak('Power saving mode deactivated');
        }
        
        this.renderLights();
        this.updateStatus();
        const btn = document.querySelector('.power-save');
        btn.classList.toggle('active', AppState.powerSaveMode);
    },
    
    turnOffAllLights() {
        AppState.lights.forEach(light => {
            light.isOn = false;
            light.brightness = 0;
        });
        this.renderLights();
        this.updateStatus();
        Utils.speak('All lights have been turned off');
    },
    
    turnOnAllLights() {
        AppState.lights.forEach(light => {
            light.isOn = true;
            light.brightness = light.brightness || 80;
        });
        this.renderLights();
        this.updateStatus();
        Utils.speak('All lights have been turned on');
    }
};

// History Data Module (with authentication)
const HistoryData = {
    // Password authentication
    authenticate() {
        const passwordInput = document.getElementById('password-input');
        const password = passwordInput.value.trim();
        const remainingEl = document.querySelector('.remaining-attempts');
        
        if (password === AppState.validPassword) {
            AppState.isAuthenticated = true;
            document.querySelector('.authentication-container').classList.add('hidden');
            document.querySelector('.data-container').style.display = 'block';
            this.fetchModelRule();  // Call model after authentication
            this.renderData();
            Utils.speak('Authentication successful');
        } else {
            AppState.authAttempts++;
            const remaining = AppState.maxAttempts - AppState.authAttempts;
            remainingEl.textContent = `Remaining attempts: ${remaining}`;
            
            if (remaining <= 0) {
                remainingEl.textContent = 'Too many attempts. Please refresh the page.';
                passwordInput.disabled = true;
                document.querySelector('.verify-btn').disabled = true;
            }
            Utils.speak('Incorrect password');
        }
        passwordInput.value = '';
    },
    
    // Fetch rule from model API
    async fetchModelRule() {
        try {
            // Send sensor data to model (customize as needed)
            const sensorData = {
                brightness: AppState.lights[0].brightness,
                temperature: AppState.sensorData.temperature[0],
                time: new Date().getHours()
            };
            
            // Call your model API (update URL to match your backend)
            const response = await fetch('http://localhost:5000/api/predict_rule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sensorData)
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                AppState.ruleFromModel = result.rule;
                Utils.speak('Model rule loaded successfully');
            }
        } catch (e) {
            console.error('Failed to fetch model rule:', e);
            // Fallback to default rule if API fails
            AppState.ruleFromModel = 'Default rule: Adjust brightness based on ambient light (API unavailable)';
            Utils.speak('Failed to load model rule, using default');
        }
    },
    
    // Render all data after authentication
    async renderData() {
        if (!AppState.isAuthenticated) return;
        
        const trainingData = await Utils.loadTrainingData();
        
        this.renderRules();
        this.renderSensorChart();
        this.renderEnergyStats();
        this.renderTrainingData(trainingData);
        this.renderModelRule();
    },
    
    renderRules() {
        const container = document.getElementById('rules-timeline');
        if (!container) return;
        
        container.innerHTML = AppState.ruleHistory.map(rule => `
            <div class="rule-item">
                <h5>${rule.action} - ${rule.date}</h5>
                <p>${rule.description}</p>
                <p>Status: ${rule.status}</p>
            </div>
        `).join('');
    },
    
    renderSensorChart() {
        const canvas = document.getElementById('sensor-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = AppState.sensorData.light;
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        
        // Draw line chart
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const stepX = width / (data.length - 1);
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const valueRange = maxValue - minValue || 1;
        
        data.forEach((value, index) => {
            const x = index * stepX;
            const y = height - ((value - minValue) / valueRange) * height;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.fillText('Brightness Trend', 10, 20);
    },
    
    renderEnergyStats() {
        const container = document.getElementById('energy-stats');
        if (!container) return;
        
        container.innerHTML = `
            <div class="stat-card">
                <h5>Daily Consumption</h5>
                <div class="stat-value">${AppState.energyData.daily} kWh</div>
            </div>
            <div class="stat-card">
                <h5>Weekly Consumption</h5>
                <div class="stat-value">${AppState.energyData.weekly} kWh</div>
            </div>
            <div class="stat-card">
                <h5>Monthly Consumption</h5>
                <div class="stat-value">${AppState.energyData.monthly} kWh</div>
            </div>
            <div class="stat-card">
                <h5>Yearly Consumption</h5>
                <div class="stat-value">${AppState.energyData.yearly} kWh</div>
            </div>
        `;
    },
    
    renderTrainingData(trainingData) {
        const container = document.getElementById('training-data');
        if (!container) return;
        
        if (trainingData.length === 0) {
            container.innerHTML = '<p>No training data available</p>';
            return;
        }
        
        const headers = Object.keys(trainingData[0]);
        container.innerHTML = `
            <table class="training-data-table">
                <thead>
                    <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${trainingData.map(row => `
                        <tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },
    
    renderModelRule() {
        const container = document.getElementById('model-rule');
        if (!container) return;
        
        container.innerHTML = `
            <div class="data-section">
                <h4>Model Predicted Rule</h4>
                <p>${AppState.ruleFromModel || 'Loading model rule...'}</p>
            </div>
        `;
    },
    
    exportData(format) {
        let data, filename, mimeType;
        
        if (format === 'csv') {
            data = this.generateCSV();
            filename = 'lighting_data.csv';
            mimeType = 'text/csv';
        } else if (format === 'pdf') {
            data = this.generatePDF();
            filename = 'lighting_data.pdf';
            mimeType = 'application/pdf';
        }
        
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        Utils.speak(`Data exported as ${format.toUpperCase()}`);
    },
    
    generateCSV() {
        const headers = ['Date', 'Action', 'Description', 'Status'];
        const rows = AppState.ruleHistory.map(rule => [
            rule.date,
            rule.action,
            rule.description,
            rule.status
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },
    
    generatePDF() {
        return `PDF Content\n\nRule History:\n${AppState.ruleHistory.map(rule => 
            `${rule.date} - ${rule.action}: ${rule.description}`
        ).join('\n')}`;
    }
};

// Rules Manager Module
const RulesManager = {
    renderCurrentRule() {
        const container = document.getElementById('current-rule');
        if (!container) return;
        
        container.innerHTML = `
            <div class="rule-content">
                <p>Default Rule: Automatically adjust brightness based on time</p>
                <p>Last Updated: ${Utils.formatTime(Date.now())}</p>
                <div class="rule-status active">Active</div>
            </div>
        `;
    },
    
    async startRuleRenewal() {
        const process = document.getElementById('thinking-process');
        const confirmation = document.getElementById('rule-confirmation');
        process.classList.remove('hidden');
        
        // Simulate thinking process
        for (let step = 1; step <= 5; step++) {
            const stepElement = document.querySelector(`[data-step="${step}"]`);
            stepElement.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        setTimeout(() => {
            process.classList.add('hidden');
            confirmation.classList.remove('hidden');
        }, 500);
        
        Utils.speak('Rule update completed. Please confirm to apply new rules');
    },
    
    confirmRule(accept) {
        const confirmation = document.getElementById('rule-confirmation');
        confirmation.classList.add('hidden');
        
        if (accept) {
            AppState.ruleHistory.unshift({
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                action: 'Update',
                description: 'Intelligent adjustment based on ambient light and habits',
                status: 'Active'
            });
            
            this.renderCurrentRule();
            Utils.speak('New rules applied');
        } else {
            Utils.speak('Rule update cancelled');
        }
    }
};

// Mobile Link Module
const MobileLink = {
    renderDevices() {
        const container = document.getElementById('devices-list');
        if (!container) return;
        
        container.innerHTML = AppState.boundDevices.map(device => `
            <div class="device-item">
                <div class="device-info">
                    <h5>${device.name}</h5>
                    <p>Connection: ${device.type === 'bluetooth' ? 'Bluetooth' : 'Wi-Fi'}</p>
                    <p>Last Active: ${device.lastActive}</p>
                </div>
                <div class="device-actions">
                    <span class="device-status ${device.connected ? 'connected' : 'disconnected'}">
                        ${device.connected ? 'Connected' : 'Disconnected'}
                    </span>
                    <button onclick="MobileLink.removeDevice(${device.id})" 
                            class="remove-btn" style="margin-left: 10px; padding: 0.25rem 0.5rem; background: var(--error-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    showBindModal(type) {
        const modal = document.getElementById('bind-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        modal.classList.remove('hidden');
        
        switch (type) {
            case 'bluetooth':
                title.textContent = 'Bluetooth Pairing';
                body.innerHTML = `
                    <p>Please ensure Bluetooth is enabled on your device, then click Pair</p>
                    <button onclick="MobileLink.pairDevice('bluetooth')" 
                            style="background: var(--primary-color); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: var(--border-radius); cursor: pointer;">
                        Pair Device
                    </button>
                `;
                break;
            case 'qr':
                title.textContent = 'QR Code Scan';
                body.innerHTML = `
                    <p>Scan the QR code below with your mobile device</p>
                    <div style="text-align: center; margin: 1rem 0;">
                        <div style="width: 200px; height: 200px; background: #f0f0f0; border: 2px dashed #ccc; display: inline-flex; align-items: center; justify-content: center;">
                            QR Code
                        </div>
                    </div>
                `;
                break;
            case 'manual':
                title.textContent = 'Manual Input';
                body.innerHTML = `
                    <p>Please enter device code</p>
                    <input type="text" id="device-code" placeholder="Device Code" 
                           style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); margin-bottom: 1rem;">
                    <button onclick="MobileLink.pairDevice('manual')" 
                            style="background: var(--primary-color); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: var(--border-radius); cursor: pointer;">
                        Connect Device
                    </button>
                `;
                break;
        }
    },
    
    closeBindModal() {
        document.getElementById('bind-modal').classList.add('hidden');
    },
    
    pairDevice(type) {
        if (AppState.boundDevices.length >= 2) {
            alert('Maximum 2 devices can be bound');
            return;
        }
        
        const newDevice = {
            id: Date.now(),
            name: `Device ${AppState.boundDevices.length + 1}`,
            type: type,
            connected: true,
            lastActive: Utils.formatTime(Date.now())
        };
        
        AppState.boundDevices.push(newDevice);
        this.renderDevices();
        this.closeBindModal();
        Utils.speak('Device paired successfully');
    },
    
    removeDevice(deviceId) {
        AppState.boundDevices = AppState.boundDevices.filter(device => device.id !== deviceId);
        this.renderDevices();
        Utils.speak('Device removed');
    }
};

// Settings Module
const Settings = {
    loadSettings() {
        const settings = Utils.loadFromStorage('appSettings', {
            voiceEnabled: true,
            voiceRules: true,
            voiceStatus: true,
            voiceAlerts: true,
            voiceVolume: 50,
            voiceSpeed: 'normal',
            username: 'User',
            password: '',
            twoFactor: false,
            theme: 'light',
            notifications: true,
            autoBackup: true
        });
        
        document.getElementById('voice-enabled').checked = settings.voiceEnabled;
        document.getElementById('voice-rules').checked = settings.voiceRules;
        document.getElementById('voice-status').checked = settings.voiceStatus;
        document.getElementById('voice-alerts').checked = settings.voiceAlerts;
        document.getElementById('voice-volume').value = settings.voiceVolume;
        document.getElementById('voice-speed').value = settings.voiceSpeed;
        document.getElementById('username').value = settings.username;
        document.getElementById('two-factor').checked = settings.twoFactor;
        document.getElementById('theme').value = settings.theme;
        document.getElementById('notifications').checked = settings.notifications;
        document.getElementById('auto-backup').checked = settings.autoBackup;
        
        document.getElementById('volume-value').textContent = settings.voiceVolume;
        document.getElementById('speed-value').textContent = this.getSpeedText(settings.voiceSpeed);
        this.applyTheme(settings.theme);
    },
    
    saveSettings() {
        const settings = {
            voiceEnabled: document.getElementById('voice-enabled').checked,
            voiceRules: document.getElementById('voice-rules').checked,
            voiceStatus: document.getElementById('voice-status').checked,
            voiceAlerts: document.getElementById('voice-alerts').checked,
            voiceVolume: parseInt(document.getElementById('voice-volume').value),
            voiceSpeed: document.getElementById('voice-speed').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            twoFactor: document.getElementById('two-factor').checked,
            theme: document.getElementById('theme').value,
            notifications: document.getElementById('notifications').checked,
            autoBackup: document.getElementById('auto-backup').checked
        };
        
        Utils.saveToStorage('appSettings', settings);
        this.applyTheme(settings.theme);
        Utils.speak('Settings saved');
        document.getElementById('password').value = '';
    },
    
    resetSettings() {
        if (confirm('Are you sure to reset to default settings?')) {
            localStorage.removeItem('appSettings');
            this.loadSettings();
            Utils.speak('Settings reset to default');
        }
    },
    
    updateVolume(value) {
        document.getElementById('volume-value').textContent = value;
    },
    
    updateSpeed(value) {
        document.getElementById('speed-value').textContent = this.getSpeedText(value);
    },
    
    getSpeedText(speed) {
        const speedMap = {
            'slow': 'Slow',
            'normal': 'Normal',
            'fast': 'Fast'
        };
        return speedMap[speed] || 'Normal';
    },
    
    changeTheme(theme) {
        this.applyTheme(theme);
    },
    
    applyTheme(theme) {
        if (theme === 'auto') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
    }
};

// Global Functions (exposed to HTML)
window.showMainApp = function() {
    document.getElementById('welcome-page').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
    Navigation.init();
};

window.togglePowerSave = LightControl.togglePowerSave;
window.turnOffAllLights = LightControl.turnOffAllLights;
window.turnOnAllLights = LightControl.turnOnAllLights;

window.exportData = HistoryData.exportData;

window.startRuleRenewal = RulesManager.startRuleRenewal;
window.confirmRule = RulesManager.confirmRule;

window.showBindModal = MobileLink.showBindModal;
window.closeBindModal = MobileLink.closeBindModal;

window.updateVolume = Settings.updateVolume;
window.updateSpeed = Settings.updateSpeed;
window.changeTheme = Settings.changeTheme;
window.saveSettings = Settings.saveSettings;
window.resetSettings = Settings.resetSettings;

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    Settings.loadSettings();
    Navigation.init();
    
    // Update status every 5 seconds
    setInterval(() => {
        if (Navigation.currentPage === 'light-status') {
            LightControl.updateStatus();
        }
    }, 5000);
    
    // Add training data container to history page
    const historyPage = document.getElementById('history-data');
    if (historyPage && !document.getElementById('training-data')) {
        const trainingDataContainer = document.createElement('div');
        trainingDataContainer.id = 'training-data';
        trainingDataContainer.className = 'data-section';
        trainingDataContainer.innerHTML = '<h4>First Week Training Data (training_data.csv)</h4>';
        historyPage.appendChild(trainingDataContainer);
    }
    
    console.log('Smart Lighting Control System initialized');
});