/* ========================================
   PROFESSIONAL MEMBERSHIP & PAYMENT SYSTEM
======================================== */

let selectedPlan = null;
let selectedDuration = null;
let selectedAmount = 0;
let currentStep = 1;
let selectedPaymentMethod = null;

// Google Sheets API for this file
const MembershipAPI = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxxhGkwRbJErCE05Z-TejfARFrdmQlp4ijNCSPSfnRlntgmk4re-fXUZiOFEAKLaEtz/exec',
    
    async createPayment(paymentData) {
        try {
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'createPayment',
                    userId: paymentData.userId,
                    userName: paymentData.userName,
                    userEmail: paymentData.userEmail,
                    plan: paymentData.plan,
                    duration: paymentData.duration,
                    amount: paymentData.amount,
                    method: paymentData.method,
                    transactionId: paymentData.transactionId || '',
                    notes: paymentData.notes || '',
                    status: 'pending'
                })
            });
            return { success: true };
        } catch (error) {
            console.error('Failed to create payment:', error);
            throw error;
        }
    },
    
    async logActivity(userId, action, email) {
        try {
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'logActivity',
                    userId: userId,
                    activityAction: action,
                    email: email,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
};

// Open payment flow
function openPaymentFlow(plan, duration, amount) {
    if (!UserAuth.currentUser) {
        alert('Please login to subscribe');
        window.location.href = 'auth.html';
        return;
    }

    selectedPlan = plan;
    selectedDuration = duration;
    selectedAmount = amount;
    currentStep = 1;

    // Update summary
    document.getElementById('summary-plan').textContent = plan.toUpperCase();
    document.getElementById('summary-duration').textContent = duration === 'lifetime' ? 'Lifetime Access' : 'Monthly';
    document.getElementById('summary-amount').textContent = '$' + amount.toFixed(2);

    // Show modal
    document.getElementById('payment-modal').classList.add('active');
    showStep(1);

    // Load payment details
    loadPaymentConfig();
}

// Close payment modal
function closePaymentModal() {
    document.getElementById('payment-modal').classList.remove('active');
    currentStep = 1;
    selectedPaymentMethod = null;
}

// Show specific step
function showStep(step) {
    document.querySelectorAll('.payment-step').forEach(s => s.classList.remove('active'));
    document.getElementById('step-' + (step === 1 ? 'summary' : step === 2 ? 'method' : 'details')).classList.add('active');

    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        indicator.classList.remove('active', 'completed');
        if (index + 1 === step) {
            indicator.classList.add('active');
        } else if (index + 1 < step) {
            indicator.classList.add('completed');
        }
    });

    currentStep = step;
}

// Next step
function nextStep() {
    if (currentStep === 1) {
        showStep(2);
    } else if (currentStep === 2) {
        if (!selectedPaymentMethod) {
            alert('Please select a payment method');
            return;
        }
        showStep(3);
        showPaymentDetails(selectedPaymentMethod);
    }
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('selected');
    });

    event.target.closest('.payment-method-card').classList.add('selected');

    if (method === 'paypal') {
        document.getElementById('paypal-method').checked = true;
    } else {
        document.getElementById('bank-method').checked = true;
    }

    document.getElementById('method-next-btn').disabled = false;
}

// Show payment details
function showPaymentDetails(method) {
    document.getElementById('paypal-details').style.display = 'none';
    document.getElementById('bank-details').style.display = 'none';

    if (method === 'paypal') {
        document.getElementById('paypal-details').style.display = 'block';
        
        if (UserAuth.currentUser) {
            document.getElementById('payment-fullname').value = UserAuth.currentUser.fullName;
            document.getElementById('payment-email').value = UserAuth.currentUser.email;
        }
    } else {
        document.getElementById('bank-details').style.display = 'block';
        
        if (UserAuth.currentUser) {
            document.getElementById('bank-fullname').value = UserAuth.currentUser.fullName;
            document.getElementById('bank-email').value = UserAuth.currentUser.email;
        }
    }
}

