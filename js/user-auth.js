/* ========================================
   USER AUTHENTICATION SYSTEM - FIXED
======================================== */

const UserAuth = {
    currentUser: null,
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxxhGkwRbJErCE05Z-TejfARFrdmQlp4ijNCSPSfnRlntgmk4re-fXUZiOFEAKLaEtz/exec',

    // Initialize
    init() {
        console.log('🔐 UserAuth initializing...');
        this.loadCurrentUser();
        this.updateUI();
    },

    // Load current user from localStorage
    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                console.log('✅ User loaded:', this.currentUser.email);
            } catch (error) {
                console.error('Failed to parse user data:', error);
                localStorage.removeItem('currentUser');
                this.currentUser = null;
            }
        } else {
            console.log('❌ No user logged in');
        }
    },

    // Update UI based on auth state
    updateUI() {
        console.log('🎨 Updating UI...');
        
        const loginLink = document.querySelector('.login-link');
        const userAccount = document.querySelector('.user-account');

        console.log('Login link element:', loginLink);
        console.log('User account element:', userAccount);

        if (this.currentUser) {
            console.log('👤 User is logged in, showing user menu');
            
            // Hide login link
            if (loginLink) {
                loginLink.style.display = 'none';
                console.log('✅ Login link hidden');
            }

            // Show user account
            if (userAccount) {
                userAccount.style.display = 'block';
                
                // Create user menu HTML
                const planBadgeClass = this.getPlanBadgeClass(this.currentUser.plan);
                
                userAccount.innerHTML = `
                    <div class="user-menu">
                        <button class="user-btn" onclick="UserAuth.toggleMenu(event)">
                            <span class="user-icon">👤</span>
                            <span class="user-name">${this.currentUser.fullName || 'User'}</span>
                            <span class="user-plan ${planBadgeClass}">${this.currentUser.plan.toUpperCase()}</span>
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
                            <a href="#" onclick="UserAuth.logout(); return false;">
                                <span class="dropdown-icon">🚪</span>
                                <span>Logout</span>
                            </a>
                        </div>
                    </div>
                `;
                
                console.log('✅ User menu created');
            }
        } else {
            console.log('🔓 No user logged in, showing login link');
            
            // Show login link
            if (loginLink) {
                loginLink.style.display = 'inline-block';
            }
            
            // Hide user account
            if (userAccount) {
                userAccount.style.display = 'none';
                userAccount.innerHTML = '';
            }
        }
    },

    // Get plan badge class
    getPlanBadgeClass(plan) {
        const planMap = {
            'free': 'plan-free',
            'pro': 'plan-pro',
            'premium': 'plan-premium',
            'gold': 'plan-gold',
            'admin': 'plan-admin'
        };
        return planMap[plan.toLowerCase()] || 'plan-free';
    },

    // Toggle user menu
toggleMenu(event) {
    console.log('🖱️ Toggle menu clicked');
    
    if (event) {
        event.stopPropagation();
        console.log('Event stopped');
    }
    
    const dropdown = document.getElementById('user-dropdown');
    console.log('Dropdown element:', dropdown);
    
    if (dropdown) {
        const isActive = dropdown.classList.contains('active');
        console.log('Is currently active:', isActive);
        
        // Close all dropdowns first
        document.querySelectorAll('.user-dropdown').forEach(d => {
            d.classList.remove('active');
        });
        
        // Toggle current dropdown
        if (!isActive) {
            dropdown.classList.add('active');
            console.log('✅ Dropdown opened - active class added');
            console.log('Dropdown classes:', dropdown.className);
        } else {
            console.log('✅ Dropdown closed');
        }
    } else {
        console.error('❌ Dropdown element not found!');
    }
},

    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            console.log('🚪 Logging out...');
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('adminAuth');
            this.currentUser = null;
            window.location.href = 'auth.html';
        }
    },

    // Check if user is logged in
    requireAuth() {
        if (!this.currentUser) {
            alert('Please login to continue');
            window.location.href = 'auth.html';
            return false;
        }
        return true;
    },

    // Check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.userId === 'admin';
    }
};

// Initialize on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM loaded, initializing UserAuth...');
        UserAuth.init();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('user-dropdown');
        
        if (dropdown && !e.target.closest('.user-menu')) {
            dropdown.classList.remove('active');
        }
    });
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.UserAuth = UserAuth;
}
