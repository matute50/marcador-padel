document.addEventListener('DOMContentLoaded', () => {
    const vmixIpEl = document.getElementById('vmix-ip');
    const vmixPortEl = document.getElementById('vmix-port');
    const cameraInputEl = document.getElementById('camera-input');

    const sendCommand = (command, value1 = '', value2 = '') => {
        const ip = vmixIpEl.value;
        const port = vmixPortEl.value;
        const input = cameraInputEl.value;

        // La URL de nuestro propio backend, no de vMix directamente
        const url = `/ptz?command=${command}&input=${input}&value1=${value1}&value2=${value2}&vmixIp=${ip}&vmixPort=${port}`;

        fetch(url)
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));
    };

    // Mapeo de botones a comandos
    const commandMap = {
        'up': { command: 'PTZMoveUp' },
        'down': { command: 'PTZMoveDown' },
        'left': { command: 'PTZMoveLeft' },
        'right': { command: 'PTZMoveRight' },
        'home': { command: 'PTZReset' }, // Este es un comando de acción única
        'zoom-in': { command: 'PTZZoomIn' },
        'zoom-out': { command: 'PTZZoomOut' },
    };

    const stopCommand = 'PTZMoveStop';

    // Asignar eventos a los botones
    for (const [id, { command }] of Object.entries(commandMap)) {
        const button = document.getElementById(id);
        if (button) {
            // Los comandos de movimiento usan mousedown/mouseup
            if (command !== 'PTZReset') {
                button.addEventListener('mousedown', () => sendCommand(command));
                button.addEventListener('mouseup', () => sendCommand(stopCommand));
                // Detener también si el cursor sale del botón mientras está presionado
                button.addEventListener('mouseleave', () => sendCommand(stopCommand));
            } else {
                // El comando de reset usa un simple click
                button.addEventListener('click', () => sendCommand(command));
            }
        }
    }
});
