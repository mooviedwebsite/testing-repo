// Load Users Page
async function loadUsersPage() {
    try {
        const users = await UserAuth.getAllUsers();
        const usersTable = document.getElementById('users-table');

        if (users.length === 0) {
            usersTable.innerHTML = '<p style="padding: 2rem; text-align: center;">No users yet</p>';
            return;
        }

        usersTable.innerHTML = `
            <div class="table-row table-header">
                <div>User</div>
                <div>Email</div>
                <div>Membership</div>
                <div>Status</div>
                <div>Joined</div>
                <div>Actions</div>
            </div>
            ${users.map(user => {
                const isActive = !user.membershipExpiry || new Date(user.membershipExpiry) > new Date();
                return `
                    <div class="table-row">
                        <div class="table-cell">
                            <strong>${user.fullName}</strong>
                            ${user.role === 'admin' ? '<span style="color: var(--admin-warning)"> (Admin)</span>' : ''}
                        </div>
                        <div class="table-cell">${user.email}</div>
                        <div class="table-cell">
                            ${UserAuth.getMembershipBadge(user.membership)}
                        </div>
                        <div class="table-cell">
                            <span style="color: ${isActive ? 'var(--admin-success)' : 'var(--admin-danger)'}">
                                ${isActive ? '✓ Active' : '✗ Expired'}
                            </span>
                        </div>
                        <div class="table-cell">${new Date(user.createdAt).toLocaleDateString()}</div>
                        <div class="table-cell table-actions">
                            <button class="btn-secondary btn-sm" onclick="viewUser('${user.id}')">View</button>
                            <button class="btn-secondary btn-sm" onclick="editUserMembership('${user.id}')">Edit Plan</button>
                            ${user.role !== 'admin' ? `<button class="btn-danger btn-sm" onclick="deleteUser('${user.id}')">Delete</button>` : ''}
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
async function viewUser(userId) {
    try {
        const users = await UserAuth.getAllUsers();
        const user = users.find(u => u.id === userId);

        if (!user) {
            alert('User not found');
            return;
        }

        // Get user's comments
        const comments = await GitHubAPI.getJSON('data/comments.json') || {};
        let userComments = 0;
        Object.values(comments).forEach(postComments => {
            userComments += postComments.filter(c => c.userId === userId).length;
        });

        // Get activities
        const activities = await GitHubAPI.getJSON('data/user-activities.json') || [];
        const userActivities = activities.filter(a => a.userId === userId).slice(0, 10);

        alert(`
USER DETAILS:
━━━━━━━━━━━━━━━━━━━━━━
Name: ${user.fullName}
Email: ${user.email}
Password: ${user.password}
Membership: ${user.membership.toUpperCase()}
Role: ${user.role}
Joined: ${new Date(user.createdAt).toLocaleDateString()}
Last Login: ${new Date(user.lastLogin).toLocaleDateString()}
Comments: ${userComments}

Expiry: ${user.membershipExpiry ? new Date(user.membershipExpiry).toLocaleDateString() : 'Lifetime'}

Recent Activities:
${userActivities.map(a => `• ${a.action} - ${new Date(a.timestamp).toLocaleString()}`).join('\n')}
        `);

    } catch (error) {
        console.error('Failed to view user:', error);
        alert('Failed to load user details');
    }
}

// Edit user membership
async function editUserMembership(userId) {
    const plan = prompt('Enter membership plan (free/pro/premium/gold):');
    if (!plan || !['free', 'pro', 'premium', 'gold'].includes(plan)) {
        alert('Invalid plan');
        return;
    }

    const duration = prompt('Enter duration (30days/1year/5years/lifetime):');
    if (!duration || !['30days', '1year', '5years', 'lifetime'].includes(duration)) {
        alert('Invalid duration');
        return;
    }

    try {
        const users = await UserAuth.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            alert('User not found');
            return;
        }

        // Calculate expiry
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

        // Update user
        users[userIndex].membership = plan;
        users[userIndex].membershipExpiry = expiry;

        await UserAuth.saveUsers(users);

        // Log activity
        await UserAuth.logActivity('admin', `Updated ${users[userIndex].fullName}'s membership to ${plan} (${duration})`);

        alert('Membership updated successfully!');
        loadUsersPage();

    } catch (error) {
        console.error('Failed to update membership:', error);
        alert('Failed to update membership');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const users = await UserAuth.getAllUsers();
        const filteredUsers = users.filter(u => u.id !== userId);

        await UserAuth.saveUsers(filteredUsers);

        alert('User deleted successfully');
        loadUsersPage();

    } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user');
    }
}

// Load Payments Page
async function loadPaymentsPage() {
    try {
        const payments = await GitHubAPI.getJSON('data/pending-payments.json') || [];
        const paymentsList = document.getElementById('payments-list');

        if (payments.length === 0) {
            paymentsList.innerHTML = '<p style="padding: 2rem; text-align: center;">No pending payments</p>';
            return;
        }

        paymentsList.innerHTML = `
            <div class="table-row table-header">
                <div>User</div>
                <div>Plan</div>
                <div>Amount</div>
                <div>Method</div>
                <div>Date</div>
                <div>Actions</div>
            </div>
            ${payments.map(payment => `
                <div class="table-row">
                    <div class="table-cell">
                        <strong>${payment.userName}</strong><br>
                        <small>${payment.userEmail}</small>
                    </div>
                    <div class="table-cell">${payment.plan.toUpperCase()}<br><small>${payment.duration}</small></div>
                    <div class="table-cell"><strong>$${payment.amount.toFixed(2)}</strong></div>
                    <div class="table-cell">${payment.method.toUpperCase()}</div>
                    <div class="table-cell">${new Date(payment.createdAt).toLocaleDateString()}</div>
                    <div class="table-cell table-actions">
                        <button class="btn-primary btn-sm" onclick="approvePayment('${payment.id}')">Approve</button>
                        <button class="btn-danger btn-sm" onclick="rejectPayment('${payment.id}')">Reject</button>
                    </div>
                </div>
            `).join('')}
        `;

    } catch (error) {
        console.error('Failed to load payments:', error);
    }
}

