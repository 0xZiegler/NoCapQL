// Toggle password visibility.
export function hideShowPassword() {
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    togglePassword.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        togglePassword.src = isHidden ? './assets/hide.png' : './assets/show.png';
    });
}

// Display an error message in the specified element
export const displayError = (elementId, message) => {
    const errorElement = document.getElementById(elementId);
    if (errorElement) errorElement.textContent = message;
};

// Remove error messages when the user focuses on the input fields
export function removeError() {
    const fields = ['username', 'password'];

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener("focus", () => displayError("login-error", ""));
        }
    });
}

// Format the XP amount
export function formatXP(amount, color = "") {
    if (amount < 1000) return `<span class=${color}>${amount}</span> B`;
    amount = amount / 1000;
    if (amount < 1000) return `<span class=${color}>${amount.toFixed(2)}</span> KB`;
    amount = amount / 1000;
    return `<span class=${color}>${amount.toFixed(2)}</span> MB`;
}

// Capitalize the first letter of each word in a string
export function capitalize(text) {
    return text
        .toLowerCase()
        .replace(/-/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Pop up a fading notifation error.
export function popError(message) {
    const errorNotification = document.createElement('div');
    errorNotification.className = "error-notification";
    errorNotification.textContent = message;

    document.body.appendChild(errorNotification);
    setTimeout(() => {
        errorNotification.style.opacity = '0';
        errorNotification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            errorNotification.remove();
        }, 500);
    }, 4000);
}
