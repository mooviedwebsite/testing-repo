/* ========================================
   MEMBERSHIP SYSTEM WITH PAYHERE
======================================== */

let selectedPlan = null;
let selectedDuration = null;
let selectedAmountUSD = 0;
let selectedAmountLKR = 0;
let currentStep = 1;
let selectedPaymentMethod = null;

// Payment Config
let paymentConfig = null;

// API Configuration
const MembershipAPI = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxxhGkwRbJErCE05Z-TejfARFrdmQlp4ijNCSPSfnRlntgmk4re-fXUZiOFEAKLaEtz/exec',
    
    async createPayment(paymentData) {
        try {
            const formData = new URLSearchParams();
            formData.append('action', 'createPayment');
            formData.append('userId', paymentData.userId);
            formData.append('userName', paymentData.userName);
            formData.append('userEmail', paymentData.userEmail);
            formData.append('plan', paymentData.plan);
            formData.append('duration', paymentData.duration);
            formData.append('amountUSD', paymentData.amountUSD);
            formData.append('amountLKR', paymentData.amountLKR);
            formData.append('method', paymentData.method);
            formData.append('transactionId', paymentData.transactionId || '');
            formData.append('notes', paymentData.notes || '');
            formData.append('status', 'pending');

            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Failed to create payment:', error);
            throw error;
        }
    },

    async getUserSubscription(userId) {
        try {
            const response = await fetch(`${this.SCRIPT_URL}?action=getUserSubscription&userId=${userId}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get subscription:', error);
            return null;
        }
    }
};

// Load payment config
async function loadPaymentConfig() {
    try {
        const response = await fetch('data/admin-membership-info.json');
        paymentConfig = await response.json();
        
        // Update PayPal email
        if (paymentConfig.paypal && paymentConfig.paypal.email) {
            document.getElementById('paypal-email-display').value = paymentConfig.paypal.email;
        }
        
        // Update bank details
        if (paymentConfig.bank) {
            document.getElementById('bank-name-display').textContent = paymentConfig.bank.bankName || 'N/A';
            document.getElementById('bank-account-display').value = paymentConfig.bank.accountNumber || 'N/A';
            document.getElementById('bank-account-name-display').textContent = paymentConfig.bank.accountName || 'N/A';
            document.getElementById('bank-branch-display').textContent = paymentConfig.bank.branch || 'N/A';
            document.getElementById('bank-swift-display').textContent = paymentConfig.bank.swift || 'N/A';
        }
        
    } catch (error) {
        console.error('Failed to load payment config:', error);
    }
}

// Load user subscription
async function loadUserSubscription() {
    if (!UserAuth || !UserAuth.currentUser) return;

    const subscription = await MembershipAPI.getUserSubscription(UserAuth.currentUser.userId);
    
    if (subscription) {
        document.getElementById('current-subscription').style.display = 'block';
        
        const badge = document.getElementById('sub-badge');
        badge.textContent = subscription.plan.toUpperCase();
        badge.className = 'sub-badge ' + subscription.plan;
        
        document.getElementById('sub-status').textContent = subscription.status === 'active' ? 'Active' : 'Inactive';
        document.getElementById('sub-status').style.color = subscription.status === 'active' ? '#46d369' : '#e50914';
        
        const startDate = new Date(subscription.startDate);
        document.getElementById('sub-start').textContent = startDate.toLocaleDateString();
        
        if (subscription.expiryDate === 'lifetime') {
            document.getElementById('sub-expiry-row').style.display = 'none';
        } else {
            const expiryDate = new Date(subscription.expiryDate);
            document.getElementById('sub-expiry').textContent = expiryDate.toLocaleDateString();
        }
        
        document.getElementById('sub-method').textContent = subscription.paymentMethod || 'Free';
        
        // Update plan buttons
        document.querySelectorAll('.plan-card').forEach(card => {
            const plan = card.getAttribute('data-plan');
            const btn = card.querySelector('.plan-btn');
            
            if (plan === subscription.plan) {
                btn.textContent = 'Current Plan';
                btn.classList.add('current-plan');
                btn.disabled = true;
            } else {
                btn.classList.remove('current-plan');
                btn.disabled = false;
            }
        });
    }
}

// Select plan
function selectPlan(plan, duration, amountUSD, amountLKR) {
    if (!UserAuth || !UserAuth.currentUser) {
        alert('Please login to subscribe');
        window.location.href = 'auth.html';
        return;
    }

    selectedPlan = plan;
    selectedDuration = duration;
    selectedAmountUSD = amountUSD;
    selectedAmountLKR = amountLKR;

    // Update summary
    document.getElementById('summary-plan').textContent = plan.toUpperCase();
    document.getElementById('summary-duration').textContent = duration === 'lifetime' ? 'Lifetime Access' : 'Monthly';
    document.getElementById('summary-amount-usd').textContent = '$' + amountUSD.toFixed(2);
    document.getElementById('summary-amount-lkr').textContent = 'LKR ' + amountLKR.toLocaleString();

    // Show modal
    document.getElementById('payment-modal').classList.add('active');
    showStep(1);
}

// Close modal
function closePaymentModal() {
    document.getElementById('payment-modal').classList.remove('active');
    currentStep = 1;
    selectedPaymentMethod = null;
}

// Show step
function showStep(step) {
    document.querySelectorAll('.payment-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step-indicator').forEach((ind, idx) => {
        ind.classList.remove('active', 'completed');
        if (idx + 1 === step) ind.classList.add('active');
        else if (idx + 1 < step) ind.classList.add('completed');
    });

    if (step === 1) {
        document.getElementById('step-summary').classList.add('active');
    } else if (step === 2) {
        document.getElementById('step-method').classList.add('active');
    } else if (step === 3) {
        document.getElementById('step-details').classList.add('active');
        showPaymentForm(selectedPaymentMethod);
    }

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
    }
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.target.closest('.payment-method-card').classList.add('selected');
    document.getElementById(method + '-method').checked = true;
    document.getElementById('method-next-btn').disabled = false;
}

// Show payment form
function showPaymentForm(method) {
    // Hide all forms
    document.getElementById('payhere-payment-form').style.display = 'none';
    document.getElementById('paypal-payment-form').style.display = 'none';
    document.getElementById('bank-payment-form').style.display = 'none';

    if (method === 'payhere') {
        document.getElementById('payhere-payment-form').style.display = 'block';
        document.getElementById('payhere-plan').textContent = selectedPlan.toUpperCase();
        document.getElementById('payhere-amount-lkr').textContent = 'LKR ' + selectedAmountLKR.toLocaleString();
        
    } else if (method === 'paypal') {
        document.getElementById('paypal-payment-form').style.display = 'block';
        
        if (UserAuth.currentUser) {
            document.getElementById('paypal-fullname').value = UserAuth.currentUser.fullName;
            document.getElementById('paypal-email').value = UserAuth.currentUser.email;
        }
        
    } else if (method === 'bank') {
        document.getElementById('bank-payment-form').style.display = 'block';
        document.getElementById('bank-amount-lkr').textContent = 'LKR ' + selectedAmountLKR.toLocaleString();
        
        if (UserAuth.currentUser) {
            document.getElementById('bank-fullname').value = UserAuth.currentUser.fullName;
            document.getElementById('bank-email').value = UserAuth.currentUser.email;
        }
    }
}

// Submit PayHere Payment
async function submitPayHerePayment() {
    const submitBtn = document.getElementById('payhere-submit-btn');
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    try {
        // Generate order ID
        const orderId = 'order-' + new Date().getTime();
        
        // Prepare PayHere form
        const merchantId = paymentConfig.payhere.merchantId;
        const items = `${selectedPlan.toUpperCase()} Plan`;
        const amount = selectedAmountLKR.toFixed(2);
        
        const user = UserAuth.currentUser;
        const nameParts = user.fullName.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || 'Name';
        
        // Generate hash (MD5 in real implementation)
        const hashString = merchantId + orderId + amount + 'LKR';
        const hash = hashString; // In production, use proper MD5 hash with merchant secret
        
        // Fill form
        document.getElementById('payhere-merchant-id').value = merchantId;
        document.getElementById('payhere-order-id').value = orderId;
        document.getElementById('payhere-items').value = items;
        document.getElementById('payhere-amount').value = amount;
        document.getElementById('payhere-first-name').value = firstName;
        document.getElementById('payhere-last-name').value = lastName;
        document.getElementById('payhere-email').value = user.email;
        document.getElementById('payhere-hash').value = hash;
        
        // Save payment record
        await MembershipAPI.createPayment({
            userId: user.userId,
            userName: user.fullName,
            userEmail: user.email,
            plan: selectedPlan,
            duration: selectedDuration,
            amountUSD: selectedAmountUSD,
            amountLKR: selectedAmountLKR,
            method: 'payhere',
            transactionId: orderId,
            notes: 'PayHere payment initiated'
        });
        
        // Submit form
        document.getElementById('payhere-form').submit();
        
    } catch (error) {
        console.error('PayHere payment error:', error);
        alert('Payment initialization failed. Please try again.');
        submitBtn.textContent = 'Proceed to PayHere';
        submitBtn.disabled = false;
    }
}

// Submit PayPal Payment
async function submitPayPalPayment() {
    const fullName = document.getElementById('paypal-fullname').value.trim();
    const email = document.getElementById('paypal-email').value.trim();
    const transactionId = document.getElementById('paypal-transaction-id').value.trim();
    const confirmed = document.getElementById('paypal-confirm').checked;

    if (!fullName || !email || !transactionId || !confirmed) {
        alert('Please fill in all fields and confirm payment');
        return;
    }

    try {
        await MembershipAPI.createPayment({
            userId: UserAuth.currentUser.userId,
            userName: fullName,
            userEmail: email,
            plan: selectedPlan,
            duration: selectedDuration,
            amountUSD: selectedAmountUSD,
            amountLKR: selectedAmountLKR,
            method: 'paypal',
            transactionId: transactionId
        });

        alert('✅ PayPal payment submitted!\n\nOur admin will verify your payment within 24 hours.');
        closePaymentModal();
        
    } catch (error) {
        console.error('PayPal payment error:', error);
        alert('Failed to submit payment');
    }
}

// Submit Bank Transfer
async function submitBankPayment() {
    const fullName = document.getElementById('bank-fullname').value.trim();
    const email = document.getElementById('bank-email').value.trim();
    const reference = document.getElementById('bank-reference').value.trim();
    const notes = document.getElementById('bank-notes').value.trim();
    const confirmed = document.getElementById('bank-confirm').checked;

    if (!fullName || !email || !reference || !confirmed) {
        alert('Please fill in all required fields and confirm transfer');
        return;
    }

    try {
        await MembershipAPI.createPayment({
            userId: UserAuth.currentUser.userId,
            userName: fullName,
            userEmail: email,
            plan: selectedPlan,
            duration: selectedDuration,
            amountUSD: selectedAmountUSD,
            amountLKR: selectedAmountLKR,
            method: 'bank',
            transactionId: reference,
            notes: notes
        });

        alert('✅ Bank transfer submitted!\n\nOur admin will verify your transfer within 24 hours.');
        closePaymentModal();
        
    } catch (error) {
        console.error('Bank transfer error:', error);
        alert('Failed to submit payment');
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

// Check payment status from URL
function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
        alert('✅ Payment successful!\n\nYour subscription will be activated shortly.');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
        alert('❌ Payment cancelled.\n\nYour payment was not processed.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPaymentConfig();
    loadUserSubscription();
    checkPaymentStatus();
    
    // Close modal on overlay click
    document.getElementById('payment-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'payment-modal') {
            closePaymentModal();
        }
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePaymentModal();
        }
    });
});
