import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../../config/supabase.js';

document.addEventListener('DOMContentLoaded', function () {
    const updateButton = document.getElementById('updateButton');

    if (updateButton) {
        updateButton.addEventListener('click', function () {
            const id = updateButton.getAttribute('data-id');

            // Carga los datos de la campaña
            cargarDatosFormulario(id);
        });
    } else {
        console.error('Botón de actualización no encontrado');
    }
});

function cargarDatosFormulario(id) {

    const url = `${SUPABASE_URL}/rest/v1/Campania?id_campania=eq.${id}`;

    fetch(url, {
        headers: {
            "apikey": SUPABASE_API_KEY,
            "Authorization": `Bearer ${SUPABASE_API_KEY}`,
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const campaign = data[0];

                // Rellenar los campos del formulario con los datos de la campaña
                document.getElementById('campaniaId').value = campaign.id_campania;
                document.getElementById('NombreCampaniaUpdate').value = campaign.NombreCampania;
                document.getElementById('AnioUpdate').value = campaign.Anio;
                document.getElementById('id_ClienteUpdate').value = campaign.id_Cliente;
                document.getElementById('Id_AgenciaUpdate').value = campaign.Id_Agencia;
                document.getElementById('id_ProductoUpdate').value = campaign.id_Producto;
                document.getElementById('PresupuestoUpdate').value = campaign.Presupuesto;

            } else {
                console.error('No se encontraron datos para la campaña con ID:', id);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se encontraron datos para la campaña.',
                });
            }
        })
        .catch(error => {
            console.error('Error al cargar la campaña:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al cargar los datos de la campaña.',
            });
        });
}

function actualizarCompania() {
    const form = document.getElementById('formularioUpdateCampania');
    const formData = new FormData(form);

    const campaniaId = formData.get('campaniaId');
    const NombreCampaniaUpdate = formData.get('NombreCampaniaUpdate');
    const AnioUpdate = formData.get('AnioUpdate');
    const id_ClienteUpdate = formData.get('id_ClienteUpdate');
    const Id_AgenciaUpdate = formData.get('Id_AgenciaUpdate');
    const id_ProductoUpdate = formData.get('id_ProductoUpdate');
    const PresupuestoUpdate = formData.get('PresupuestoUpdate');


    // Crear un objeto con los datos del formulario
    const data = {};

    // Mapeo de campos con "Update" al formato requerido
    const mapping = {
        "NombreCampania": NombreCampaniaUpdate,
        "Anio": parseInt(AnioUpdate),
        "id_Cliente": parseInt(id_ClienteUpdate),
        "Id_Agencia": parseInt(Id_AgenciaUpdate),
        "id_Producto": parseInt(id_ProductoUpdate),
        "Presupuesto": parseInt(PresupuestoUpdate),
    };
    
   

    // Construir el path con el ID de la campaña
    const url = `${SUPABASE_URL}/rest/v1/Campania?id_campania=eq.${campaniaId}`;


  
    // Realizar la solicitud PUT o PATCH para actualizar la campaña
    fetch(url, {
        method: 'PATCH', // o 'PUT' dependiendo de tu API
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_API_KEY,
            'Authorization': `Bearer ${SUPABASE_API_KEY}`
        },
        body: JSON.stringify(mapping)
       
    })
        .then(async data => {
            console.log('Campaña actualizada con éxito:', data);
           await mostrarExito('La campaña se ha actualizado correctamente.');
            // Swal.fire({
            //     icon: 'success',
            //     title: '¡Actualización exitosa!',
            //     text: 'La campaña se ha actualizado correctamente.',
            //     showConfirmButton: false,
            //     timer: 1500
            // });
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalUpdateCampania'));
            modal.hide();
            showLoading();
            window.location.reload();
        })
}


async function mostrarExito(mensaje) {
    return new Promise((resolve) => {
        // Asumiendo que esta función muestra un mensaje y luego resuelve la promesa
        Swal.fire({
                  title: 'Éxito!',
                text: mensaje,
                icon: 'success',
                showConfirmButton: false,
                timer: 1500
        }).then(() => {
            resolve(); // Resuelve la promesa cuando se cierra el Swal
        });
    });
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
