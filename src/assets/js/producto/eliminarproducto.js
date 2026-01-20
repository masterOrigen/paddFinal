import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../../config/supabase.js';

function eliminarProducto(idProducto) {
    console.log("Se obtuvo el id " + idProducto);
  
    // Agregar Sweet Alert
    Swal.fire({
      title: "¿Estás seguro de eliminar el producto?",
      text: "No podrás revertir esto",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        // Eliminar producto si se confirma
        let headersList = {
          "Accept": "*/*",
          "User-Agent": "Thunder Client (https://www.thunderclient.com)",
          "apikey": SUPABASE_API_KEY,
          "Authorization": `Bearer ${SUPABASE_API_KEY}`,
          "Content-Type": "application/json"
        };
  
        let bodyContent = JSON.stringify({});
  
        let response =  fetch(`${SUPABASE_URL}/rest/v1/Productos?id=eq.${idProducto}`, {
          method: "DELETE",
          body: bodyContent,
          headers: headersList
        });
  

        console.log(response);
  
        // Recargar sitio
        location.reload();
      }
    });
  }
