import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

function loadMedio(button) {
    // Obtener el ID del medio desde el atributo data-id del botón
    var idMedio = button.getAttribute('data-idmedio');
    
    // Obtener los datos del medio desde el endpoint
    fetch(`${SUPABASE_URL}/rest/v1/Medios?id=eq.` + idMedio, {
        headers: {
            'apikey': SUPABASE_API_KEY,
            'Authorization': `Bearer ${SUPABASE_API_KEY}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.length > 0) {
            var medio = data[0];

            // Llenar los campos del formulario del modal
            document.querySelector('#updateMedioForm input[name="id"]').value = medio.id;
            document.querySelector('#updateMedioForm input[name="NombredelMedio"]').value = medio.NombredelMedio;
            document.querySelector('#updateMedioForm input[name="codigo"]').value = medio.codigo;
            document.querySelector('#updateMedioForm select[name="Id_Clasificacion"]').value = medio.Id_Clasificacion;

            // Configurar checkboxes
            document.querySelector('#updateMedioForm input[name="duracion"]').checked = medio.duracion;
            document.querySelector('#updateMedioForm input[name="codigo_megatime"]').checked = medio.codigo_megatime;
            document.querySelector('#updateMedioForm input[name="color"]').checked = medio.color;
            document.querySelector('#updateMedioForm input[name="calidad"]').checked = medio.calidad;
            document.querySelector('#updateMedioForm input[name="cooperado"]').checked = medio.cooperado;
            document.querySelector('#updateMedioForm input[name="rubro"]').checked = medio.rubro;

            // Mostrar el modal
            $('#exampleModal').modal('show');
        }
    })
    .catch(error => console.error('Error:', error));
}