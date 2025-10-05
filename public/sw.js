self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'ENVIAR_NOTIFICACAO') {
        self.registration.showNotification(event.data.titulo, {
            body: event.data.corpo,
            icon: '/src/assets/a-bag-of-money.png',
            tag: 'paycount-push',
            requireInteraction: event.data.urgente || false
        });
    }
});