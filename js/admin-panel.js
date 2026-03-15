/* ========================================
   ADMIN PANEL - COMPLETE SYSTEM
======================================== */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxhGkwRbJErCE05Z-TejfARFrdmQlp4ijNCSPSfnRlntgmk4re-fXUZiOFEAKLaEtz/exec';

// Data storage
let allUsers = [];
let allPayments = [];
let allComments = [];
let allActivities = [];
let allSubscriptions = [];
let paymentConfig = null;

// Check authentication
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('adminAuth');
    if (!isAuthenticated) {
        window.location.href = '../auth.html';
    }
}

// Logout
function logout() {
    sessionStorage.removeItem('adminAuth');
    window.location.href = '../auth.html';
}

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('page-' + page).classList.add('active');
    event.target.closest('.nav-item').classList.add('active');
}

// Show loading
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

// Hide loading
function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// Load all data
async function loadAllData() {
    showLoading();
    
    try {
        await Promise.all([
            loadUsers(),
            loadPayments(),
            loadComments(),
            loadActivities(),
            loadSubscriptions(),
            loadPaymentConfig()
        ]);
        
        updateStats();
        renderDashboard();
        
    } catch (error) {
        console.error('Failed to load data:', error);
        alert('Failed to load data. Please refresh the page.');
    } finally {
        hideLoading();
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAllUsers`);
        allUsers = await response.json();
        renderUsers();
        return allUsers;
    } catch (error) {
        console.error('Failed to load users:', error);
        return [];
    }
}

// Load payments
async function loadPayments() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAllPayments`);
        allPayments = await response.json();
        renderPayments();
        return allPayments;
    } catch (error) {
        console.error('Failed to load payments:', error);
        return [];
    }
}

// Load comments
async function loadComments() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAllComments`);
        allComments = await response.json();
        renderComments();
        return allComments;
    } catch (error) {
        console.error('Failed to load comments:', error);
        return [];
    }
}

// Load activities
async function loadActivities() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getActivities`);
        allActivities = await response.json();
        renderActivities();
        return allActivities;
    } catch (error) {
        console.error('Failed to load activities:', error);
        return [];
    }
}

// Load subscriptions
async function loadSubscriptions() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAllSubscriptions`);
        allSubscriptions = await response.json();
        renderSubscriptions();
        return allSubscriptions;
    } catch (error) {
        console.error('Failed to load subscriptions:', error);
        return [];
    }
}

// Load payment config
async function loadPaymentConfig() {
    try {
        const response = await fetch('../data/admin-membership-info.json');
        paymentConfig = await response.json();
        populatePaymentSettings();
    } catch (error) {
        console.error('Failed to load payment config:', error);
    }
}

// Update stats
function updateStats() {
    const activeSubs = allSubscriptions.filter(s => s.status === 'active').length;
    const pendingPayments = allPayments.filter(p => p.status === 'pending').length;
    
    document.getElementById('stat-users').textContent = allUsers.length;
    document.getElementById('stat-active-subs').textContent = activeSubs;
    document.getElementById('stat-pending').textContent = pendingPayments;
    document.getElementById('stat-comments').textContent = allComments.length;
    
    document.getElementById('users-count').textContent = allUsers.length;
    document.getElementById('subscriptions-count').textContent = allSubscriptions.length;
    document.getElementById('pending-payments').textContent = pendingPayments;
    document.getElementById('comments-count').textContent = allComments.length;
}

// Render dashboard
function renderDashboard() {
    // Recent users
    const recentUsers = allUsers.slice(-5).reverse();
    const recentUsersHTML = recentUsers.map(user => `
        <tr>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.plan}">${user.plan.toUpperCase()}</span></td>
            <td>${new Date(user.created).toLocaleDateString()}</td>
        </tr>
    `).join('');
    document.getElementById('recent-users').innerHTML = recentUsersHTML || '<tr><td colspan="4">No users yet</td></tr>';
    
    // Recent activities
    const recentActivities = allActivities.slice(-10).reverse();
    const activitiesHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">📝</div>
            <div class="activity-content">
                <p><strong>${activity.action}</strong></p>
                <small>${activity.details}</small>
                <small class="activity-time">${formatTime(activity.timestamp)}</small>
            </div>
        </div>
    `).join('');
    document.getElementById('recent-activities').innerHTML = activitiesHTML || '<p>No activities yet</p>';
}

