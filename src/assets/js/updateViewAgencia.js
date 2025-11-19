// Asegurarse de que este código se ejecute solo una vez
(function() {
    if (window.hasRun) return;
    window.hasRun = true;

    // Función para obtener los datos del formulario
    function getFormData() {
        const formData = new FormData(document.getElementById('formularioactualizar23'));
        const dataObject = {};
        formData.forEach((value, key) => {
            dataObject[key] = value;
        });
        return {
            RazonSocial: dataObject.razonSocial,
            NombreDeFantasia: dataObject.nombreFantasia,
            RutAgencia: dataObject.rut,
            Giro: dataObject.giro,
            NombreRepresentanteLegal: dataObject.nombreRepresentanteLegal,
            Comuna: dataObject.id_comuna,
            Email: dataObject.email || null,
            estado: true, // Asumimos que la agencia está activa al actualizarla
            NombreIdentificador: dataObject.nombreIdentificador,
            telCelular: dataObject.telCelular,
            telFijo: dataObject.telFijo,
            Region: dataObject.id_region,
            DireccionAgencia: dataObject.direccionagencia,
            rutRepresentante: dataObject.rutRepresentante,
        };
    }

    // Función para enviar el formulario con PATCH
    async function submitForm(event) {
        event.preventDefault();
        let bodyContent = JSON.stringify(getFormData());
        let idAgencia = document.querySelector('input[name="id_agencia"]').value;
        let headersList = {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
        };
        try {
            let response = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Agencias?id=eq.${idAgencia}`, {
                method: "PATCH",
                body: bodyContent,
                headers: headersList
            });
            if (response.ok) {
                // Cerrar el modal
                let modal = bootstrap.Modal.getInstance(document.getElementById('actualizaragencia'));
                modal.hide();
                // Mostrar Sweet Alert
                await Swal.fire({
                    title: '¡Éxito!',
                    text: 'La agencia se ha actualizado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                // Recargar la página
                window.location.reload();
            } else {
                // Si hubo un error en la actualización
                const errorData = await response.json();
                console.error("Error:", errorData);
                await Swal.fire({
                    title: 'Error',
                    text: 'Ha ocurrido un error al actualizar la agencia. Por favor, inténtelo nuevamente.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error("Error:", error);
            await Swal.fire({
                title: 'Error',
                text: 'Ha ocurrido un error inesperado. Por favor, inténtelo nuevamente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Función para inicializar el manejo de eventos
    function initializeEventHandlers() {
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.removeEventListener('click', submitForm);
            saveBtn.addEventListener('click', submitForm);
        }
    }

    // Inicializar los manejadores de eventos cuando se abre el modal
    const modal = document.getElementById('actualizaragencia');
    if (modal) {
        modal.addEventListener('show.bs.modal', initializeEventHandlers);
    }

    // Remover el onclick del botón en el HTML
    document.addEventListener('DOMContentLoaded', function() {
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.removeAttribute('onclick');
        }
    });
})();