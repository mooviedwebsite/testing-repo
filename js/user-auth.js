/* ========================================
   USER AUTHENTICATION SYSTEM - FIXED
======================================== */

const UserAuth = {
    currentUser: null,
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxxhGkwRbJErCE05Z-TejfARFrdmQlp4ijNCSPSfnRlntgmk4re-fXUZiOFEAKLaEtz/exec',

    // Initialize
    init() {
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
            }
        }
    },

    // Update UI based on auth state
    updateUI() {
        const loginLink = document.querySelector('.login-link');
        const userAccount = document.querySelector('.user-account');

        if (this.currentUser) {
            // Hide login link
            if (loginLink) loginLink.style.display = 'none';

            // Show user account
            if (userAccount) {
                userAccount.style.display = 'flex';
                userAccount.innerHTML = `
                    <div class="user-menu">
                        <button class="user-btn" onclick="UserAuth.toggleMenu()">
                            <span class="user-icon">👤</span>
                            <span class="user-name">${this.currentUser.fullName}</span>
                            <span class="user-plan">${this.currentUser.plan.toUpperCase()}</span>
                        </button>
                        <div class="user-dropdown" id="user-dropdown">
                            <a href="profile.html">👤 Profile</a>
                            <a href="membership.html">💎 Membership</a>
                            ${this.currentUser.userId === 'admin' ? '<a href="admin/index.html">⚙️ Admin Panel</a>' : ''}
                            <a href="#" onclick="UserAuth.logout()">🚪 Logout</a>
                        </div>
                    </div>
                `;
            }
        } else {
            // Show login link
            if (loginLink) loginLink.style.display = 'block';
            
            // Hide user account
            if (userAccount) userAccount.style.display = 'none';
        }
    },

    // Toggle user menu
    toggleMenu() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    },

    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
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
        UserAuth.init();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('user-dropdown');
        
        if (userMenu && dropdown && !userMenu.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.UserAuth = UserAuth;
}
