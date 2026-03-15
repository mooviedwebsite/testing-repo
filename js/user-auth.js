/* ========================================
   USER AUTHENTICATION - SIMPLIFIED
======================================== */

const UserAuth = {
    currentUser: null,

    // Initialize
    init() {
        console.log('🔐 UserAuth Init');
        this.loadUser();
        this.updateUI();
    },

    // Load user from localStorage
    loadUser() {
        const data = localStorage.getItem('currentUser');
        if (data) {
            try {
                this.currentUser = JSON.parse(data);
                console.log('✅ User loaded:', this.currentUser.email);
            } catch (e) {
                console.error('❌ Parse error:', e);
                localStorage.removeItem('currentUser');
            }
        } else {
            console.log('ℹ️ No user logged in');
        }
    },

    // Update UI
    updateUI() {
        console.log('🎨 Updating UI...');
        
        const loginLink = document.getElementById('login-link');
        const userAccount = document.getElementById('user-account');

        console.log('Login Link:', loginLink);
        console.log('User Account:', userAccount);

        if (!loginLink || !userAccount) {
            console.error('❌ Elements not found!');
            return;
        }

        if (this.currentUser) {
            console.log('👤 Showing user menu');
            
            // Hide login link
            loginLink.style.display = 'none';
            
            // Show user account
            userAccount.style.display = 'block';
            
            // Get plan class
            const planClass = this.getPlanClass(this.currentUser.plan);
            
            // Create menu HTML
            userAccount.innerHTML = `
                <div class="user-menu">
                    <button class="user-btn" id="user-menu-button">
                        <span class="user-icon">👤</span>
                        <span class="user-name">${this.currentUser.fullName || 'User'}</span>
                        <span class="user-plan ${planClass}">${this.currentUser.plan.toUpperCase()}</span>
                    </button>
                    <div class="user-dropdown" id="user-dropdown">
                        <a href="profile.html">
                            <span class="dropdown-icon">👤</span>
                            <span>Profile</span>
                        </a>
                        <a href="membership.html">
                            <span class="dropdown-icon">💎</span>
                            <span>Membership</span>
                        </a>
                        ${this.currentUser.userId === 'admin' ? `
                            <a href="admin/index.html">
                                <span class="dropdown-icon">⚙️</span>
                                <span>Admin Panel</span>
                            </a>
                        ` : ''}
                        <div class="dropdown-divider"></div>
                        <a href="#" id="logout-btn">
                            <span class="dropdown-icon">🚪</span>
                            <span>Logout</span>
                        </a>
                    </div>
                </div>
            `;
            
            console.log('✅ Menu HTML created');
            
            // Add event listeners
            setTimeout(() => {
                this.attachListeners();
            }, 100);
            
        } else {
            console.log('🔓 Showing login link');
            loginLink.style.display = 'inline-block';
            userAccount.style.display = 'none';
        }
    },

    // Attach event listeners
    attachListeners() {
        const menuBtn = document.getElementById('user-menu-button');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
            console.log('✅ Menu button listener attached');
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
            console.log('✅ Logout button listener attached');
        }
    },

    // Toggle dropdown
    toggleDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            const isActive = dropdown.classList.contains('active');
            dropdown.classList.toggle('active');
            console.log('🔽 Dropdown toggled:', !isActive);
        }
    },

    // Get plan class
    getPlanClass(plan) {
        const classes = {
            'free': 'plan-free',
            'pro': 'plan-pro',
            'premium': 'plan-premium',
            'gold': 'plan-gold',
            'admin': 'plan-admin'
        };
        return classes[plan.toLowerCase()] || 'plan-free';
    },

    // Logout
    logout() {
        if (confirm('Logout?')) {
            console.log('🚪 Logging out');
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('adminAuth');
            window.location.href = 'auth.html';
        }
    }
};

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Ready');
    UserAuth.init();
});

// Close dropdown on outside click
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown && !e.target.closest('.user-menu')) {
        dropdown.classList.remove('active');
    }
});

// Export
window.UserAuth = UserAuth;
