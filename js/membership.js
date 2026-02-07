/* ========================================
   MEMBERSHIP & PAYMENT SYSTEM
======================================== */

let selectedPlan = null;
let selectedDuration = null;

// Plan pricing
const PLAN_PRICES = {
    free: { monthly: 0, yearly: 0, lifetime: 0 },
    pro: { monthly: 9.99, yearly: 99.99, lifetime: 0 },
    premium: { monthly: 19.99, yearly: 199.99, lifetime: 0 },
    gold: { monthly: 0, yearly: 0, lifetime: 299 }
};

// Select plan
function selectPlan(plan, duration) {
    if (!UserAuth.currentUser) {
        alert('Please login first');
        window.location.href = 'auth.html';
        return;
    }

    selectedPlan = plan;
    selectedDuration = duration;

    // Show payment modal
    showPaymentModal();
}

// Show payment modal
function showPaymentModal() {
    const modal = document.getElementById('payment-modal');
    const summary = document.getElementById('payment-summary');

    const price = PLAN_PRICES[selectedPlan][selectedDuration];
    const planName = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
    const durationText = selectedDuration === 'lifetime' ? 'Lifetime Access' : 
                         selectedDuration === 'yearly' ? '1 Year' : '1 Month';

    summary.innerHTML = `
        <h4>Order Summary</h4>
        <p><span>Plan:</span> <strong>${planName}</strong></p>
        <p><span>Duration:</span> <strong>${durationText}</strong></p>
        <p><span>Price:</span> <strong>$${price.toFixed(2)}</strong></p>
    `;

    modal.style.display = 'flex';

    // Load payment details
    loadPaymentDetails();
}

// Close payment modal
function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    document.getElementById('paypal-section').style.display = 'none';
    document.getElementById('bank-section').style.display = 'none';
}

// Select payment method
function selectPaymentMethod(method) {
    // Hide all sections
    document.getElementById('paypal-section').style.display = 'none';
    document.getElementById('bank-section').style.display = 'none';

    // Show selected section
    if (method === 'paypal') {
        document.getElementById('paypal-radio').checked = true;
        document.getElementById('paypal-section').style.display = 'block';
    } else if (method === 'bank') {
        document.getElementById('bank-radio').checked = true;
        document.getElementById('bank-section').style.display = 'block';
    }
}

// Load payment details from GitHub
async function loadPaymentDetails() {
    try {
        const config = await GitHubAPI.getJSON('data/payment-config.json');
        
        if (config) {
            // PayPal
            if (config.paypal && config.paypal.email) {
                document.getElementById('paypal-email-display').textContent = config.paypal.email;
            }

            // Bank
            if (config.bank) {
                if (config.bank.name) {
                    document.getElementById('bank-name-display').textContent = config.bank.name;
                }
                if (config.bank.accountNumber) {
                    document.getElementById('bank-account-display').textContent = config.bank.accountNumber;
                }
                if (config.bank.accountName) {
                    document.getElementById('bank-account-name-display').textContent = config.bank.accountName;
                }
                if (config.bank.swift) {
                    document.getElementById('bank-swift-display').textContent = config.bank.swift;
                }
            }
        }
    } catch (error) {
        console.error('Failed to load payment details:', error);
    }
}

// Process PayPal payment
function processPayPalPayment() {
    alert('PayPal integration would open here. For now, this creates a pending payment request.');
    createPendingPayment('paypal');
}

// Submit bank transfer
function submitBankTransfer() {
    createPendingPayment('bank');
}

// Create pending payment (for manual activation)
async function createPendingPayment(method) {
    try {
        let payments = await GitHubAPI.getJSON('data/pending-payments.json') || [];

        const payment = {
            id: 'payment-' + Date.now(),
            userId: UserAuth.currentUser.id,
            userName: UserAuth.currentUser.fullName,
            userEmail: UserAuth.currentUser.email,
            plan: selectedPlan,
            duration: selectedDuration,
            amount: PLAN_PRICES[selectedPlan][selectedDuration],
            method: method,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        payments.unshift(payment);

        const content = JSON.stringify(payments, null, 2);
        try {
            const file = await GitHubAPI.getFile('data/pending-payments.json');
            await GitHubAPI.createOrUpdateFile('data/pending-payments.json', content, 'Add payment request', file.sha);
        } catch {
            await GitHubAPI.createOrUpdateFile('data/pending-payments.json', content, 'Create payments');
        }

        // Log activity
        await UserAuth.logActivity(UserAuth.currentUser.id, `Payment request: ${selectedPlan} - $${payment.amount}`);

        alert('Payment request submitted! Admin will activate your membership manually after verification.');
        closePaymentModal();

    } catch (error) {
        console.error('Failed to create payment:', error);
        alert('Failed to submit payment request. Please try again.');
    }
}

// Check membership expiry
function checkMembershipExpiry(user) {
    if (!user.membershipExpiry) return true; // Lifetime or free

    const expiry = new Date(user.membershipExpiry);
    const now = new Date();

    return expiry > now;
}

// Get expiry date text
function getExpiryText(user) {
    if (!user.membershipExpiry) {
        if (user.membership === 'free') return 'Forever';
        return 'Lifetime';
    }

    const expiry = new Date(user.membershipExpiry);
    return expiry.toLocaleDateString();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (UserAuth.currentUser) {
        // Update current plan button
        const currentPlan = UserAuth.currentUser.membership;
        const buttons = document.querySelectorAll('.btn-plan');
        
        buttons.forEach(btn => {
            const card = btn.closest('.plan-card');
            const planName = card.querySelector('.plan-header h3').textContent.toLowerCase();
            
            if (planName === currentPlan) {
                btn.textContent = 'Current Plan';
                btn.disabled = true;
            }
        });
    }
});