// Render users
function renderUsers() {
    const html = allUsers.map(user => `
        <tr>
            <td>${user.userId}</td>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td>${user.password}</td>
            <td><span class="badge ${user.plan}">${user.plan.toUpperCase()}</span></td>
            <td>${new Date(user.created).toLocaleDateString()}</td>
            <td>${new Date(user.lastLogin).toLocaleDateString()}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editUserPlan('${user.userId}', '${user.plan}')">Edit Plan</button>
                <button class="btn-action btn-delete" onclick="deleteUser('${user.userId}')">Delete</button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('users-tbody').innerHTML = html || '<tr><td colspan="8">No users found</td></tr>';
}

// Render subscriptions
function renderSubscriptions() {
    const html = allSubscriptions.map(sub => {
        const isExpired = sub.expiryDate !== 'lifetime' && new Date(sub.expiryDate) < new Date();
        const statusClass = sub.status === 'active' && !isExpired ? 'active' : 'inactive';
        
        return `
        <tr>
            <td>${sub.userEmail}</td>
            <td><span class="badge ${sub.plan}">${sub.plan.toUpperCase()}</span></td>
            <td><span class="status-badge ${statusClass}">${sub.status}</span></td>
            <td>${new Date(sub.startDate).toLocaleDateString()}</td>
            <td>${sub.expiryDate === 'lifetime' ? 'Lifetime' : new Date(sub.expiryDate).toLocaleDateString()}</td>
            <td>${sub.paymentMethod || 'N/A'}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editSubscription('${sub.subscriptionId}')">Edit</button>
                ${sub.status === 'active' ? 
                    `<button class="btn-action btn-delete" onclick="cancelSubscription('${sub.subscriptionId}')">Cancel</button>` : 
                    `<button class="btn-action btn-success" onclick="reactivateSubscription('${sub.subscriptionId}')">Reactivate</button>`
                }
            </td>
        </tr>
        `;
    }).join('');
    
    document.getElementById('subscriptions-tbody').innerHTML = html || '<tr><td colspan="7">No subscriptions found</td></tr>';
}

// Render payments
function renderPayments() {
    const html = allPayments.map(payment => `
        <tr>
            <td>${payment.paymentId}</td>
            <td>${payment.userName}<br><small>${payment.userEmail}</small></td>
            <td><span class="badge ${payment.plan}">${payment.plan.toUpperCase()}</span></td>
            <td>
                $${payment.amountUSD}<br>
                <small>LKR ${payment.amountLKR}</small>
            </td>
            <td>${payment.method.toUpperCase()}</td>
            <td><span class="status-badge ${payment.status}">${payment.status}</span></td>
            <td>${payment.transactionId || 'N/A'}</td>
            <td>${new Date(payment.created).toLocaleDateString()}</td>
            <td>
                ${payment.status === 'pending' ? `
                    <button class="btn-action btn-success" onclick="approvePayment('${payment.paymentId}')">Approve</button>
                    <button class="btn-action btn-delete" onclick="rejectPayment('${payment.paymentId}')">Reject</button>
                ` : `
                    <button class="btn-action" onclick="viewPaymentDetails('${payment.paymentId}')">View</button>
                `}
            </td>
        </tr>
    `).join('');
    
    document.getElementById('payments-tbody').innerHTML = html || '<tr><td colspan="9">No payments found</td></tr>';
}

// Render comments
function renderComments() {
    const html = allComments.map(comment => `
        <tr>
            <td>${comment.commentId}</td>
            <td>${comment.postId}</td>
            <td>${comment.userName}</td>
            <td>${comment.text}</td>
            <td>${new Date(comment.timestamp).toLocaleString()}</td>
            <td>
                <button class="btn-action btn-delete" onclick="deleteComment('${comment.commentId}')">Delete</button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('comments-tbody').innerHTML = html || '<tr><td colspan="6">No comments found</td></tr>';
}

// Render activities
function renderActivities() {
    const html = allActivities.map(activity => `
        <tr>
            <td>${activity.activityId}</td>
            <td>${activity.userId}</td>
            <td>${activity.action}</td>
            <td>${activity.details}</td>
            <td>${new Date(activity.timestamp).toLocaleString()}</td>
        </tr>
    `).join('');
    
    document.getElementById('activities-tbody').innerHTML = html || '<tr><td colspan="5">No activities found</td></tr>';
}

// Approve payment
async function approvePayment(paymentId) {
    if (!confirm('Approve this payment and activate subscription?')) return;
    
    showLoading();
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'updatePayment');
        formData.append('paymentId', paymentId);
        formData.append('status', 'approved');
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        alert('✅ Payment approved and subscription activated!');
        await loadAllData();
        
    } catch (error) {
        console.error('Failed to approve payment:', error);
        alert('Failed to approve payment');
    } finally {
        hideLoading();
    }
}

