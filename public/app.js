const appContent = document.getElementById('app-content');

let state = {
    view: localStorage.getItem('token') ? 'dashboard' : 'home', // home, select-method, auth-input, otp, dashboard
    userId: null,
    identifierType: '', // email or phone
    authAction: 'login', // login or register
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    message: { type: '', text: '' }
};

const renderMessage = () => {
    if (!state.message.text) return '';
    return `<div class="${state.message.type}-msg" style="margin-bottom: 15px; padding: 10px; border-radius: 4px; text-align: center; ${state.message.type === 'error' ? 'background-color: #f8d7da; color: #721c24;' : 'background-color: #d4edda; color: #155724;'}">${state.message.text}</div>`;
};

const views = {
    home: () => `
        <div style="text-align: center; padding: 20px 0;">
            <h2>Welcome to Dkart</h2>
            <p style="font-size: 14px; color: #7f8c8d; margin-bottom: 25px;">
                Your secure B2B medical equipment marketplace.
            </p>
            ${renderMessage()}
            <button onclick="setAuthAction('login')" style="margin-bottom: 15px; width: 100%;">Login</button>
            <button onclick="setAuthAction('register')" style="background-color: var(--primary-green); width: 100%;">Register</button>
        </div>
    `,
    'select-method': () => `
        <h2>${state.authAction === 'login' ? 'Login' : 'Register'}</h2>
        <p style="font-size: 14px; text-align: center; color: #7f8c8d; margin-bottom: 25px;">
            Choose your preferred authentication method to continue.
        </p>
        ${renderMessage()}
        <div class="method-selection">
            <button class="btn-select" onclick="selectMethod('phone')" style="display: flex; align-items: center; justify-content: center; margin-bottom: 12px; background-color: var(--primary-green);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                ${state.authAction === 'login' ? 'Login' : 'Register'} via Phone Number
            </button>
            <button class="btn-select" onclick="selectMethod('email')" style="display: flex; align-items: center; justify-content: center; background-color: var(--dark-green);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                ${state.authAction === 'login' ? 'Login' : 'Register'} via Email
            </button>
        </div>
        <div class="text-center" style="margin-top: 20px;">
            <span class="link" onclick="navigate('home')">Go Back</span>
        </div>
    `,
    'auth-input': () => `
        <h2>Enter ${state.identifierType === 'email' ? 'Email' : 'Phone Number'}</h2>
        <p style="font-size: 14px; text-align: center; color: #7f8c8d; margin-bottom: 20px;">
            We will send a 6-digit OTP to your ${state.identifierType === 'email' ? 'email address' : 'phone number'}.
        </p>
        ${renderMessage()}
        <form id="auth-form">
            <div class="form-group">
                <label>${state.identifierType === 'email' ? 'Email Address' : 'Phone Number'}</label>
                <input 
                    type="${state.identifierType === 'email' ? 'email' : 'tel'}" 
                    id="identifier" 
                    placeholder="${state.identifierType === 'email' ? 'e.g. user@email.com' : 'e.g. 9021216657'}" 
                    required
                >
            </div>
            <button type="submit">Send OTP</button>
        </form>
        <div class="text-center">
            <span class="link" onclick="navigate('select-method')">Go Back</span>
        </div>
    `,
    otp: () => `
        <h2>Verify OTP</h2>
        <p style="font-size: 14px; text-align: center; color: #7f8c8d; margin-bottom: 20px;">
            We've sent a 6-digit code to your ${state.identifierType === 'email' ? 'Email' : 'Phone Number'}.
        </p>
        ${renderMessage()}
        <form id="otp-form">
            <div class="form-group">
                <label>6-Digit OTP</label>
                <input type="text" id="otp" required maxlength="6" autocomplete="one-time-code" style="text-align: center; font-size: 20px; letter-spacing: 5px;">
            </div>
            <button type="submit">Verify & ${state.authAction === 'login' ? 'Login' : 'Register'}</button>
        </form>
        <div class="text-center">
            <span class="link" onclick="navigate('auth-input')">Go Back</span>
        </div>
    `,
    dashboard: () => `
        <div style="text-align: center; padding: 10px 0;">
            <div style="width: 60px; height: 60px; background-color: var(--light-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--dark-green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2>Logged In Successfully</h2>
            <p style="font-size: 14px; color: #7f8c8d; margin-bottom: 25px;">Welcome to your secure B2B medical equipment dashboard.</p>
        </div>
        ${renderMessage()}
        <div class="dashboard-card" style="text-align: center; border: 1px solid var(--border-color); background-color: var(--light-green);">
            <h3 style="margin-top: 0; color: var(--dark-green);">Dkart B2B Dashboard</h3>
            <p style="font-size: 14px; line-height: 1.5; color: #2c3e50; margin: 10px 0 0 0;">
                You are successfully authenticated. All backend services are verified and active.
            </p>
            ${state.user ? `<p style="margin-top: 15px; font-weight: bold; color: var(--dark-green);">User ID: ${state.user.id}</p>` : ''}
        </div>
        <button onclick="logout()" style="background-color: #95a5a6; margin-top: 20px;">Logout</button>
    `
};

const render = () => {
    appContent.innerHTML = views[state.view]();
    attachListeners();
};

const navigate = (view, msg = { type: '', text: '' }) => {
    state.view = view;
    state.message = msg;
    render();
};

window.setAuthAction = (action) => {
    state.authAction = action;
    navigate('select-method');
};

window.selectMethod = (type) => {
    state.identifierType = type;
    navigate('auth-input');
};

const attachListeners = () => {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identifier = document.getElementById('identifier').value;
            
            try {
                const res = await fetch('/api/auth/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, action: state.authAction })
                });
                const data = await res.json();
                
                if (res.ok) {
                    state.userId = data.userId;
                    state.identifierType = data.type;
                    navigate('otp', { type: 'success', text: data.message });
                } else {
                    navigate('auth-input', { type: 'error', text: data.error });
                }
            } catch (err) {
                navigate('auth-input', { type: 'error', text: 'Server error' });
            }
        });
    }

    const otpForm = document.getElementById('otp-form');
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = document.getElementById('otp').value;
            
            try {
                const res = await fetch('/api/auth/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: state.userId, otp })
                });
                const data = await res.json();
                
                if (res.ok) {
                    state.token = data.token;
                    state.user = data.user;
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    navigate('dashboard');
                } else {
                    navigate('otp', { type: 'error', text: data.error });
                }
            } catch (err) {
                navigate('otp', { type: 'error', text: 'Server error' });
            }
        });
    }
};

window.logout = () => {
    state.token = null;
    state.user = null;
    state.userId = null;
    state.identifierType = '';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('home', { type: 'success', text: 'Logged out successfully' });
};

// Initial render
render();
