document.addEventListener('DOMContentLoaded', function() {
    const SUPABASE_URL = 'https://stnwcwzhazopsphgzkvl.supabase.co';
    const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bndjd3poYXpvcHNwaGd6a3ZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MjY1MywiZXhwIjoyMDg0NDE4NjUzfQ.JJgSUKWpfm-IB37vtWsGsu9Z_37Mot8yW8oVnFC2iy4';

    // Función para actualizar el estado del soporte
    async function actualizarestadoSoporte(soporteID, nuevoEstado, toggleElement) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/Soportes?id_soporte=eq.${soporteID}`, {
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

            // Actualizar el estado del toggle en la UI
            toggleElement.checked = nuevoEstado;

            // Actualizar el título del tooltip
            const label = toggleElement.closest('label');
            if (label) {
                label.setAttribute('title', nuevoEstado ? 'Desactivar Soporte' : 'Activar Soporte');
                // Si estás usando Bootstrap tooltips, actualízalo
                $(label).tooltip('dispose').tooltip();
            }

            Swal.fire({
                icon: 'success',
                title: 'Estado actualizado',
                text: `El Soporte ha sido ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`,
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
                text: 'No se pudo actualizar el estado del Soporte: ' + error.message
            });
        }
    }

    // Event listener para los toggles de estado
    document.querySelectorAll('.estado-soporte').forEach(toggleSwitch => {
        toggleSwitch.addEventListener('change', function(event) {
            const soporteID = this.getAttribute('data-id');
            const nuevoEstado = this.checked;
            
            // Prevenir el cambio inmediato del switch
            event.preventDefault();
            
            // Mostrar confirmación antes de actualizar
            Swal.fire({
                title: '¿Estás seguro?',
                text: `¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} este Soporte?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cambiar estado!',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    actualizarestadoSoporte(soporteID, nuevoEstado, this);
                } else {
                    // Si el usuario cancela, revertimos el estado del toggle
                    this.checked = !nuevoEstado;
                }
            });
        });
    });
});