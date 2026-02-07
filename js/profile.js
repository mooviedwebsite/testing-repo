/* ========================================
   USER PROFILE MANAGEMENT
======================================== */

// Load profile on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!UserAuth.currentUser) {
        window.location.href = 'auth.html';
        return;
    }

    loadProfile();
});

// Load profile data
async function loadProfile() {
    const user = UserAuth.currentUser;

    // Avatar
    document.getElementById('avatar-initial').textContent = user.fullName.charAt(0).toUpperCase();

    // Basic info
    document.getElementById('profile-name').textContent = user.fullName;
    document.getElementById('profile-email').textContent = user.email;

    // Membership badge
    document.getElementById('profile-membership').innerHTML = UserAuth.getMembershipBadge(user.membership);

    // Stats
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    document.getElementById('stat-bookmarks').textContent = bookmarks.length;

    // Get comments count
    try {
        const comments = await GitHubAPI.getJSON('data/comments.json') || {};
        let userComments = 0;
        Object.values(comments).forEach(postComments => {
            userComments += postComments.filter(c => c.userId === user.id).length;
        });
        document.getElementById('stat-comments').textContent = userComments;
    } catch {
        document.getElementById('stat-comments').textContent = '0';
    }

    // Member since
    if (user.createdAt) {
        const created = new Date(user.createdAt);
        document.getElementById('stat-member-since').textContent = created.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
        });
    }

    // Membership details
    document.getElementById('current-plan').textContent = user.membership.toUpperCase();
    
    const isActive = checkMembershipExpiry(user);
    document.getElementById('membership-status').innerHTML = isActive 
        ? '<span style="color: var(--success)">✓ Active</span>'
        : '<span style="color: var(--danger)">✗ Expired</span>';
    
    document.getElementById('membership-expiry').textContent = getExpiryText(user);

    // Form values
    document.getElementById('edit-fullname').value = user.fullName;
    document.getElementById('edit-email').value = user.email;
}

// Update profile
async function updateProfile(event) {
    event.preventDefault();

    const newFullName = document.getElementById('edit-fullname').value;
    const newEmail = document.getElementById('edit-email').value;

    try {
        const users = await UserAuth.getAllUsers();
        const userIndex = users.findIndex(u => u.id === UserAuth.currentUser.id);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        // Check if email is taken by another user
        const emailTaken = users.find(u => u.email === newEmail && u.id !== UserAuth.currentUser.id);
        if (emailTaken) {
            throw new Error('Email already in use');
        }

        // Update user
        users[userIndex].fullName = newFullName;
        users[userIndex].email = newEmail;

        await UserAuth.saveUsers(users);

        // Update current user
        UserAuth.currentUser.fullName = newFullName;
        UserAuth.currentUser.email = newEmail;
        localStorage.setItem('current_user', JSON.stringify(UserAuth.currentUser));

        // Log activity
        await UserAuth.logActivity(UserAuth.currentUser.id, 'Profile updated');

        alert('Profile updated successfully!');
        loadProfile();

    } catch (error) {
        console.error('Failed to update profile:', error);
        alert(error.message || 'Failed to update profile');
    }
}

// Change password
async function changePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        const users = await UserAuth.getAllUsers();
        const userIndex = users.findIndex(u => u.id === UserAuth.currentUser.id);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        // Verify current password
        if (users[userIndex].password !== currentPassword) {
            throw new Error('Current password is incorrect');
        }

        // Update password
        users[userIndex].password = newPassword;
        await UserAuth.saveUsers(users);

        // Update current user
        UserAuth.currentUser.password = newPassword;
        localStorage.setItem('current_user', JSON.stringify(UserAuth.currentUser));

        // Log activity
        await UserAuth.logActivity(UserAuth.currentUser.id, 'Password changed');

        alert('Password changed successfully!');

        // Clear form
        document.getElementById('password-form').reset();

    } catch (error) {
        console.error('Failed to change password:', error);
        alert(error.message || 'Failed to change password');
    }
}

// Delete account
async function deleteAccount() {
    const confirm1 = confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirm1) return;

    const confirm2 = confirm('All your data will be permanently deleted. Are you absolutely sure?');
    if (!confirm2) return;

    try {
        const users = await UserAuth.getAllUsers();
        const filteredUsers = users.filter(u => u.id !== UserAuth.currentUser.id);

        await UserAuth.saveUsers(filteredUsers);

        // Log activity before logout
        await UserAuth.logActivity(UserAuth.currentUser.id, 'Account deleted');

        // Logout
        UserAuth.logout();

        alert('Account deleted successfully');

    } catch (error) {
        console.error('Failed to delete account:', error);
        alert('Failed to delete account');
    }
}

// Helper functions
function checkMembershipExpiry(user) {
    if (!user.membershipExpiry) return true;
    const expiry = new Date(user.membershipExpiry);
    return expiry > new Date();
}

function getExpiryText(user) {
    if (!user.membershipExpiry) {
        return user.membership === 'free' ? 'Forever' : 'Lifetime';
    }
    return new Date(user.membershipExpiry).toLocaleDateString();
}
