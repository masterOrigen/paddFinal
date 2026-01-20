import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Script deleteProducto.js cargado correctamente');

    function eliminarProducto(idProducto, rowElement) {
        console.log(`Iniciando proceso de eliminación para el producto con ID: ${idProducto}`);
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
                console.log('Confirmación recibida, procediendo con la eliminación');
                document.body.classList.add('loaded');

                fetch(`${SUPABASE_URL}/rest/v1/Productos?id=eq.${idProducto}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_API_KEY
                    }
                })
                .then(response => {
                    console.log(`Respuesta recibida con status: ${response.status}`);
                    if (!response.ok) {
                        throw new Error(`Error al eliminar el producto. Status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(() => {
                    console.log('Producto eliminado exitosamente de la base de datos');
                    rowElement.remove();
                    console.log('Fila eliminada del DOM');
                    actualizarConteoProductos();
                    Swal.fire('Eliminado', 'El producto ha sido eliminado.', 'success');
                })
                .catch(error => {
                    console.error('Error en la eliminación:', error);
                    Swal.fire('Error', 'No se pudo eliminar el producto: ' + error.message, 'error');
                })
                .finally(() => {
                    document.body.classList.remove('loaded');
                    console.log('Proceso de eliminación finalizado');
                });
            } else {
                console.log('Eliminación cancelada por el usuario');
            }
        });
    }

    function actualizarConteoProductos() {
        const conteoElement = document.querySelector('#conteoProductos');
        if (conteoElement) {
            const filas = document.querySelectorAll('#productos table tbody tr:not(.empty-row)');
            conteoElement.textContent = filas.length;
            console.log(`Conteo de productos actualizado: ${filas.length}`);
        } else {
            console.log('Elemento de conteo de productos no encontrado');
        }
    }

    // Usando event delegation para los botones de eliminar
    document.body.addEventListener('click', function(event) {
        const button = event.target.closest('.eliminar-producto');
        if (button) {
            console.log('Botón de eliminar producto clickeado');
            const idProducto = button.getAttribute('data-idproducto');
            console.log('ID del producto a eliminar:', idProducto);
            if (idProducto) {
                const rowElement = button.closest('tr');
                eliminarProducto(idProducto, rowElement);
            } else {
                console.error('No se encontró el ID del producto en el botón');
            }
        }
    });

    console.log('Event listener para eliminar productos configurado');
    console.log('SweetAlert2 disponible:', typeof Swal !== 'undefined');
});
