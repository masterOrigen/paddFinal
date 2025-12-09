document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('updateMedioForm');
    const alertElement = document.getElementById('updateAlert');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            fetch('../querys/modulos/updateMedio.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(text => {
                console.log('Respuesta del servidor:', text);
                return JSON.parse(text);
            })
            .then(data => {
                if (data.success) {
                    if (alertElement) {
                        alertElement.className = 'alert alert-success';
                        alertElement.style.display = 'block';
                        alertElement.textContent = data.message;
                        
                        // Cerrar el modal después de 2 segundos y redirigir
                        setTimeout(() => {
                            // Asumiendo que estás usando Bootstrap para el modal
                            $('#editarMedioModal').modal('hide');
                            
                            // Redirigir a listmedios.php
                            window.location.href = '../ListMedios.php';
                        }, 1000);
                    }
                } else {
                    if (alertElement) {
                        alertElement.className = 'alert alert-danger';
                        alertElement.style.display = 'block';
                        alertElement.textContent = 'Error: ' + data.message;
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (alertElement) {
                    alertElement.className = 'alert alert-danger';
                    alertElement.style.display = 'block';
                    alertElement.textContent = 'Ocurrió un error al actualizar: ' + error.message;
                }
            });
        });
    } else {
        console.error('El formulario con ID "updateMedioForm" no se encontró en el DOM');
    }
});