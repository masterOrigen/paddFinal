import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

document.addEventListener('DOMContentLoaded', function () {
    $('#agregarsoporteprov').on('shown.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var idProveedor = button.data('id-proveedor');
        console.log("ID Proveedor:", idProveedor);

        var inputPrueba = document.getElementById('pruebaid');
        inputPrueba.value = idProveedor;

        // Realizar la petición para obtener todos los soportes vinculados al proveedor actual
        fetch(`${SUPABASE_URL}/rest/v1/proveedor_soporte?select=id_soporte&id_proveedor=eq.${idProveedor}`, {
            headers: {
                'apikey': SUPABASE_API_KEY,
                'Authorization': `Bearer ${SUPABASE_API_KEY}`,
            }
        })
        .then(response => response.json())
        .then(proveedor_soportes => {
            let vinculados_str = '';
            if (proveedor_soportes && proveedor_soportes.length > 0) {
                const vinculados = proveedor_soportes.map(soporte => soporte.id_soporte);
                vinculados_str = vinculados.filter(id => id).join(','); // Filtrar valores vacíos
            } 

            // Realizar la petición para obtener soportes no vinculados o todos los soportes si no hay vinculados
            const url = vinculados_str 
                ? `${SUPABASE_URL}/rest/v1/Soportes?id_soporte=not.in.(${vinculados_str})&select=*`
                : `${SUPABASE_URL}/rest/v1/Soportes?select=*`;

            return fetch(url, {
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`,
                }
            })
        })
        .then(response => response.json())
        .then(soportes_no_vinculados => {
            console.log(soportes_no_vinculados);

            var soporteSelect = document.getElementById('soporteSelect');
            soporteSelect.innerHTML = '';

            if (soportes_no_vinculados && soportes_no_vinculados.length > 0) {
                soportes_no_vinculados.forEach(function (soporte) {
                    var option = document.createElement('option');
                    option.value = soporte.id_soporte;
                    option.textContent = soporte.nombreIdentficiador;
                    soporteSelect.appendChild(option);
                });
            } else {
                console.warn("No se encontraron soportes no vinculados.");
            }
        })
        .catch(error => console.error("Error al obtener soportes:", error));
    });



    document.getElementById('formagregarsoporte2').addEventListener('submit', function (event) {
    event.preventDefault();

    var idProveedor = document.getElementsByName('pruebaid')[0].value;
    var idSoporte = document.getElementById('soporteSelect').value;

    if (!idProveedor || !idSoporte) {
        console.error("ID Proveedor o ID Soporte no válidos.");
        return;
    }

    fetch(`${SUPABASE_URL}/rest/v1/proveedor_soporte`, {
        method: 'POST',
        headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_API_KEY,
        "Authorization": `Bearer ${SUPABASE_API_KEY}`
                },
        body: JSON.stringify({
            id_proveedor: idProveedor,
            id_soporte: idSoporte
        })
    })
    .then(async response => {
        console.log('Código de estado:', response.status); // Imprime el código de estado
        
        const text = await response.text(); // Espera a que se complete la conversión a texto

        if (response.ok) {
            $('#agregarsoporteprov').modal('hide');
            
            // Espera a que se muestre el mensaje de éxito
            await mostrarExito('Soporte agregado correctamente');
    
            // Mostrar el GIF de carga
            showLoading();
            location.reload();
                try {
                    return JSON.parse(text); // Intenta parsear el texto como JSON
                } catch (error) {
                    throw new Error('Respuesta no es JSON válido: ' + text);
                }
            } else {
                throw new Error(`Error ${response.status}: ${text}`);
            }
        })
  
    .then(async (data) => {
        await mostrarExito('Soporte agregado correctamente');

        // Mostrar el GIF de carga
        showLoading();
        location.reload();
    })
    .catch(error => {
        console.error("Error al registrar el soporte:", error.message);
        // Puedes mostrar un mensaje de error aquí
    });
});
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

async function mostrarExito(mensaje) {
    return new Promise((resolve) => {
        // Asumiendo que esta función muestra un mensaje y luego resuelve la promesa
        Swal.fire({
            title: '¡Éxito!',
            text: mensaje,
            icon: 'success',
            confirmButtonText: 'OK'
        }).then(() => {
            resolve(); // Resuelve la promesa cuando se cierra el Swal
        });
    });
}

});