// Approve payment
async function approvePayment(paymentId) {
    try {
        const payments = await GitHubAPI.getJSON('data/pending-payments.json') || [];
        const payment = payments.find(p => p.id === paymentId);

        if (!payment) {
            alert('Payment not found');
            return;
        }

        // Calculate expiry based on duration
        let expiry = null;
        if (payment.duration !== 'lifetime') {
            const now = new Date();
            if (payment.duration === 'monthly') {
                now.setMonth(now.getMonth() + 1);
            } else if (payment.duration === 'yearly') {
                now.setFullYear(now.getFullYear() + 1);
            }
            expiry = now.toISOString();
        }

        // Update user membership
        const users = await UserAuth.getAllUsers();
        const userIndex = users.findIndex(u => u.id === payment.userId);

        if (userIndex !== -1) {
            users[userIndex].membership = payment.plan;
            users[userIndex].membershipExpiry = expiry;
            await UserAuth.saveUsers(users);
        }

        // Remove payment from pending
        const updatedPayments = payments.filter(p => p.id !== paymentId);
        const content = JSON.stringify(updatedPayments, null, 2);
        const file = await GitHubAPI.getFile('data/pending-payments.json');
        await GitHubAPI.createOrUpdateFile('data/pending-payments.json', content, 'Approve payment', file.sha);

        // Log activity
        await UserAuth.logActivity('admin', `Approved payment for ${payment.userName} - ${payment.plan}`);

        alert('Payment approved and membership activated!');
        loadPaymentsPage();

    } catch (error) {
        console.error('Failed to approve payment:', error);
        alert('Failed to approve payment');
    }
}

// Reject payment
async function rejectPayment(paymentId) {
    if (!confirm('Are you sure you want to reject this payment?')) return;

    try {
        const payments = await GitHubAPI.getJSON('data/pending-payments.json') || [];
        const updatedPayments = payments.filter(p => p.id !== paymentId);

        const content = JSON.stringify(updatedPayments, null, 2);
        const file = await GitHubAPI.getFile('data/pending-payments.json');
        await GitHubAPI.createOrUpdateFile('data/pending-payments.json', content, 'Reject payment', file.sha);

        alert('Payment rejected');
        loadPaymentsPage();

    } catch (error) {
        console.error('Failed to reject payment:', error);
        alert('Failed to reject payment');
    }
}

// Load Activities Page
async function loadActivitiesPage() {
    try {
        const activities = await GitHubAPI.getJSON('data/user-activities.json') || [];
        const activitiesList = document.getElementById('activities-list');

        activitiesList.innerHTML = activities.slice(0, 100).map(activity => `
            <div class="activity-item">
                <strong>${activity.userId === 'admin' ? 'Admin' : 'User'}</strong>: ${activity.action}
                <br><small>${new Date(activity.timestamp).toLocaleString()}</small>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load activities:', error);
    }
}

// Load Payment Config Page
async function loadPaymentConfigPage() {
    try {
        const config = await GitHubAPI.getJSON('data/payment-config.json');

        if (config) {
            if (config.paypal) {
                document.getElementById('paypal-email').value = config.paypal.email || '';
            }
            if (config.bank) {
                document.getElementById('bank-name').value = config.bank.name || '';
                document.getElementById('bank-account').value = config.bank.accountNumber || '';
                document.getElementById('bank-account-name').value = config.bank.accountName || '';
                document.getElementById('bank-swift').value = config.bank.swift || '';
            }
        }
    } catch (error) {
        console.log('No payment config yet');
    }
}

// Save Payment Config
async function savePaymentConfig() {
    try {
        const config = {
            paypal: {
                email: document.getElementById('paypal-email').value
            },
            bank: {
                name: document.getElementById('bank-name').value,
                accountNumber: document.getElementById('bank-account').value,
                accountName: document.getElementById('bank-account-name').value,
                swift: document.getElementById('bank-swift').value
            }
        };

        const content = JSON.stringify(config, null, 2);
        
        try {
            const file = await GitHubAPI.getFile('data/payment-config.json');
            await GitHubAPI.createOrUpdateFile('data/payment-config.json', content, 'Update payment config', file.sha);
        } catch {
            await GitHubAPI.createOrUpdateFile('data/payment-config.json', content, 'Create payment config');
        }

        alert('Payment settings saved successfully!');

    } catch (error) {
        console.error('Failed to save payment config:', error);
        alert('Failed to save payment settings');
    }
}

// Update the navigateTo function to include new pages
const originalNavigateTo = navigateTo;
navigateTo = function(page) {
    originalNavigateTo(page);
    
    if (page === 'users') loadUsersPage();
    if (page === 'payments') loadPaymentsPage();
    if (page === 'activities') loadActivitiesPage();
    if (page === 'payment-config') loadPaymentConfigPage();
};

// Add event listeners for new buttons
document.addEventListener('DOMContentLoaded', () => {
    const savePaymentConfigBtn = document.getElementById('save-payment-config');
    if (savePaymentConfigBtn) {
        savePaymentConfigBtn.addEventListener('click', savePaymentConfig);
    }

    const refreshPaymentsBtn = document.getElementById('refresh-payments');
    if (refreshPaymentsBtn) {
        refreshPaymentsBtn.addEventListener('click', loadPaymentsPage);
    }
});
