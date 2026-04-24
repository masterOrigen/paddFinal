import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

const baseUrl = `${SUPABASE_URL}/rest/v1`;

const headers = {
    'apikey': SUPABASE_API_KEY,
    'Authorization': `Bearer ${SUPABASE_API_KEY}`,
    'Range': '0-9'
};

// Función para obtener datos del soporte y mostrar los medios seleccionados
function obtenerDatos(id) {
    const urlSoporte = `${baseUrl}/Soportes?id_soporte=eq.${id}&select=*`;
    const urlMedios = `${baseUrl}/soporte_medios?id_soporte=eq.${id}&select=*`;

    fetch(urlSoporte, { method: 'GET', headers })
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const soporte = data[0];
                actualizarFormulario(soporte);
                $('#actualizar_soportes').modal('show');
                return fetch(urlMedios, { method: 'GET', headers });
            } else {
                console.error('No se encontraron datos para el ID proporcionado.');
            }
        })
        .then(response => response.json())
        .then(mediosData => {
            if (mediosData && mediosData.length > 0) {
                const mediosIds = mediosData.map(medio => medio.id_medio);
                mostrarMediosSeleccionados(mediosIds);
                actualizarMediosSeleccionados(mediosIds);
            }
            // Obtener y mostrar todos los medios disponibles para seleccionar
            obtenerTodosLosMedios();
        })
        .catch(error => console.error('Error al obtener los datos:', error));
}





// Función para actualizar el formulario con los datos obtenidos
function actualizarFormulario(soporte) {
    const campos = [
        ['id_soporte', 'id_soporte'],
        ['id_proveedor', 'id_proveedor'],
        ['rutProveedorx', 'id_proveedor'],
        ['nombreIdentficiador', 'nombreIdentficiador'],
        ['nombreRepresentante', 'nombreRepresentanteLegal'],
        ['rutSoporte', 'rut_soporte'],
        ['giroProveedorx', 'giro'],
        ['nombreFantasia', 'nombreFantasia'],
        ['rutRepresentantex', 'rutRepresentante'],
        ['razonSocialx', 'razonSocial'],
        ['id_regionx', 'id_region'],
        ['telCelularx', 'telCelular'],
        ['emailx', 'email'],
        ['direccionx', 'direccion'],
        ['id_comunax', 'id_comuna'],
        ['telFijox', 'telFijo'],
        ['bonificacion_anox', 'bonificacion_ano'],
        ['escala_rangox', 'escala']
    ];

    campos.forEach(([nombreCampo, nombreDato]) => {
        const elemento = document.querySelector(`[name="${nombreCampo}"]`);
        if (elemento) {
            elemento.value = soporte[nombreDato] || '';
        } else {
            console.log(`Elemento no encontrado para el campo: ${nombreCampo}`);
        }
    });

    // Actualizar los selects de región y comuna
    if (soporte.id_region) {
        const selectRegion = document.querySelector('[name="id_regionx"]');
        if (selectRegion) selectRegion.value = soporte.id_region;
    }

    if (soporte.id_comuna) {
        const selectComuna = document.querySelector('[name="id_comunax"]');
        if (selectComuna) selectComuna.value = soporte.id_comuna;
    }
}



// Función para agregar o eliminar medios seleccionados dinámicamente
function actualizarMedioSoporte(nombreMedio, idMedio, isChecked) {
    const medioSoporteContainer = document.querySelector('.medio-soporte');
    const spanExistente = medioSoporteContainer.querySelector(`span[data-medio-id="${idMedio}"]`);
    
    if (isChecked && !spanExistente) {
        const span = document.createElement('span');
        span.classList.add('medio-item');
        span.textContent = nombreMedio;
        span.setAttribute('data-medio-id', idMedio);
        span.onclick = () => {
            medioSoporteContainer.removeChild(span);
            const checkbox = document.querySelector(`input[name="id_medios[]"][value="${idMedio}"]`);
            if (checkbox) checkbox.checked = false;
        };
        medioSoporteContainer.appendChild(span);
    } else if (!isChecked && spanExistente) {
        medioSoporteContainer.removeChild(spanExistente);
    }
}