// Load payment configuration
async function loadPaymentConfig() {
    try {
        const config = await GitHubAPI.getJSON('data/payment-config.json');

        if (config) {
            if (config.paypal && config.paypal.email) {
                document.getElementById('paypal-email-display').value = config.paypal.email;
            } else {
                document.getElementById('paypal-email-display').value = 'payments@yoursite.com';
            }

            if (config.bank) {
                document.getElementById('bank-name-display').textContent = config.bank.name || 'Your Bank Name';
                document.getElementById('bank-account-display').value = config.bank.accountNumber || '1234567890';
                document.getElementById('bank-account-name-display').textContent = config.bank.accountName || 'Your Account Name';
                document.getElementById('bank-swift-display').textContent = config.bank.swift || 'SWIFTCODE';
            }
        }
    } catch (error) {
        console.error('Failed to load payment config:', error);
    }
}

// Copy to clipboard
function copyToClipboard(elementId) {
    const input = document.getElementById(elementId);
    input.select();
    document.execCommand('copy');

    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}

// Submit payment
async function submitPayment() {
    try {
        let paymentData = {
            userId: UserAuth.currentUser.userId,
            userName: UserAuth.currentUser.fullName,
            userEmail: UserAuth.currentUser.email,
            plan: selectedPlan,
            duration: selectedDuration,
            amount: selectedAmount,
            method: selectedPaymentMethod
        };

        if (selectedPaymentMethod === 'paypal') {
            const fullName = document.getElementById('payment-fullname').value;
            const email = document.getElementById('payment-email').value;
            const transactionId = document.getElementById('paypal-transaction-id').value;
            const confirmed = document.getElementById('paypal-confirm').checked;

            if (!fullName || !email || !transactionId || !confirmed) {
                alert('Please fill in all required fields and confirm payment');
                return;
            }

            paymentData.transactionId = transactionId;
            paymentData.payerName = fullName;
            paymentData.payerEmail = email;

        } else if (selectedPaymentMethod === 'bank') {
            const fullName = document.getElementById('bank-fullname').value;
            const email = document.getElementById('bank-email').value;
            const reference = document.getElementById('bank-reference').value;
            const notes = document.getElementById('bank-notes').value;
            const confirmed = document.getElementById('bank-confirm').checked;

            if (!fullName || !email || !reference || !confirmed) {
                alert('Please fill in all required fields and confirm transfer');
                return;
            }

            paymentData.transactionId = reference;
            paymentData.payerName = fullName;
            paymentData.payerEmail = email;
            paymentData.notes = notes;
        }

        const submitBtn = event.target;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        await MembershipAPI.createPayment(paymentData);

        await MembershipAPI.logActivity(
            UserAuth.currentUser.userId,
            `Payment request submitted: ${selectedPlan} - $${selectedAmount}`,
            UserAuth.currentUser.email
        );

        alert('✅ Payment request submitted successfully!\n\nOur admin will verify and activate your membership within 24 hours.\n\nYou will receive a confirmation email once activated.');

        closePaymentModal();

    } catch (error) {
        console.error('Failed to submit payment:', error);
        alert('Failed to submit payment. Please try again.');
        
        const submitBtn = event.target;
        submitBtn.textContent = 'Submit Payment Proof';
        submitBtn.disabled = false;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (UserAuth.currentUser) {
        const currentPlan = UserAuth.currentUser.membership;
        
        document.querySelectorAll('.plan-card').forEach(card => {
            const planName = card.getAttribute('data-plan');
            const button = card.querySelector('.plan-btn');
            
            if (planName === currentPlan) {
                button.textContent = 'Current Plan';
                button.disabled = true;
            }
        });
    }
});

document.getElementById('payment-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'payment-modal') {
        closePaymentModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePaymentModal();
    }
});