// Reject payment
async function rejectPayment(paymentId) {
    if (!confirm('Reject this payment?')) return;
    
    showLoading();
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'updatePayment');
        formData.append('paymentId', paymentId);
        formData.append('status', 'rejected');
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        alert('❌ Payment rejected');
        await loadAllData();
        
    } catch (error) {
        console.error('Failed to reject payment:', error);
        alert('Failed to reject payment');
    } finally {
        hideLoading();
    }
}

// View payment details
function viewPaymentDetails(paymentId) {
    const payment = allPayments.find(p => p.paymentId === paymentId);
    if (!payment) return;
    
    alert(`Payment Details:
    
Payment ID: ${payment.paymentId}
User: ${payment.userName} (${payment.userEmail})
Plan: ${payment.plan.toUpperCase()}
Amount: $${payment.amountUSD} / LKR ${payment.amountLKR}
Method: ${payment.method.toUpperCase()}
Status: ${payment.status.toUpperCase()}
Transaction ID: ${payment.transactionId || 'N/A'}
Notes: ${payment.notes || 'N/A'}
Created: ${new Date(payment.created).toLocaleString()}`);
}

// Edit user plan
async function editUserPlan(userId, currentPlan) {
    const newPlan = prompt(`Change plan for user (current: ${currentPlan})\n\nOptions: free, pro, premium, gold`, currentPlan);
    
    if (!newPlan || newPlan === currentPlan) return;
    if (!['free', 'pro', 'premium', 'gold'].includes(newPlan.toLowerCase())) {
        alert('Invalid plan. Choose: free, pro, premium, or gold');
        return;
    }
    
    showLoading();
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'updateUser');
        formData.append('userId', userId);
        formData.append('plan', newPlan.toLowerCase());
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        alert('✅ User plan updated!');
        await loadAllData();
        
    } catch (error) {
        console.error('Failed to update user:', error);
        alert('Failed to update user');
    } finally {
        hideLoading();
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Delete this user? This action cannot be undone!')) return;
    
    showLoading();
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'deleteUser');
        formData.append('userId', userId);
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        alert('✅ User deleted!');
        await loadAllData();
        
    } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user');
    } finally {
        hideLoading();
    }
}

// Delete comment
async function deleteComment(commentId) {
    if (!confirm('Delete this comment?')) return;
    
    showLoading();
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'deleteComment');
        formData.append('commentId', commentId);
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        alert('✅ Comment deleted!');
        await loadAllData();
        
    } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment');
    } finally {
        hideLoading();
    }
}

// Edit subscription
function editSubscription(subscriptionId) {
    alert('Edit subscription feature - Coming soon!');
}

// Cancel subscription
async function cancelSubscription(subscriptionId) {
    if (!confirm('Cancel this subscription?')) return;
    
    showLoading();
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'updateSubscription');
        formData.append('subscriptionId', subscriptionId);
        formData.append('status', 'cancelled');
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        alert('✅ Subscription cancelled!');
        await loadAllData();
        
    } catch (error) {
        console.error('Failed to cancel subscription:', error);
        alert('Failed to cancel subscription');
    } finally {
        hideLoading();
    }
}

