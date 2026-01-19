// WRITTEN WITH CHATGPT
document.querySelectorAll('.hole-input').forEach(input => {
    input.addEventListener('input', () => {
        // Trim input to 2 digits
        if (input.value.length > 2) {
            input.value = input.value.slice(0, 2);
        }

        const value = Number(input.value);
        const isValid = Number.isInteger(value) && value >= 1 && value <= 25;

        // Apply error styling if invalid
        if (!isValid && input.value !== '') {
            input.classList.add('input-error');
        } else {
            input.classList.remove('input-error');
        }

        // Update the player's total score
        const player = input.dataset.player;
        updatePlayerScore(player);
    });
});

function updatePlayerScore(player) {
    let total = 0;

    // Sum up all valid scores for the player
    document.querySelectorAll(`.hole-input[data-player="${player}"]`).forEach(input => {
        const value = Number(input.value);
        if (Number.isInteger(value) && value >= 1 && value <= 25) {
            total += value;
        }
    });

    // Update visible total
    const totalSpan = document.querySelector(`.total-score[data-player="${player}"]`);
    if (totalSpan) {
        totalSpan.textContent = total;
    }

    // Update hidden input that will be submitted with the form
    const hiddenInput = document.querySelector(`.total-score-hidden[data-player="${player}"]`);
    if (hiddenInput) {
        hiddenInput.value = total;
    }
}