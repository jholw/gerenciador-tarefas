export function showAlert(message) {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert';
    alertContainer.innerText = message;

    document.body.appendChild(alertContainer);

    setTimeout(() => {
        alertContainer.remove();
    }, 3000);
}

export function triggerUrgentAlert(task) {
    const message = `Urgent Task: ${task.title} is due soon!`;
    showAlert(message);
    // Optionally, you can add audio alert here
    const audio = new Audio('path/to/alert-sound.mp3');
    audio.play();
}