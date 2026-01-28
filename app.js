/**
 * Cinematic Study & Life Tracker - App Logic
 * Pure Vanilla JS, No Build Step Required.
 */

// --- State Management ---
const Store = {
    get: (key, defaultVal) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultVal;
    },
    set: (key, val) => {
        localStorage.setItem(key, JSON.stringify(val));
    }
};

// Initial Data
const AppData = {
    profile: Store.get('profile', { name: 'Guest', focus: 'Personal Growth', cloudUrl: '' }),
    routines: Store.get('routines', [
        { id: 1, title: 'Morning Meditation', time: '07:00 AM', completed: false, type: 'habit' },
        { id: 2, title: 'Deep Work Session', time: '09:00 AM', completed: false, type: 'study' },
        { id: 3, title: 'Workout', time: '05:00 PM', completed: false, type: 'wellness' }
    ]),
    studySessions: Store.get('studySessions', []),
    quotes: [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
        { text: "Focus on the step in front of you, not the whole staircase.", author: "Unknown" },
        { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" }
    ]
};

// --- Cloud Sync Service (Google Sheets) ---
const SyncService = {
    async logSession(session) {
        if (!AppData.profile.cloudUrl) return;
        try {
            await fetch(AppData.profile.cloudUrl, {
                method: 'POST',
                mode: 'no-cors', // Google Scripts requirement for simple requests
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'log_session', session: session })
            });
            console.log("Synced Session to Cloud");
        } catch (e) {
            console.error("Sync Error", e);
        }
    },
    async syncRoutines() {
        if (!AppData.profile.cloudUrl) return;
        try {
            await fetch(AppData.profile.cloudUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'sync_routines', routines: AppData.routines })
            });
            console.log("Synced Routines to Cloud");
        } catch (e) {
            console.error("Sync Error", e);
        }
    }
};

// --- View Router ---
const Router = {
    current: 'home',
    init: () => {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = btn.dataset.target || btn.closest('.nav-item').dataset.target;
                Router.navigate(target);
            });
        });
        Router.navigate('home');
    },
    navigate: (viewId) => {
        Router.current = viewId;

        // Update Nav
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.target === viewId);
            const span = el.querySelector('span');
            // Animate labels
            if (el.dataset.target === viewId) {
                span.style.opacity = '1';
                span.style.bottom = '-20px'; // Actually visible position relative to some container, css handles this
            } else {
                span.style.opacity = '0';
            }
        });

        // Render Content
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        main.classList.remove('fade-in');
        void main.offsetWidth; // Trigger reflow
        main.classList.add('fade-in');

        switch (viewId) {
            case 'home': Views.renderHome(main); break;
            case 'routine': Views.renderRoutine(main); break;
            case 'study': Views.renderStudy(main); break;
            case 'progress': Views.renderProgress(main); break;
            case 'profile': Views.renderProfile(main); break;
        }

        lucide.createIcons();
    }
};

