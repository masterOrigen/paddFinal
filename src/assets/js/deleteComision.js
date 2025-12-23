document.addEventListener('DOMContentLoaded', function() {
    console.log('Script cargado correctamente');

    function eliminarComision(idComision, rowElement) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Mostrar el loading existente
                document.body.classList.add('loaded');

                fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Comisiones?id_comision=eq.${idComision}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error al eliminar la comisión');
                    }
                    return response.text();
                })
                .then(() => {
                    // Eliminar la fila de la tabla
                    rowElement.remove();

                    // Actualizar el conteo si es necesario
                    actualizarConteoComisiones();

                    // Verificar si la tabla está vacía
                    const tbody = document.querySelector('#otros table tbody');
                    if (tbody.children.length === 0) {
                        const emptyRow = document.createElement('tr');
                        emptyRow.classList.add('empty-row');
                        emptyRow.innerHTML = '<td colspan="6">No hay datos disponibles</td>';
                        tbody.appendChild(emptyRow);
                    }

                    Swal.fire(
                        'Eliminado',
                        'La comisión ha sido eliminada.',
                        'success'
                    );
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire(
                        'Error',
                        'No se pudo eliminar la comisión',
                        'error'
                    );
                })
                .finally(() => {
                    // Ocultar el loading
                    document.body.classList.remove('loaded');
                });
            }
        });
    }

    function actualizarConteoComisiones() {
        const conteoElement = document.querySelector('#conteoComisiones');
        if (conteoElement) {
            const filas = document.querySelectorAll('#otros table tbody tr:not(.empty-row)');
            conteoElement.textContent = filas.length;
        }
    }

    // Usar delegación de eventos para los botones de eliminar
    document.body.addEventListener('click', function(event) {
        const button = event.target.closest('.eliminar-comision');
        if (button) {
            console.log('Botón de eliminar clickeado');
            const idComision = button.getAttribute('data-idcomision');
            console.log('ID de comisión:', idComision);
            const rowElement = button.closest('tr');
            eliminarComision(idComision, rowElement);
        }
    });

    // Código para activar el tab correcto al cargar la página
    const urlParams = new URLSearchParams(window.location.search);
    const tabToActivate = urlParams.get('tab');
    if (tabToActivate === 'otros') {
        const otrosTab = document.querySelector('a[href="#otros"]');
        if (otrosTab) {
            const tab = new bootstrap.Tab(otrosTab);
            tab.show();
        }
    }

    console.log('SweetAlert2 disponible:', typeof Swal !== 'undefined');

    // Función para agregar comisión
    function agregarComision(formData) {
        // Mostrar el loading existente
        document.body.classList.add('loaded');

        const data = {
            id_cliente: parseInt(formData.get('id_cliente')),
            id_tipoMoneda: parseInt(formData.get('nombreMoneda')),
            id_formatoComision: parseInt(formData.get('nombreFormato')),
            valorComision: parseFloat(formData.get('valorComision')),
            inicioComision: formData.get('inicioComision'),
            finComision: formData.get('finComision')
        };

        fetch('https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Comisiones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al agregar la comisión');
            }
            return response.json();
        })
        .then(result => {
            console.log('Respuesta del servidor:', result);
            
            // Cerrar el modal
            $('#comisionModal').modal('hide');

            // Mostrar mensaje de éxito
            Swal.fire(
                'Éxito',
                'Comisión agregada exitosamente',
                'success'
            ).then(() => {
                // Actualizar la tabla con la nueva comisión
                actualizarTablaComisiones(result);
            });
        })
        .catch(error => {
            console.error('Error en la solicitud:', error);
            Swal.fire(
                'Error',
                'No se pudo agregar la comisión',
                'error'
            );
        })
        .finally(() => {
            document.body.classList.remove('loaded');
        });
    }

    // Función para actualizar la tabla con la nueva comisión
    function actualizarTablaComisiones(nuevaComision) {
        const tbody = document.querySelector('#otros table tbody');
        const emptyRow = tbody.querySelector('.empty-row');
        if (emptyRow) {
            emptyRow.remove();
        }

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${nuevaComision.id_tipoMoneda}</td>
            <td>${nuevaComision.valorComision}</td>
            <td>${nuevaComision.id_formatoComision}</td>
            <td>${nuevaComision.inicioComision}</td>
            <td>${nuevaComision.finComision}</td>
            <td>
                <input type="hidden" class="id_comision" value="${nuevaComision.id_comision}">
                <button type="button" class="btn btn-success micono" data-bs-toggle="modal" data-bs-target="#actualizarcomisionModal" data-idcomision="${nuevaComision.id_comision}" data-toggle="tooltip" title="Editar">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button type="button" class="btn btn-danger micono eliminar-comision" data-idcomision="${nuevaComision.id_comision}" data-toggle="tooltip" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(newRow);

        actualizarConteoComisiones();
    }

    // Event listener para el formulario de agregar comisión
    document.getElementById('updateMedioForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        agregarComision(formData);
    });
});