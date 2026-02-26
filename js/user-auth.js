/* ========================================
   USER AUTHENTICATION SYSTEM
   Using Google Sheets as backend
======================================== */

const UserAuth = {
    currentUser: null,

    // Initialize
    init() {
        // Check if user is logged in
        const savedUser = localStorage.getItem('current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }
    },

    // Admin credentials (hardcoded)
    ADMIN_EMAIL: 'rawindunethsara93@gmail.com',
    ADMIN_PASSWORD: 'Rnd@12114',

    // Get all users from Google Sheets
    async getAllUsers() {
        try {
            const users = await GoogleSheetsAPI.getAllUsers();
            return users;
        } catch (error) {
            console.error('Failed to get users:', error);
            return [];
        }
    },

    // Sign up new user
    async signup(userData) {
        try {
            // Check if email exists
            const existingUser = await GoogleSheetsAPI.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('Email already registered');
            }

            // Create new user in Google Sheets
            await GoogleSheetsAPI.createUser({
                fullName: userData.fullName,
                email: userData.email,
                password: userData.password,
                membership: 'free',
                membershipExpiry: '',
                role: 'user'
            });

            // Get the created user
            const newUser = await GoogleSheetsAPI.getUserByEmail(userData.email);

            // Auto login
            this.currentUser = newUser;
            localStorage.setItem('current_user', JSON.stringify(newUser));

            return newUser;

        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        }
    },

    // Login
    async login(email, password) {
        try {
            // Check if admin
            if (email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
                const adminUser = {
                    userId: 'admin',
                    fullName: 'Administrator',
                    email: this.ADMIN_EMAIL,
                    role: 'admin',
                    membership: 'gold',
                    membershipExpiry: null,
                    lastLogin: new Date().toISOString()
                };

                this.currentUser = adminUser;
                localStorage.setItem('current_user', JSON.stringify(adminUser));
                
                // Log admin login
                await GoogleSheetsAPI.logActivity('admin', 'Admin logged in', this.ADMIN_EMAIL);
                
                return adminUser;
            }

            // Regular user login using Google Sheets
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

    // Update UI based on login state
    updateUI() {
        const loginLinks = document.querySelectorAll('.login-link');
        const userAccountIcons = document.querySelectorAll('.user-account');

        if (this.currentUser) {
            // Hide login links
            loginLinks.forEach(link => link.style.display = 'none');

            // Show user account icon
            userAccountIcons.forEach(icon => {
                icon.style.display = 'block';
                icon.innerHTML = this.getUserIconHTML();
            });
        } else {
            // Show login links
            loginLinks.forEach(link => link.style.display = 'block');

            // Hide user account icon
            userAccountIcons.forEach(icon => icon.style.display = 'none');
        }
    },

    // Get user icon HTML
    getUserIconHTML() {
        const initial = this.currentUser.fullName.charAt(0).toUpperCase();
        const membershipBadge = this.getMembershipBadge(this.currentUser.membership);

        return `
            <div class="user-icon" onclick="toggleUserDropdown()">
                ${initial}
            </div>
            <div class="user-dropdown" id="user-dropdown">
                <div class="user-dropdown-header">
                    <strong>${this.currentUser.fullName}</strong>
                    ${membershipBadge}
                    <p>${this.currentUser.email}</p>
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
                    <span>Bookmarks</span>
                </a>
                <div class="user-dropdown-item" onclick="UserAuth.logout()">
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

    // Check if user has active membership
    hasActiveMembership(level) {
        if (!this.currentUser) return false;
        
        const levels = ['free', 'pro', 'premium', 'gold'];
        const currentLevel = levels.indexOf(this.currentUser.membership);
        const requiredLevel = levels.indexOf(level);

        if (currentLevel < requiredLevel) return false;

        // Check expiry
        if (this.currentUser.membershipExpiry) {
            const expiry = new Date(this.currentUser.membershipExpiry);
            if (expiry < new Date()) {
                return false;
            }
        }

        return true;
    },

    // Add comment to post
    async addComment(postId, commentText) {
        if (!this.currentUser) {
            throw new Error('Please login to comment');
        }

        try {
            await GoogleSheetsAPI.addComment({
                postId: postId,
                userId: this.currentUser.userId,
                userName: this.currentUser.fullName,
                userMembership: this.currentUser.membership,
                text: commentText
            });

            // Log activity
            await GoogleSheetsAPI.logActivity(
                this.currentUser.userId, 
                `Commented on post ${postId}`,
                this.currentUser.email
            );

        } catch (error) {
            console.error('Failed to add comment:', error);
            throw error;
        }
    },

    // Get comments for post
    async getComments(postId) {
        try {
            return await GoogleSheetsAPI.getComments(postId);
        } catch (error) {
            console.error('Failed to get comments:', error);
            return [];
        }
    }
};

// Toggle user dropdown
function toggleUserDropdown() {
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

// Handle login form
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await UserAuth.login(email, password);
        
        // Redirect based on role
        if (UserAuth.currentUser.role === 'admin') {
            window.location.href = 'admin/index.html';
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        alert(error.message);
    }
}

// Handle signup form
async function handleSignup(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('signup-fullname').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        await UserAuth.signup({ fullName, email, password });
        window.location.href = 'index.html';
    } catch (error) {
        alert(error.message);
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    UserAuth.init();
});
