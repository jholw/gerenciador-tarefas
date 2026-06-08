// Este módulo controla alertas simples no navegador.
// As funções abaixo criam mensagens visuais e podem ser usadas para avisos urgentes.

export function showAlert(message) {
    // Cria um elemento de alerta com a mensagem informada.
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert';
    alertContainer.innerText = message;

    document.body.appendChild(alertContainer);

    // Remove o alerta depois de 3 segundos para não poluir a interface.
    setTimeout(() => {
        alertContainer.remove();
    }, 3000);
}

export function triggerUrgentAlert(task) {
    // Gera uma mensagem de alerta específica para tarefas urgentes.
    const message = `Urgent Task: ${task.title} is due soon!`;
    showAlert(message);

    // Reproduz um som de notificação, se o navegador permitir.
    const audio = new Audio('path/to/alert-sound.mp3');
    audio.play();
}
