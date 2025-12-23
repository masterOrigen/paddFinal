document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveBtn');
    const modal = document.getElementById('actualizaragencia');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            submitForm();
        });
    }

    async function submitForm() {
        const formData = getFormData();
        const idAgencia = document.querySelector('input[name="id_agencia"]').value;
        const bodyContent = JSON.stringify(formData);
        const headersList = {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
        };

        try {
            const response = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Agencias?id=eq.${idAgencia}`, {
                method: "PATCH",
                body: bodyContent,
                headers: headersList
            });

            if (response.ok) {
                await closeModalAndRemoveBackdrop();
                
                await Swal.fire({
                    title: '¡Éxito!',
                    text: 'La agencia se ha actualizado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });

                // Mostrar el GIF de carga
                showLoading();

                // Recargar la página de forma suave
                location.reload();
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error("Error:", error);
            await Swal.fire({
                title: 'Error',
                text: 'Ha ocurrido un error al actualizar la agencia. Por favor, inténtelo nuevamente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    async function closeModalAndRemoveBackdrop() {
        return new Promise((resolve) => {
            if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                    modal.addEventListener('hidden.bs.modal', function onHidden() {
                        modal.removeEventListener('hidden.bs.modal', onHidden);
                        removeBackdrop();
                        resolve();
                    });
                } else {
                    removeBackdrop();
                    resolve();
                }
            } else {
                removeBackdrop();
                resolve();
            }
        });
    }

    function removeBackdrop() {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    function showLoading() {
        let loadingElement = document.getElementById('custom-loading');
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'custom-loading';
            loadingElement.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;">
                    <img src="/assets/img/loading.gif" alt="Cargando..." style="width: 220px; height: 135px;">
                </div>
            `;
            document.body.appendChild(loadingElement);
        }
        loadingElement.style.display = 'block';
    }

    function getFormData() {
        const form = document.getElementById('formularioactualizar23');
        const formData = new FormData(form);
        const dataObject = Object.fromEntries(formData.entries());
        
        return {
            RazonSocial: dataObject.razonSocial,
            NombreDeFantasia: dataObject.nombreFantasia,
            RutAgencia: dataObject.rut,
            Giro: dataObject.giro,
            NombreRepresentanteLegal: dataObject.nombreRepresentanteLegal,
            Comuna: dataObject.id_comuna,
            Email: dataObject.email || null,
            estado: true,
            NombreIdentificador: dataObject.nombreIdentificador,
            telCelular: dataObject.telCelular,
            telFijo: dataObject.telFijo,
            Region: dataObject.id_region,
            DireccionAgencia: dataObject.direccionagencia,
            rutRepresentante: dataObject.rutRepresentante,
        };
    }
});