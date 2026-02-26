// Create pending payment (for manual activation)
async function createPendingPayment(method) {
    try {
        const payment = {
            userId: UserAuth.currentUser.userId,
            userName: UserAuth.currentUser.fullName,
            userEmail: UserAuth.currentUser.email,
            plan: selectedPlan,
            duration: selectedDuration,
            amount: PLAN_PRICES[selectedPlan][selectedDuration],
            method: method
        };

        await GoogleSheetsAPI.createPayment(payment);

        // Log activity
        await GoogleSheetsAPI.logActivity(
            UserAuth.currentUser.userId, 
            `Payment request: ${selectedPlan} - $${payment.amount}`,
            UserAuth.currentUser.email
        );

        alert('Payment request submitted! Admin will activate your membership manually after verification.');
        closePaymentModal();

    } catch (error) {
        console.error('Failed to create payment:', error);
        alert('Failed to submit payment request. Please try again.');
    }
}