// Reactivate subscription
async function reactivateSubscription(subscriptionId) {
    if (!confirm('Reactivate this subscription?')) return;
    
    showLoading();
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'updateSubscription');
        formData.append('subscriptionId', subscriptionId);
        formData.append('status', 'active');
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        alert('✅ Subscription reactivated!');
        await loadAllData();
        
    } catch (error) {
        console.error('Failed to reactivate subscription:', error);
        alert('Failed to reactivate subscription');
    } finally {
        hideLoading();
    }
}

// Filter table
function filterTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    }
}

// Filter subscriptions
function filterSubscriptions(filter) {
    document.querySelectorAll('#page-subscriptions .filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const rows = document.getElementById('subscriptions-tbody').getElementsByTagName('tr');
    
    for (let row of rows) {
        if (filter === 'all') {
            row.style.display = '';
        } else if (filter === 'active') {
            const status = row.querySelector('.status-badge');
            row.style.display = status && status.classList.contains('active') ? '' : 'none';
        } else {
            const badge = row.querySelector('.badge');
            row.style.display = badge && badge.textContent.toLowerCase() === filter ? '' : 'none';
        }
    }
}

// Filter payments
function filterPayments(filter) {
    document.querySelectorAll('#page-payments .filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const rows = document.getElementById('payments-tbody').getElementsByTagName('tr');
    
    for (let row of rows) {
        if (filter === 'all') {
            row.style.display = '';
        } else {
            const status = row.querySelector('.status-badge');
            row.style.display = status && status.classList.contains(filter) ? '' : 'none';
        }
    }
}

// Populate payment settings
function populatePaymentSettings() {
    if (!paymentConfig) return;
    
    // PayPal
    if (paymentConfig.paypal) {
        document.getElementById('paypal-enabled').checked = paymentConfig.paypal.enabled;
        document.getElementById('paypal-email').value = paymentConfig.paypal.email || '';
        document.getElementById('paypal-business').value = paymentConfig.paypal.businessName || '';
    }
    
    // Bank
    if (paymentConfig.bank) {
        document.getElementById('bank-enabled').checked = paymentConfig.bank.enabled;
        document.getElementById('bank-name').value = paymentConfig.bank.bankName || '';
        document.getElementById('bank-account').value = paymentConfig.bank.accountNumber || '';
        document.getElementById('bank-account-name').value = paymentConfig.bank.accountName || '';
        document.getElementById('bank-branch').value = paymentConfig.bank.branch || '';
        document.getElementById('bank-swift').value = paymentConfig.bank.swift || '';
    }
    
    // PayHere
    if (paymentConfig.payhere) {
        document.getElementById('payhere-enabled').checked = paymentConfig.payhere.enabled;
        document.getElementById('payhere-merchant-id').value = paymentConfig.payhere.merchantId || '';
        document.getElementById('payhere-merchant-secret').value = paymentConfig.payhere.merchantSecret || '';
        document.getElementById('payhere-business').value = paymentConfig.payhere.businessName || '';
    }
}

// Save payment settings
function savePaymentSettings() {
    const updatedConfig = {
        paypal: {
            enabled: document.getElementById('paypal-enabled').checked,
            email: document.getElementById('paypal-email').value,
            businessName: document.getElementById('paypal-business').value
        },
        bank: {
            enabled: document.getElementById('bank-enabled').checked,
            bankName: document.getElementById('bank-name').value,
            accountNumber: document.getElementById('bank-account').value,
            accountName: document.getElementById('bank-account-name').value,
            branch: document.getElementById('bank-branch').value,
            swift: document.getElementById('bank-swift').value,
            currency: 'LKR'
        },
        payhere: {
            enabled: document.getElementById('payhere-enabled').checked,
            merchantId: document.getElementById('payhere-merchant-id').value,
            merchantSecret: document.getElementById('payhere-merchant-secret').value,
            businessName: document.getElementById('payhere-business').value,
            apiUrl: 'https://sandbox.payhere.lk/pay/checkout',
            currency: 'LKR'
        },
        plans: paymentConfig.plans,
        emailSettings: paymentConfig.emailSettings
    };
    
    console.log('Updated config:', updatedConfig);
    alert('⚠️ Settings saved to console.\n\nTo apply changes:\n1. Copy the JSON from browser console\n2. Update data/admin-membership-info.json\n3. Commit to GitHub');
}

// Format time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
    return date.toLocaleDateString();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAllData();
});
