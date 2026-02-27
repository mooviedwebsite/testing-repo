/* ========================================
   ADMIN PANEL - DUAL LOGIN SYSTEM
   Supports GitHub Token OR Email/Password
======================================== */

// Admin credentials
const ADMIN_EMAIL = 'rawindunethsara93@gmail.com';
const ADMIN_PASSWORD = 'Rnd@12114';

let isAuthenticated = false;
let loginMethod = null; // 'github' or 'credentials'
let currentPosts = [];
let currentEditingPost = null;

// Initialize Admin Panel
function initAdmin() {
    // Check if already authenticated
    const savedMethod = localStorage.getItem('admin_login_method');
    const savedToken = localStorage.getItem('github_token');
    const savedRepo = localStorage.getItem('github_repo');
    const savedAdmin = localStorage.getItem('admin_user');

    if (savedMethod === 'github' && savedToken && savedRepo) {
        loginWithGitHub(savedToken, savedRepo);
    } else if (savedMethod === 'credentials' && savedAdmin) {
        const adminUser = JSON.parse(savedAdmin);
        showAdminPanel(adminUser);
    } else {
        showAuthScreen();
    }
}

// Show auth screen
function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
}

// Show admin panel
function showAdminPanel(user) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    
    // Display admin name
    if (user) {
        document.getElementById('admin-user-name').textContent = user.fullName || user.email;
    }
    
    isAuthenticated = true;
    loadDashboard();
}

// Switch login tabs
function switchLoginTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + '-login-tab').classList.add('active');
}

// Handle GitHub Login
async function handleGitHubLogin(event) {
    event.preventDefault();
    
    const token = document.getElementById('token-input').value.trim();
    const repo = document.getElementById('repo-input').value.trim();

    if (!token || !repo) {
        alert('Please enter both token and repository');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    try {
        await loginWithGitHub(token, repo);
    } catch (error) {
        alert('Login failed. Please check your credentials.');
        submitBtn.textContent = 'Login with GitHub';
        submitBtn.disabled = false;
    }
}

// Login with GitHub Token
async function loginWithGitHub(token, repo) {
    try {
        // Initialize GitHub API
        GitHubAPI.init(token, repo);
        
        // Test connection
        await GitHubAPI.getConfig();
        
        // Save credentials
        localStorage.setItem('github_token', token);
        localStorage.setItem('github_repo', repo);
        localStorage.setItem('admin_login_method', 'github');
        
        loginMethod = 'github';
        
        const adminUser = {
            fullName: 'GitHub Admin',
            email: 'admin@github.com',
            role: 'admin'
        };
        
        showAdminPanel(adminUser);
        
    } catch (error) {
        console.error('GitHub login failed:', error);
        throw error;
    }
}

// Handle Credentials Login
async function handleCredentialsLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    try {
        // Check admin credentials
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            const adminUser = {
                userId: 'admin',
                fullName: 'Administrator',
                email: ADMIN_EMAIL,
                role: 'admin'
            };

            localStorage.setItem('admin_user', JSON.stringify(adminUser));
            localStorage.setItem('admin_login_method', 'credentials');
            
            loginMethod = 'credentials';
            
            // Log activity
            await GoogleSheetsAPI.logActivity('admin', 'Admin logged in', ADMIN_EMAIL);
            
            showAdminPanel(adminUser);
        } else {
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        alert('Invalid email or password');
        submitBtn.textContent = 'Login as Admin';
        submitBtn.disabled = false;
    }
}

// Logout
function logout() {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_repo');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_login_method');
    
    isAuthenticated = false;
    loginMethod = null;
    
    showAuthScreen();
}

