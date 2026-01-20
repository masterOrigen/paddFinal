document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addMedioForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        fetch('/querys/modulos/addMedio.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'El medio ha sido agregado correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    $('#modalAdd').modal('hide');
                    form.reset();
                    window.location.reload();
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo agregar el medio. Por favor, intente de nuevo.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Ocurrió un error al procesar la solicitud.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
    });


});

