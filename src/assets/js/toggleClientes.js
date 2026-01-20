document.addEventListener('DOMContentLoaded', function() {
    const SUPABASE_URL = 'https://stnwcwzhazopsphgzkvl.supabase.co';
    const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bndjd3poYXpvcHNwaGd6a3ZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MjY1MywiZXhwIjoyMDg0NDE4NjUzfQ.JJgSUKWpfm-IB37vtWsGsu9Z_37Mot8yW8oVnFC2iy4';
    
    // Función para actualizar el estado del cliente
    async function actualizarEstadoCliente(clienteId, nuevoEstado, toggleElement) {
        console.log(`Actualizando cliente - ID: ${clienteId}, Nuevo estado: ${nuevoEstado}`);
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/Clientes?id_cliente=eq.${clienteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            console.log('Estado actualizado con éxito en la base de datos');

            // Actualizar el estado del toggle en la UI
            toggleElement.checked = nuevoEstado;

            // Actualizar el título del tooltip
            const label = toggleElement.closest('label');
            if (label) {
                label.setAttribute('title', nuevoEstado ? 'Desactivar Cliente' : 'Activar Cliente');
                // Si estás usando Bootstrap tooltips, actualízalo
                $(label).tooltip('dispose').tooltip();
            }

            Swal.fire({
                icon: 'success',
                title: 'Estado actualizado',
                text: `El cliente ha sido ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`,
                showConfirmButton: false,
                timer: 1500
            });

        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            
            // Revertir el estado del toggle en la UI
            toggleElement.checked = !nuevoEstado;
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar el estado del cliente: ' + error.message
            });
        }
    }

    // Event listener para los toggles de estado
    document.querySelectorAll('.estado-switch').forEach(toggleSwitch => {
        toggleSwitch.addEventListener('change', function(event) {
            const clienteId = this.getAttribute('data-id');
            const nuevoEstado = this.checked;
            
            console.log(`Toggle cambiado - Cliente ID: ${clienteId}, Nuevo estado: ${nuevoEstado}`);
            
            // Prevenir el cambio inmediato del switch
            event.preventDefault();
            
            // Mostrar confirmación antes de actualizar
            Swal.fire({
                title: '¿Estás seguro?',
                text: `¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} este cliente?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cambiar estado!',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    actualizarEstadoCliente(clienteId, nuevoEstado, this);
                } else {
                    // Si el usuario cancela, revertimos el estado del toggle
                    this.checked = !nuevoEstado;
                }
            });
        });
    });

    console.log('Script de toggle de estado de clientes inicializado');
});