/* ========================================
   GOOGLE SHEETS API INTEGRATION
   All user data stored in Google Sheets
======================================== */

const GoogleSheetsAPI = {
    // Your Google Apps Script Web App URL
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwfx20asaL98WcS0LyPyYutKLdi8or2y8kf20bgjWQsLqLd188us0PGlzAen0mvyCYy/exec',
    
    // Spreadsheet ID (extracted from your URL)
    SPREADSHEET_ID: '1si2VC7we2EvO9udgEjPT6wd4yml_Ufd4lABx2_bk85w',

    // Make API request to Google Sheets
    async request(action, data = {}) {
        try {
            const payload = {
                action: action,
                ...data
            };

            const response = await fetch(this.SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Important for cross-origin requests
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            // Note: With no-cors, we can't read the response
            // So we'll use GET requests for reading data
            if (action.startsWith('get')) {
                const getResponse = await fetch(`${this.SCRIPT_URL}?action=${action}&${new URLSearchParams(data)}`);
                return await getResponse.json();
            }

            return { success: true };

        } catch (error) {
            console.error('Google Sheets API Error:', error);
            throw error;
        }
    },

    // === USER OPERATIONS ===

    // Get all users
    async getAllUsers() {
        try {
            const response = await fetch(`${this.SCRIPT_URL}?action=getAllUsers`);
            const data = await response.json();
            return data.users || [];
        } catch (error) {
            console.error('Failed to get users:', error);
            return [];
        }
    },

    // Get single user by email
    async getUserByEmail(email) {
        try {
            const response = await fetch(`${this.SCRIPT_URL}?action=getUserByEmail&email=${encodeURIComponent(email)}`);
            const data = await response.json();
            return data.user || null;
        } catch (error) {
            console.error('Failed to get user:', error);
            return null;
        }
    },

    // Get user by ID
    async getUserById(userId) {
        try {
            const response = await fetch(`${this.SCRIPT_URL}?action=getUserById&userId=${userId}`);
            const data = await response.json();
            return data.user || null;
        } catch (error) {
            console.error('Failed to get user:', error);
            return null;
        }
    },

    // Create new user
    async createUser(userData) {
        try {
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'createUser',
                    fullName: userData.fullName,
                    email: userData.email,
                    password: userData.password,
                    membership: userData.membership || 'free',
                    membershipExpiry: userData.membershipExpiry || '',
                    role: userData.role || 'user'
                })
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    },

    // Update user
    async updateUser(userId, userData) {
        try {
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'updateUser',
                    userId: userId,
                    ...userData
                })
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    },

    // Delete user
    async deleteUser(userId) {
        try {
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'deleteUser',
                    userId: userId
                })
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to delete user:', error);
            throw error;
        }
    },

    // Login (verify credentials)
    async login(email, password) {
        try {
            const response = await fetch(`${this.SCRIPT_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            const data = await response.json();
            
            if (data.success && data.user) {
                // Update last login time
                await this.logActivity(data.user.userId, 'User logged in', email);
                return data.user;
            }
            
            return null;
        } catch (error) {
            console.error('Login failed:', error);
            return null;
        }
    },

    // === ACTIVITY LOGGING ===

    // Log user activity
    async logActivity(userId, action, email = '') {
        try {
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'logActivity',
                    userId: userId,
                    activityAction: action,
                    email: email,
                    timestamp: new Date().toISOString()
                })
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    },

    // Get user activities
    async getUserActivities(userId = '') {
        try {
            const response = await fetch(`${this.SCRIPT_URL}?action=getActivities&userId=${userId}`);
            const data = await response.json();
            return data.activities || [];
        } catch (error) {
            console.error('Failed to get activities:', error);
            return [];
        }
    },

    // === PAYMENT OPERATIONS ===

    // Create payment request
    async createPayment(paymentData) {
        try {
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'createPayment',
                    userId: paymentData.userId,
                    userName: paymentData.userName,
                    userEmail: paymentData.userEmail,
                    plan: paymentData.plan,
                    duration: paymentData.duration,
                    amount: paymentData.amount,
                    method: paymentData.method,
                    status: 'pending'
                })
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to create payment:', error);
            throw error;
        }
    },

    // Get all payments
    async getAllPayments() {
        try {
            const response = await fetch(`${this.SCRIPT_URL}?action=getAllPayments`);
            const data = await response.json();
            return data.payments || [];
        } catch (error) {
            console.error('Failed to get payments:', error);
            return [];
        }
    },

    // Update payment status
    async updatePaymentStatus(paymentId, status) {
        try {
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'updatePayment',
                    paymentId: paymentId,
                    status: status
                })
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to update payment:', error);
            throw error;
        }
    },

    // === COMMENTS OPERATIONS ===

    // Add comment
    async addComment(commentData) {
        try {
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'addComment',
                    postId: commentData.postId,
                    userId: commentData.userId,
                    userName: commentData.userName,
                    userMembership: commentData.userMembership,
                    text: commentData.text
                })
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to add comment:', error);
            throw error;
        }
    },

    // Get comments for post
    async getComments(postId) {
        try {
            const response = await fetch(`${this.SCRIPT_URL}?action=getComments&postId=${postId}`);
            const data = await response.json();
            return data.comments || [];
        } catch (error) {
            console.error('Failed to get comments:', error);
            return [];
        }
    },

    // === STATISTICS ===

    // Get dashboard stats
    async getStats() {
        try {
            const response = await fetch(`${this.SCRIPT_URL}?action=getStats`);
            const data = await response.json();
            return data.stats || {
                totalUsers: 0,
                activeUsers: 0,
                totalPayments: 0,
                pendingPayments: 0
            };
        } catch (error) {
            console.error('Failed to get stats:', error);
            return {
                totalUsers: 0,
                activeUsers: 0,
                totalPayments: 0,
                pendingPayments: 0
            };
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSheetsAPI;
}
