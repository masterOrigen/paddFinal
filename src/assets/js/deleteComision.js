import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

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

                fetch(`${SUPABASE_URL}/rest/v1/Comisiones?id_comision=eq.${idComision}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_API_KEY
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
});