// Load Dashboard
async function loadDashboard() {
    try {
        // Get stats from Google Sheets
        const stats = await GoogleSheetsAPI.getStats();
        
        document.getElementById('total-users').textContent = stats.totalUsers || 0;
        document.getElementById('pending-payments').textContent = stats.pendingPayments || 0;
        
        // Get posts if GitHub is connected
        if (loginMethod === 'github') {
            const posts = await GitHubAPI.getPosts();
            document.getElementById('total-posts').textContent = posts.length;
            
            const avgRating = posts.length > 0 
                ? (posts.reduce((sum, p) => sum + p.rating, 0) / posts.length).toFixed(1)
                : 0;
            document.getElementById('avg-rating').textContent = avgRating;
        }
        
        // Load recent activities
        const activities = await GoogleSheetsAPI.getActivities();
        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = activities.slice(0, 10).map(activity => `
            <div class="activity-item">
                📝 ${activity.action} - ${new Date(activity.timestamp).toLocaleString()}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// Load Users Page
async function loadUsersPage() {
    try {
        const users = await GoogleSheetsAPI.getAllUsers();
        const usersTable = document.getElementById('users-table');

        if (users.length === 0) {
            usersTable.innerHTML = '<p style="padding: 2rem; text-align: center;">No users yet</p>';
            return;
        }

        usersTable.innerHTML = `
            <div class="table-row table-header">
                <div>User</div>
                <div>Email</div>
                <div>Password</div>
                <div>Membership</div>
                <div>Status</div>
                <div>Actions</div>
            </div>
            ${users.map(user => {
                const isActive = !user.membershipExpiry || new Date(user.membershipExpiry) > new Date();
                return `
                    <div class="table-row">
                        <div class="table-cell">
                            <strong>${user.fullName}</strong>
                        </div>
                        <div class="table-cell">${user.email}</div>
                        <div class="table-cell">
                            <code style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 4px;">
                                ${user.password}
                            </code>
                        </div>
                        <div class="table-cell">
                            <span class="membership-badge badge-${user.membership}">
                                ${user.membership.toUpperCase()}
                            </span>
                        </div>
                        <div class="table-cell">
                            <span style="color: ${isActive ? 'var(--admin-success)' : 'var(--admin-danger)'}">
                                ${isActive ? '✓ Active' : '✗ Expired'}
                            </span>
                        </div>
                        <div class="table-cell table-actions">
                            <button class="btn-secondary btn-sm" onclick="viewUserDetails('${user.userId}')">View</button>
                            <button class="btn-secondary btn-sm" onclick="editUserMembership('${user.userId}')">Edit Plan</button>
                            ${user.role !== 'admin' ? `<button class="btn-danger btn-sm" onclick="deleteUser('${user.userId}')">Delete</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// View user details
async function viewUserDetails(userId) {
    try {
        const users = await GoogleSheetsAPI.getAllUsers();
        const user = users.find(u => u.userId === userId);

        if (!user) {
            alert('User not found');
            return;
        }

        const activities = await GoogleSheetsAPI.getActivities(userId);
        
        alert(`
═══════════════════════════
USER DETAILS
═══════════════════════════

👤 Full Name: ${user.fullName}
📧 Email: ${user.email}
🔐 Password: ${user.password}
⭐ Membership: ${user.membership.toUpperCase()}
👔 Role: ${user.role}
📅 Joined: ${new Date(user.createdAt).toLocaleDateString()}
🕐 Last Login: ${new Date(user.lastLogin).toLocaleDateString()}
💬 Total Comments: ${user.totalComments || 0}
🔖 Bookmarks: ${user.bookmarks || 0}

📆 Expiry: ${user.membershipExpiry ? new Date(user.membershipExpiry).toLocaleDateString() : 'Lifetime'}

━━━━━━━━━━━━━━━━━━━━━━━━
Recent Activities:
${activities.slice(0, 5).map(a => `• ${a.action}\n  ${new Date(a.timestamp).toLocaleString()}`).join('\n\n')}
        `.trim());

    } catch (error) {
        console.error('Failed to view user:', error);
        alert('Failed to load user details');
    }
}

// Edit user membership
async function editUserMembership(userId) {
    const plan = prompt('Enter membership plan:\n\nfree\npro\npremium\ngold');
    if (!plan || !['free', 'pro', 'premium', 'gold'].includes(plan)) {
        alert('Invalid plan');
        return;
    }

    const duration = prompt('Enter duration:\n\n30days\n1year\n5years\nlifetime');
    if (!duration || !['30days', '1year', '5years', 'lifetime'].includes(duration)) {
        alert('Invalid duration');
        return;
    }

    try {
        let expiry = null;
        if (duration !== 'lifetime') {
            const now = new Date();
            if (duration === '30days') {
                now.setDate(now.getDate() + 30);
            } else if (duration === '1year') {
                now.setFullYear(now.getFullYear() + 1);
            } else if (duration === '5years') {
                now.setFullYear(now.getFullYear() + 5);
            }
            expiry = now.toISOString();
        }

        await GoogleSheetsAPI.updateUser(userId, {
            membership: plan,
            membershipExpiry: expiry || ''
        });

        await GoogleSheetsAPI.logActivity('admin', `Updated user ${userId} membership to ${plan}`, ADMIN_EMAIL);

        alert('✅ Membership updated successfully!');
        loadUsersPage();

    } catch (error) {
        console.error('Failed to update membership:', error);
        alert('Failed to update membership');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('⚠️ Are you sure you want to delete this user?\n\nThis action cannot be undone.')) return;

    try {
        await GoogleSheetsAPI.deleteUser(userId);
        alert('✅ User deleted successfully');
        loadUsersPage();
    } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user');
    }
}

// Load Payments Page
async function loadPaymentsPage() {
    try {
        const payments = await GoogleSheetsAPI.getAllPayments();
        const paymentsList = document.getElementById('payments-list');

        const pendingPayments = payments.filter(p => p.status === 'pending');

        if (pendingPayments.length === 0) {
            paymentsList.innerHTML = '<p style="padding: 2rem; text-align: center;">No pending payments</p>';
            return;
        }

        paymentsList.innerHTML = `
            <div class="table-row table-header">
                <div>User</div>
                <div>Plan</div>
                <div>Amount</div>
                <div>Method</div>
                <div>Transaction ID</div>
                <div>Date</div>
                <div>Actions</div>
            </div>
            ${pendingPayments.map(payment => `
                <div class="table-row">
                    <div class="table-cell">
                        <strong>${payment.userName}</strong><br>
                        <small>${payment.userEmail}</small>
                    </div>
                    <div class="table-cell">
                        ${payment.plan.toUpperCase()}<br>
                        <small>${payment.duration}</small>
                    </div>
                    <div class="table-cell">
                        <strong>$${parseFloat(payment.amount).toFixed(2)}</strong>
                    </div>
                    <div class="table-cell">${payment.method.toUpperCase()}</div>
                    <div class="table-cell">
                        <code style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                            ${payment.transactionId || 'N/A'}
                        </code>
                    </div>
                    <div class="table-cell">${new Date(payment.createdAt).toLocaleDateString()}</div>
                    <div class="table-cell table-actions">
                        <button class="btn-primary btn-sm" onclick="approvePayment('${payment.paymentId}', '${payment.userId}', '${payment.plan}', '${payment.duration}')">
                            ✓ Approve
                        </button>
                        <button class="btn-danger btn-sm" onclick="rejectPayment('${payment.paymentId}')">
                            ✗ Reject
                        </button>
                    </div>
                </div>
            `).join('')}
        `;

    } catch (error) {
        console.error('Failed to load payments:', error);
    }
}

// Approve payment
async function approvePayment(paymentId, userId, plan, duration) {
    if (!confirm('✅ Approve this payment and activate membership?')) return;

    try {
        // Calculate expiry
        let expiry = null;
        if (duration !== 'lifetime') {
            const now = new Date();
            if (duration === 'monthly') {
                now.setMonth(now.getMonth() + 1);
            } else if (duration === 'yearly') {
                now.setFullYear(now.getFullYear() + 1);
            }
            expiry = now.toISOString();
        }

        // Update user membership
        await GoogleSheetsAPI.updateUser(userId, {
            membership: plan,
            membershipExpiry: expiry || ''
        });

        // Update payment status
        await GoogleSheetsAPI.updatePayment(paymentId, 'approved');

        // Log activity
        await GoogleSheetsAPI.logActivity('admin', `Approved payment ${paymentId} for user ${userId}`, ADMIN_EMAIL);

        alert('✅ Payment approved and membership activated!');
        loadPaymentsPage();

    } catch (error) {
        console.error('Failed to approve payment:', error);
        alert('Failed to approve payment');
    }
}

// Reject payment
async function rejectPayment(paymentId) {
    if (!confirm('❌ Reject this payment request?')) return;

    try {
        await GoogleSheetsAPI.updatePayment(paymentId, 'rejected');
        alert('❌ Payment rejected');
        loadPaymentsPage();
    } catch (error) {
        console.error('Failed to reject payment:', error);
        alert('Failed to reject payment');
    }
}

// Load Activities Page
async function loadActivitiesPage() {
    try {
        const activities = await GoogleSheetsAPI.getActivities();
        const activitiesList = document.getElementById('activities-list');

        activitiesList.innerHTML = activities.slice(0, 100).map(activity => `
            <div class="activity-item">
                <strong>${activity.userId === 'admin' ? '🔐 Admin' : '👤 ' + (activity.email || 'User')}</strong>: ${activity.action}
                <br><small>🕐 ${new Date(activity.timestamp).toLocaleString()}</small>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load activities:', error);
    }
}

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    const titles = {
        dashboard: 'Dashboard',
        posts: 'Posts',
        users: 'Users',
        payments: 'Pending Payments',
        activities: 'User Activities',
        media: 'Media',
        settings: 'Settings',
        'payment-config': 'Payment Configuration'
    };
    document.getElementById('page-title').textContent = titles[page];
    
    if (page === 'users') loadUsersPage();
    if (page === 'payments') loadPaymentsPage();
    if (page === 'activities') loadActivitiesPage();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
    
    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // Navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.getAttribute('data-page'));
        });
    });
    
    // Sync button
    document.getElementById('sync-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('sync-btn');
        btn.textContent = '⏳';
        await loadDashboard();
        setTimeout(() => btn.textContent = '🔄', 1000);
    });
});
