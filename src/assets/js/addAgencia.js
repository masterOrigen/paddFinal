import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    const btnGuardarAgencia = document.getElementById('btnGuardarAgencia');
    const formularioAgregarAgencia = document.getElementById('formularioAgregarAgencia');

    btnGuardarAgencia.addEventListener('click', function(event) {
        event.preventDefault();
        if (formularioAgregarAgencia.checkValidity()) {
            submitForm();
        } else {
            formularioAgregarAgencia.reportValidity();
        }
    });

    function getFormData() {
        const formData = new FormData(formularioAgregarAgencia);
        const dataObject = {};
        formData.forEach((value, key) => {
            dataObject[key] = value;
        });
        console.log(dataObject, "Datos del formulario");

        return {
            created_at: new Date().toISOString(),
            NombreDeFantasia: dataObject.nombreFantasia,
            RazonSocial: dataObject.razonSocial,
            NombreIdentificador: dataObject.nombreIdentificador,
            RutAgencia: dataObject.rut,
            Giro: dataObject.giro,
            NombreRepresentanteLegal: dataObject.nombreRepresentanteLegal,
            rutRepresentante: dataObject.rutRepresentante,
            DireccionAgencia: dataObject.direccionagencia,
            Region: dataObject.id_region,
            Comuna: dataObject.id_comuna,
            telCelular: dataObject.telCelular,
            telFijo: dataObject.telFijo,
            Email: dataObject.email,
            estado: true
        };
    }

    function submitForm() {
        let bodyContent = JSON.stringify(getFormData());
        console.log(bodyContent, "Datos a enviar");

        let headersList = {
            "Content-Type": "application/json",
            "apikey": SUPABASE_API_KEY,
            "Authorization": `Bearer ${SUPABASE_API_KEY}`
        };

        fetch(`${SUPABASE_URL}/rest/v1/Agencias`, {
            method: "POST",
            body: bodyContent,
            headers: headersList
        })
        .then(response => {
            if (response.ok) {
                // En lugar de response.json(), usamos response.text()
                return response.text().then(text => {
                    return text ? JSON.parse(text) : {}
                });
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        })
        .then(data => {
            console.log("Registro correcto", data);
            Swal.fire({
                title: '¡Éxito!',
                text: 'La agencia ha sido agregada correctamente.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.reload();
                }
            });
            const modal = bootstrap.Modal.getInstance(document.getElementById('agregarAgenciaModal'));
            modal.hide();
        })
        .catch(error => {
            console.error("Error:", error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al agregar la agencia. Por favor, inténtalo de nuevo.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
    }

    // Filtrar comunas por región seleccionada
    const regionSelect = document.getElementById('region');
    const comunaSelect = document.getElementById('comuna');
    
    regionSelect.addEventListener('change', function() {
        const regionId = this.value;
        const comunaOptions = comunaSelect.querySelectorAll('option');
        
        comunaOptions.forEach(function(option) {
            if (option.getAttribute('data-region') === regionId) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
        
        const firstVisibleOption = comunaSelect.querySelector('option[data-region="' + regionId + '"]:not([style*="display: none"])');
        if (firstVisibleOption) {
            firstVisibleOption.selected = true;
        }
    });

    regionSelect.dispatchEvent(new Event('change'));
});