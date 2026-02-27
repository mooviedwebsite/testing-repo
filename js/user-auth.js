/* ========================================
   USER AUTHENTICATION SYSTEM - FIXED
======================================== */

const UserAuth = {
    currentUser: null,

    // Admin credentials (hardcoded)
    ADMIN_EMAIL: 'rawindunethsara93@gmail.com',
    ADMIN_PASSWORD: 'Rnd@12114',

    // Initialize
    init() {
        const savedUser = localStorage.getItem('current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }
    },

    // Get all users
    async getAllUsers() {
        try {
            return await GoogleSheetsAPI.getAllUsers();
        } catch (error) {
            console.error('Failed to get users:', error);
            return [];
        }
    },

    // Sign up new user
    async signup(userData) {
        try {
            const existingUser = await GoogleSheetsAPI.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('Email already registered');
            }

            await GoogleSheetsAPI.createUser({
                fullName: userData.fullName,
                email: userData.email,
                password: userData.password,
                membership: 'free',
                membershipExpiry: '',
                role: 'user'
            });

            const newUser = await GoogleSheetsAPI.getUserByEmail(userData.email);
            this.currentUser = newUser;
            localStorage.setItem('current_user', JSON.stringify(newUser));

            return newUser;
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        }
    },

    // Login - FIXED ADMIN CHECK
    async login(email, password) {
        try {
            console.log('Attempting login:', email);

            // ADMIN CHECK FIRST
            if (email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
                console.log('Admin login detected');
                
                const adminUser = {
                    userId: 'admin',
                    fullName: 'Administrator',
                    email: this.ADMIN_EMAIL,
                    role: 'admin',
                    membership: 'gold',
                    membershipExpiry: null,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };

                this.currentUser = adminUser;
                localStorage.setItem('current_user', JSON.stringify(adminUser));
                
                await GoogleSheetsAPI.logActivity('admin', 'Admin logged in', this.ADMIN_EMAIL);
                
                return adminUser;
            }

            // Regular user login
            console.log('Checking regular user login');
            const user = await GoogleSheetsAPI.login(email, password);

            if (!user) {
                throw new Error('Invalid email or password');
            }

            this.currentUser = user;
            localStorage.setItem('current_user', JSON.stringify(user));

            return user;

        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('current_user');
        window.location.href = 'index.html';
    },

    // Update UI - IMPROVED
    updateUI() {
        const loginLinks = document.querySelectorAll('.login-link');
        const userAccountIcons = document.querySelectorAll('.user-account');

        if (this.currentUser) {
            loginLinks.forEach(link => link.style.display = 'none');
            userAccountIcons.forEach(icon => {
                icon.style.display = 'block';
                icon.innerHTML = this.getUserIconHTML();
            });
        } else {
            loginLinks.forEach(link => link.style.display = 'block');
            userAccountIcons.forEach(icon => icon.style.display = 'none');
        }
    },

    // Get user icon HTML - SIMPLIFIED
    getUserIconHTML() {
        const initial = this.currentUser.fullName.charAt(0).toUpperCase();
        const membershipClass = `badge-${this.currentUser.membership}`;
        
        // Get bookmark count
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const bookmarkCount = bookmarks.length;

        return `
            <div class="user-icon" onclick="toggleUserDropdown()">
                <span class="user-initial">${initial}</span>
                <span class="user-membership-indicator ${membershipClass}"></span>
            </div>
            <div class="user-dropdown" id="user-dropdown">
                <div class="user-dropdown-header">
                    <div class="user-avatar-large">${initial}</div>
                    <div class="user-info">
                        <strong>${this.currentUser.fullName}</strong>
                        <span class="membership-badge ${membershipClass}">
                            ${this.currentUser.membership.toUpperCase()}
                        </span>
                    </div>
                </div>
                
                <div class="user-stats">
                    <div class="stat">
                        <span class="stat-value">${bookmarkCount}</span>
                        <span class="stat-label">Bookmarks</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${this.currentUser.totalComments || 0}</span>
                        <span class="stat-label">Comments</span>
                    </div>
                </div>

                ${this.currentUser.role === 'admin' ? `
                    <a href="admin/index.html" class="user-dropdown-item">
                        <span class="icon">⚙️</span>
                        <span>Admin Panel</span>
                    </a>
                ` : ''}
                <a href="profile.html" class="user-dropdown-item">
                    <span class="icon">👤</span>
                    <span>My Profile</span>
                </a>
                <a href="membership.html" class="user-dropdown-item">
                    <span class="icon">⭐</span>
                    <span>Membership</span>
                </a>
                <a href="bookmarks.html" class="user-dropdown-item">
                    <span class="icon">🔖</span>
                    <span>My Bookmarks</span>
                    ${bookmarkCount > 0 ? `<span class="badge">${bookmarkCount}</span>` : ''}
                </a>
                <div class="user-dropdown-divider"></div>
                <div class="user-dropdown-item logout-item" onclick="UserAuth.logout()">
                    <span class="icon">🚪</span>
                    <span>Logout</span>
                </div>
            </div>
        `;
    },

    // Get membership badge
    getMembershipBadge(membership) {
        const badges = {
            free: '<span class="membership-badge badge-free">FREE</span>',
            pro: '<span class="membership-badge badge-pro">PRO</span>',
            premium: '<span class="membership-badge badge-premium">PREMIUM</span>',
            gold: '<span class="membership-badge badge-gold">GOLD</span>'
        };
        return badges[membership] || badges.free;
    },

    // Check active membership
    hasActiveMembership(level) {
        if (!this.currentUser) return false;
        
        const levels = ['free', 'pro', 'premium', 'gold'];
        const currentLevel = levels.indexOf(this.currentUser.membership);
        const requiredLevel = levels.indexOf(level);

        if (currentLevel < requiredLevel) return false;

        if (this.currentUser.membershipExpiry) {
            const expiry = new Date(this.currentUser.membershipExpiry);
            if (expiry < new Date()) return false;
        }

        return true;
    },

    // Add/Remove bookmark
    toggleBookmark(post) {
        let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const index = bookmarks.findIndex(b => b.id === post.id);

        if (index > -1) {
            bookmarks.splice(index, 1);
        } else {
            bookmarks.push(post);
        }

        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        
        // Update UI if user dropdown is open
        if (this.currentUser) {
            this.updateUI();
        }

        return index === -1; // Return true if bookmarked, false if removed
    },

    // Check if post is bookmarked
    isBookmarked(postId) {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        return bookmarks.some(b => b.id === postId);
    }
};

// Toggle user dropdown
function toggleUserDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-account')) {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
});

// Handle login form - FIXED
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    try {
        console.log('Login attempt for:', email);
        const user = await UserAuth.login(email, password);
        
        console.log('Login successful:', user);
        
        // Redirect based on role
        if (user.role === 'admin') {
            window.location.href = 'admin/index.html';
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Login failed. Please check your credentials.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle signup form
async function handleSignup(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('signup-fullname').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;

    try {
        await UserAuth.signup({ fullName, email, password });
        window.location.href = 'index.html';
    } catch (error) {
        alert(error.message || 'Signup failed');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Switch forms
function switchToSignup() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.add('active');
}

function switchToLogin() {
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    UserAuth.init();
});
