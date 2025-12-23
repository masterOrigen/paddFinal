async function eliminarContacto(idContacto, idProveedor3) {
    const SUPABASE_API_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc';

    if (!await confirmarEliminar()) return; // Confirmar la eliminación con el usuario

    try {
        // Realiza la solicitud DELETE a la API de contactos
        const response = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/contactos?id_contacto=eq.${idContacto}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json', // Asegúrate de incluir el tipo de contenido JSON
                'apikey': SUPABASE_API_KEY,
                'Authorization': `Bearer ${SUPABASE_API_KEY}`
            }
        });

        // Verifica si la respuesta fue exitosa
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        // Mostrar mensaje de éxito y actualizar la lista de contactos
        mostrarExito('El contacto ha sido eliminado.');
        refreshContactTable(idProveedor3);

    } catch (error) {
        console.error('Error al eliminar el contacto:', error);
        mostrarError('No se pudo eliminar el contacto: ' + error.message);
    }
}

async function confirmarEliminar() {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar!',
            cancelButtonText: 'Cancelar'
        });
        return result.isConfirmed;
    }


function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        showConfirmButton: false,
        timer: 1500
    });
}
document.addEventListener('DOMContentLoaded', function() {
    // Usa la delegación de eventos para manejar los clics en los botones de eliminar
    document.body.addEventListener('click', async function(event) {
        if (event.target && event.target.closest('.eliminar-contacto')) {
            // Obtén el botón de eliminar más cercano al objetivo del clic
            const button = event.target.closest('.eliminar-contacto');

            // Obtén el ID del contacto y el ID del proveedor del atributo data-*
            const idContacto = button.getAttribute('data-idcontacto');
            const idProveedor3 = button.getAttribute('data-id-proveer');

            // Llama a la función eliminarContacto pasando ambos IDs
            await eliminarContacto(idContacto, idProveedor3);
        }
    });
});



document.addEventListener('DOMContentLoaded', function () {
    var actualizarContactoModal = document.getElementById('actualizarContactoModal');

    actualizarContactoModal.addEventListener('show.bs.modal', function (event) {
        // Extrae el botón que activó el modal
        var button = event.relatedTarget;
        
        // Extrae los datos del contacto del atributo data-* del botón
        var idContacto = button.getAttribute('data-idcontacto');
        var nombre = button.getAttribute('data-nombre');
        var apellido = button.getAttribute('data-apellido');
        var telefono = button.getAttribute('data-telefono');
        var email = button.getAttribute('data-email');
        
        // Llena el formulario del modal con los datos del contacto
        var modal = document.querySelector('#actualizarcontactop');
        modal.querySelector('#id_contacto').value = idContacto;
        modal.querySelector('#nombre').value = nombre;
        modal.querySelector('#apellido').value = apellido;
        modal.querySelector('#telefono').value = telefono;
        modal.querySelector('#email').value = email;
    });
});
async function actualizarContacto(event) {
    event.preventDefault(); // Evita que el formulario se envíe de la manera tradicional
    const SUPABASE_API_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc';

    const formData = new FormData(event.target); // Obtiene los datos del formulario
    const idProveedor2 = formData.get('id_proveedor'); // Utiliza `get` para obtener el valor
    const id = formData.get('id_contacto'); // Obtiene el ID del contacto desde el formulario
    console.log('ID Proveedor:', idProveedor2);
    // Prepara los datos que se enviarán a la API
    const data = {
        id_proveedor: parseInt(formData.get('id_proveedor')), // Asegúrate de que el nombre de campo coincida con el del formulario
        nombres: formData.get('nombre'), // Asegúrate de que el nombre del campo coincida con el del formulario
        apellidos: formData.get('apellido'), // Asegúrate de que el nombre del campo coincida con el del formulario
        telefono: formData.get('telefono'), // Asegúrate de que el nombre del campo coincida con el del formulario
        email: formData.get('email') // Asegúrate de que el nombre del campo coincida con el del formulario
    };
console.log(data,"acutalizarrr");
    try {
        const response = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/contactos?id_contacto=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_API_KEY,
                'Authorization': `Bearer ${SUPABASE_API_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data) // Convierte los datos a formato JSON
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        // Funciones para mostrar éxito y ocultar el modal
        
        $('#actualizarContactoModal').modal('hide');
        mostrarExito('Contacto actualizado correctamente');
        refreshContactTable(idProveedor2);
        
    } catch (error) {
        console.error('Error al actualizar el contacto:', error);
        mostrarError('No se pudo actualizar el contacto: ' + error.message);
    }
    
}
document.getElementById('actualizarcontactop').addEventListener('submit', actualizarContacto);

