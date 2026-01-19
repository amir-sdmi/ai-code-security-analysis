// Implementation suggested by ChatGpt and adapted to current project
document.addEventListener('DOMContentLoaded', function() {
    const cookieBar = document.getElementById('cookie-consent-bar');
    const acceptButton = document.getElementById('cookie-accept');
    const learnMoreLink = document.getElementById('cookie-learn-more');

    /**
     * Sets a cookie with the specified name, value, and expiration days.
     * 
     * @param {string} name - The name of the cookie
     * @param {string} value - The value of the cookie
     * @param {number} days - Number of days until the cookie expires
     */
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }

    /**
     * Retrieves the value of a cookie by its name.
     * 
     * @param {string} name - The name of the cookie
     * @returns {string|null} The value of the cookie or null if not found
     */
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    /**
     * Handles the acceptance of cookies by setting a cookie and hiding the consent bar.
     */
    function acceptCookies() {
        setCookie('cookie_consent', 'accepted', 365);
        cookieBar.style.display = 'none';
    }

    // Add event listener to the "Accept" button to handle cookie acceptance
    acceptButton.addEventListener('click', acceptCookies);

    /**
     * Handles the "Learn More" link click event by preventing default action and redirecting to the link.
     * 
     * @param {Event} e - The click event object
     */
    learnMoreLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = this.getAttribute('href');
    });

    // Show the cookie consent bar if the user has not accepted cookies
    if (getCookie('cookie_consent') !== 'accepted') {
        cookieBar.style.display = 'block';
    }
});