// --- Views ---
const Views = {
    renderHome: (container) => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const quote = AppData.quotes[Math.floor(Math.random() * AppData.quotes.length)];
        const pendingRoutines = AppData.routines.filter(r => !r.completed).length;

        container.innerHTML = `
            <div class="header-section">
                <p class="date">${today}</p>
                <h1>Welcome back, ${AppData.profile.name}</h1>
                <div class="quote-container">
                    <p class="quote-text">"${quote.text}"</p>
                    <p class="quote-author">- ${quote.author}</p>
                </div>
            </div>

            <div class="glass-card">
                <h3>Daily Overview</h3>
                <div style="display:flex; justify-content:space-between; margin-top:15px; text-align:center;">
                    <div>
                        <h2 style="color:var(--accent-gold); margin:0;">${pendingRoutines}</h2>
                        <p>Tasks Left</p>
                    </div>
                    <div>
                        <h2 style="color:var(--accent-blue); margin:0;">${AppData.studySessions.length}</h2>
                        <p>Study Sessions</p>
                    </div>
                    <div>
                        <h2 style="color:#ffffff; margin:0;">85%</h2>
                        <p>Focus Score</p>
                    </div>
                </div>
            </div>

            <button class="btn-primary" onclick="Router.navigate('study')">Start Focus Session</button>
        `;
    },

    renderRoutine: (container) => {
        const listHtml = AppData.routines.map(routine => `
            <div class="glass-card" style="display:flex; align-items:center; justify-content:space-between; padding:15px;">
                <div>
                    <h3 style="font-size:16px; margin-bottom:4px; text-decoration: ${routine.completed ? 'line-through' : 'none'}; opacity: ${routine.completed ? 0.5 : 1}">${routine.title}</h3>
                    <p style="font-size:12px;">${routine.time} • ${routine.type}</p>
                </div>
                <div onclick="Actions.toggleRoutine(${routine.id})" style="
                    width:24px; height:24px; 
                    border:2px solid ${routine.completed ? 'var(--accent-gold)' : 'var(--text-secondary)'}; 
                    border-radius:50%; 
                    display:flex; justify-content:center; align-items:center; cursor:pointer;
                    background: ${routine.completed ? 'var(--accent-gold)' : 'transparent'};
                ">
                    ${routine.completed ? '<i data-lucide="check" style="width:14px; color:#000;"></i>' : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <h1>Your Routine</h1>
            <p style="margin-bottom:20px;">Design your perfect day.</p>
            ${listHtml}
            <div class="glass-card" style="text-align:center; border-style:dashed; cursor:pointer;" onclick="alert('Add Routine Modal would open here')">
                <p>+ Add New Routine</p>
            </div>
        `;
    },

    renderStudy: (container) => {
        container.innerHTML = `
            <h1>Focus Mode</h1>
            <div class="glass-card" style="text-align:center; padding:40px 20px;">
                <div id="timer-display" style="font-size:48px; font-weight:600; font-family:'Inter', sans-serif; margin-bottom:20px;">25:00</div>
                <p id="timer-status" style="margin-bottom:30px;">Ready to focus?</p>
                
                <button id="timer-btn" class="btn-primary" onclick="Actions.toggleTimer()">Start Session</button>
            </div>

            <h3>Recent Sessions</h3>
            <div id="session-list">
                ${AppData.studySessions.length === 0 ? '<p>No sessions yet.</p>' : ''}
                ${AppData.studySessions.slice(-3).reverse().map(s => `
                    <div class="glass-card" style="padding:15px; margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between;">
                            <span>${s.subject}</span>
                            <span style="color:var(--accent-gold)">${s.duration} min</span>
                        </div>
                        <p style="font-size:12px;">${new Date(s.date).toLocaleDateString()}</p>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderProgress: (container) => {
        container.innerHTML = `
            <h1>Progress</h1>
            <div class="glass-card">
                <h3>Weekly Consistency</h3>
                <div style="display:flex; justify-content:space-between; align-items:flex-end; height:100px; margin-top:20px; padding:0 10px;">
                    ${[40, 60, 30, 80, 50, 90, 70].map(h => `
                        <div style="width:8px; height:${h}%; background: ${h > 80 ? 'var(--accent-gold)' : 'rgba(255,255,255,0.2)'}; border-radius:4px;"></div>
                    `).join('')}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:10px; color:var(--text-secondary); font-size:10px;">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
            </div>
            
             <div class="glass-card">
                <h3>Life Balance</h3>
                <p>Study vs. Wellness</p>
                <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px; margin-top:10px; overflow:hidden;">
                    <div style="width:65%; height:100%; background:var(--accent-blue);"></div>
                </div>
            </div>
        `;
    },

    renderProfile: (container) => {
        const isConnected = !!AppData.profile.cloudUrl;

        container.innerHTML = `
            <div style="text-align:center; margin-bottom:30px;">
                <div style="width:80px; height:80px; background:var(--accent-gold); border-radius:50%; margin:0 auto 15px; display:flex; align-items:center; justify-content:center; font-size:30px; color:#000; font-weight:bold;">
                    ${AppData.profile.name.charAt(0)}
                </div>
                <h2>${AppData.profile.name}</h2>
                <p>${AppData.profile.focus}</p>
            </div>
            
            <div class="glass-card">
                <h3>Settings</h3>
                <div style="margin-top:15px;">
                    <p style="margin-bottom:10px;">Display Name</p>
                    <input type="text" value="${AppData.profile.name}" onchange="Actions.updateProfile('name', this.value)" 
                    style="width:100%; background:rgba(0,0,0,0.2); border:1px solid var(--glass-border); color:white; padding:10px; border-radius:8px; margin-bottom:20px;">
                </div>
            </div>
            
            <div class="glass-card">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                    <i data-lucide="${isConnected ? 'link' : 'plug'}"></i>
                    <h3>Cloud Sync (Google Sheets)</h3>
                </div>
                <p style="font-size:12px; margin-bottom:10px; color:var(--text-secondary);">
                    Paste your Google Web App URL here to enable live spreadsheet tracking.
                </p>
                <input type="text" placeholder="https://script.google.com/..." 
                    value="${AppData.profile.cloudUrl || ''}" 
                    onchange="Actions.updateProfile('cloudUrl', this.value)" 
                    style="width:100%; background:rgba(0,0,0,0.2); border:1px solid ${isConnected ? 'var(--accent-blue)' : 'var(--glass-border)'}; color:white; padding:10px; border-radius:8px;">
                ${isConnected ? '<p style="color:var(--accent-blue); font-size:12px; margin-top:5px;">✓ Connected</p>' : ''}
            </div>
        `;
    }
};

// --- Actions ---
let timerInterval = null;
let timeLeft = 25 * 60;
let isTimerRunning = false;

const Actions = {
    toggleRoutine: (id) => {
        const routine = AppData.routines.find(r => r.id === id);
        if (routine) {
            routine.completed = !routine.completed;
            Store.set('routines', AppData.routines);
            Router.navigate('routine'); // Re-render

            // Sync to Cloud
            SyncService.syncRoutines();
        }
    },

    updateProfile: (key, val) => {
        AppData.profile[key] = val;
        Store.set('profile', AppData.profile);
        if (key === 'cloudUrl') {
            Router.navigate('profile'); // Re-render to show connected state
            alert('Cloud URL updated! Try completing a routine to test sync.');
        }
    },

    toggleTimer: () => {
        const btn = document.getElementById('timer-btn');
        const display = document.getElementById('timer-display');
        const status = document.getElementById('timer-status');

        if (isTimerRunning) {
            // Stop
            clearInterval(timerInterval);
            isTimerRunning = false;
            btn.innerText = "Resume Session";
            status.innerText = "Paused";
            status.style.color = "var(--text-secondary)";
        } else {
            // Start
            isTimerRunning = true;
            btn.innerText = "Pause Session";
            status.innerText = "Focusing...";
            status.style.color = "var(--accent-gold)";

            timerInterval = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                    const s = (timeLeft % 60).toString().padStart(2, '0');
                    display.innerText = `${m}:${s}`;
                } else {
                    // Session Complete
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    timeLeft = 25 * 60; // Reset

                    const session = {
                        subject: 'Deep Work',
                        duration: 25,
                        date: new Date().toISOString()
                    };

                    AppData.studySessions.push(session);
                    Store.set('studySessions', AppData.studySessions);

                    // Sync to Cloud
                    SyncService.logSession(session);

                    Router.navigate('study'); // Refresh list
                    alert("Focus Session Complete! Great job.");
                }
            }, 1000);
        }
    }
};

// Start App
window.addEventListener('DOMContentLoaded', Router.init);
