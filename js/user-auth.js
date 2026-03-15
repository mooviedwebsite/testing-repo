/* ========================================
   NETFLIX STYLE USER MENU PANEL
======================================== */

const UserAuth = {
    currentUser: null,
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxxhGkwRbJErCE05Z-TejfARFrdmQlp4ijNCSPSfnRlntgmk4re-fXUZiOFEAKLaEtz/exec',

    init() {
        this.loadUser();
        this.updateUI();
    },

    loadUser() {
        const data = localStorage.getItem('currentUser');
        if (data) {
            try {
                this.currentUser = JSON.parse(data);
                console.log('✅ User loaded:', this.currentUser.email);
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        }
    },

    async updateUI() {
        const loginLink = document.querySelector('.login-link');
        const userAccount = document.querySelector('.user-account');

        if (!userAccount) return;

        if (this.currentUser) {
            if (loginLink) loginLink.style.display = 'none';
            userAccount.style.display = 'block';
            
            // Get subscription info
            let subscription = null;
            try {
                const response = await fetch(`${this.SCRIPT_URL}?action=getUserSubscription&userId=${this.currentUser.userId}`);
                subscription = await response.json();
            } catch (e) {
                console.log('Could not load subscription');
            }

            // Get saved count
            const savedPosts = JSON.parse(localStorage.getItem('netflix_saved') || '[]');
            const savedCount = savedPosts.length;

            // Create Netflix-style menu
            userAccount.innerHTML = this.createNetflixMenu(subscription, savedCount);
            
            // Attach listeners
            setTimeout(() => this.attachListeners(), 100);
            
        } else {
            if (loginLink) loginLink.style.display = 'inline-block';
            userAccount.style.display = 'none';
        }
    },

    createNetflixMenu(subscription, savedCount) {
        const planColors = {
            'free': '#6B7280',
            'pro': '#3B82F6',
            'premium': '#8B5CF6',
            'gold': 'linear-gradient(135deg, #F59E0B, #FBBF24)',
            'admin': '#E50914'
        };

        const planColor = planColors[this.currentUser.plan] || planColors.free;
        const isGradient = this.currentUser.plan === 'gold';

        // Format expiry date
        let expiryText = 'Active';
        if (subscription && subscription.expiryDate && subscription.expiryDate !== 'lifetime') {
            const expiry = new Date(subscription.expiryDate);
            expiryText = 'Expires ' + expiry.toLocaleDateString();
        } else if (subscription && subscription.expiryDate === 'lifetime') {
            expiryText = 'Lifetime Access';
        }

        return `
            <div class="netflix-user-menu">
                <button class="netflix-user-trigger" id="netflix-user-btn">
                    <div class="user-avatar">
                        <span>${this.currentUser.fullName.charAt(0).toUpperCase()}</span>
                    </div>
                    <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 6l4 4 4-4"/>
                    </svg>
                </button>
                
                <div class="netflix-user-panel" id="netflix-user-panel">
                    <!-- User Header -->
                    <div class="panel-header">
                        <div class="user-info-card">
                            <div class="user-avatar-large">
                                <span>${this.currentUser.fullName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div class="user-details">
                                <h3>${this.currentUser.fullName}</h3>
                                <p class="user-email">${this.currentUser.email}</p>
                                <div class="user-plan-badge" style="background: ${isGradient ? planColor : 'none'}; background-color: ${isGradient ? 'transparent' : planColor};">
                                    ${this.currentUser.plan.toUpperCase()} MEMBER
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stats Grid -->
                    <div class="panel-stats">
                        <div class="stat-item">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <span class="stat-value">${savedCount}</span>
                                <span class="stat-label">My List</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">💎</div>
                            <div class="stat-info">
                                <span class="stat-value">${this.currentUser.plan.toUpperCase()}</span>
                                <span class="stat-label">Plan</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">⏰</div>
                            <div class="stat-info">
                                <span class="stat-value">${expiryText}</span>
                                <span class="stat-label">Status</span>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="panel-actions">
                        <a href="bookmarks.html" class="action-item">
                            <span class="action-icon">📖</span>
                            <span class="action-text">My List</span>
                            <span class="action-badge">${savedCount}</span>
                        </a>
                        <a href="membership.html" class="action-item">
                            <span class="action-icon">💳</span>
                            <span class="action-text">Membership</span>
                            ${this.currentUser.plan === 'free' ? '<span class="action-badge upgrade">Upgrade</span>' : ''}
                        </a>
                        <a href="profile.html" class="action-item">
                            <span class="action-icon">⚙️</span>
                            <span class="action-text">Settings</span>
                        </a>
                        ${this.currentUser.userId === 'admin' ? `
                            <a href="admin/index.html" class="action-item admin-link">
                                <span class="action-icon">👑</span>
                                <span class="action-text">Admin Panel</span>
                            </a>
                        ` : ''}
                    </div>

                    <!-- Logout -->
                    <div class="panel-footer">
                        <button class="logout-btn" id="netflix-logout-btn">
                            <span>🚪</span>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    attachListeners() {
        const triggerBtn = document.getElementById('netflix-user-btn');
        const logoutBtn = document.getElementById('netflix-logout-btn');
        
        if (triggerBtn) {
            triggerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePanel();
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    },

    togglePanel() {
        const panel = document.getElementById('netflix-user-panel');
        if (panel) {
            panel.classList.toggle('active');
        }
    },

    logout() {
        if (confirm('Sign out of GitHub CMS?')) {
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('adminAuth');
            window.location.href = 'auth.html';
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => UserAuth.init());

// Close panel on outside click
document.addEventListener('click', (e) => {
    const panel = document.getElementById('netflix-user-panel');
    if (panel && !e.target.closest('.netflix-user-menu')) {
        panel.classList.remove('active');
    }
});

window.UserAuth = UserAuth;