// Escuchar el evento de clic en el botón "Actualizar Soporte"
document.addEventListener('DOMContentLoaded', function() {
    const botonActualizar = document.getElementById('actualizarSoporte');

    if (botonActualizar) {
        botonActualizar.addEventListener('click', function(event) {
            event.preventDefault(); // Prevenir el envío del formulario por defecto

            const idSoporte = parseInt(document.querySelector('input[name="id_soporte"]').value);

            const soporteActualizado = {
                id_soporte: idSoporte,
                id_proveedor: parseInt(document.querySelector('input[name="id_proveedor"]').value),
                nombreIdentficiador: document.querySelector('input[name="nombreIdentficiador"]').value,
                nombreRepresentanteLegal: document.querySelector('input[name="nombreRepresentante"]').value,
                rut_soporte: document.querySelector('input[name="rutSoporte"]').value,
                giro: document.querySelector('input[name="giroProveedorx"]').value,
                nombreFantasia: document.querySelector('input[name="nombreFantasia"]').value,
                rutRepresentante: document.querySelector('input[name="rutRepresentantex"]').value,
                razonSocial: document.querySelector('input[name="razonSocialx"]').value,
                id_region: parseInt(document.querySelector('select[name="id_regionx"]').value),
                id_comuna: parseInt(document.querySelector('select[name="id_comunax"]').value),
                telCelular: document.querySelector('input[name="telCelularx"]').value,
                email: document.querySelector('input[name="emailx"]').value,
                direccion: document.querySelector('input[name="direccionx"]').value,
                telFijo: document.querySelector('input[name="telFijox"]').value,
                bonificacion_ano: document.querySelector('input[name="bonificacion_anox"]').value,
                escala: document.querySelector('input[name="escala_rangox"]').value
            };

            const urlSoporte = `${baseUrl}/Soportes?id_soporte=eq.${idSoporte}`;
            const urlSoporteMedios = `${baseUrl}/soporte_medios?id_soporte=eq.${idSoporte}&select=*`;

            // Primero, actualiza el soporte
            fetch(urlSoporte, {
                method: 'PATCH',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(soporteActualizado)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error en la actualización del soporte: ${response.statusText}`);
                }
                return response.json().catch(() => ({})); // Manejar la respuesta vacía
            })
            .then(data => {
                console.log('Soporte actualizado:', data);

                // Obtener los medios actuales asociados al soporte
                return fetch(urlSoporteMedios, {
                    method: 'GET',
                    headers
                });
            })
            .then(response => response.json())
            .then(mediosActuales => {
                const mediosSeleccionados = Array.from(document.querySelectorAll('input[name="id_medios[]"]:checked'))
                    .map(checkbox => ({
                        id_soporte: idSoporte,
                        id_medio: parseInt(checkbox.value)
                    }));

                // Identificar medios para eliminar
                const mediosParaEliminar = mediosActuales.filter(medioActual => 
                    !mediosSeleccionados.some(m => m.id_medio === medioActual.id_medio)
                ).map(medio => medio.id_medio);

                // Identificar nuevos medios para agregar
                const mediosParaAgregar = mediosSeleccionados.filter(m => 
                    !mediosActuales.some(medioActual => medioActual.id_medio === m.id_medio)
                );

                // Eliminar medios no seleccionados
                const deletePromises = mediosParaEliminar.map(id_medio => {
                    return fetch(`${urlSoporteMedios}?id_soporte=eq.${idSoporte}&id_medio=eq.${id_medio}`, {
                        method: 'DELETE',
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json'
                        }
                    });
                });

                // Agregar nuevos medios seleccionados
                const addPromise = mediosParaAgregar.length > 0
                    ? fetch(urlSoporteMedios, {
                        method: 'POST',
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(mediosParaAgregar)
                    })
                    : Promise.resolve();

                return Promise.all([...deletePromises, addPromise]);
            })
            .then(() => {
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'El soporte y los medios han sido actualizados correctamente.',
                    icon: 'success'
                }).then(() => {
                    // Recargar la página después de que el usuario cierre la alerta
                    window.location.reload();
                });
            })
            .catch(error => console.error('Error al actualizar el soporte:', error));
        });
    } else {
        console.error('El elemento con id "actualizarSoporte" no se encontró.');
    }
});
