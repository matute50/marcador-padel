document.addEventListener('DOMContentLoaded', () => {
    const homeButton = document.getElementById('homeButton');
    const statusDiv = document.getElementById('status');

    homeButton.addEventListener('click', async () => {
        statusDiv.textContent = 'Enviando comando Home...';
        statusDiv.style.backgroundColor = '#444444';
        try {
            const response = await fetch('/api/ptz/home');
            const data = await response.json();

            if (data.success) {
                statusDiv.textContent = data.message;
                statusDiv.style.backgroundColor = '#28a745'; // Verde para éxito
            } else {
                statusDiv.textContent = `Error: ${data.message} - ${data.error}`;
                statusDiv.style.backgroundColor = '#dc3545'; // Rojo para error
            }
        } catch (error) {
            statusDiv.textContent = `Error de conexión: ${error.message}`;
            statusDiv.style.backgroundColor = '#dc3545'; // Rojo para error
        }
    });
});
