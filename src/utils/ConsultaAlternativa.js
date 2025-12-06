import { supabase } from '../config/supabase';

/**
 * Función para consultar una alternativa por su ID
 * @param {number} id - ID de la alternativa a consultar
 * @returns {Object} - Datos de la alternativa con todas sus relaciones
 */
export const consultarAlternativaPorId = async (id) => {
  try {
    if (!id) {
      console.error('ID de alternativa no proporcionado');
      return null;
    }

    const { data, error } = await supabase
      .from('alternativa')
      .select(`
        id,
        numerorden,
        nlinea,
        anio,
        mes,
        id_campania,
        num_contrato,
        id_soporte,
        descripcion,
        tipo_item,
        id_clasificacion,
        detalle,
        id_tema,
        segundos,
        total_general,
        total_neto,
        descuento_pl,
        id_programa,
        calendar,
        recargo_plan,
        valor_unitario,
        medio,
        total_bruto,
        ordencreada,
        copia,
        estado_orden,
        horario_inicio,
        horario_fin,
        created_at,
        Programas:id_programa(id, descripcion),
        Clasificacion(id, NombreClasificacion),
        Temas(id_tema, NombreTema),
        Soportes(id_soporte, nombreIdentficiador),
        Anios(id, years),
        Meses(Id, Nombre),
        Medios(id, "NombredelMedio"),
        Campania:id_campania (
          id_campania,
          NombreCampania,
          Presupuesto,
          id_Cliente,
          id_Producto,
          Clientes (id_cliente, nombreCliente, RUT, razonSocial),
          Productos (id, NombreDelProducto)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al consultar alternativa:', error);
      return null;
    }

    if (!data) {
      console.log(`No se encontró alternativa con ID ${id}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error general al consultar alternativa:', error);
    return null;
  }
};

/**
 * Función para consultar todas las alternativas de una orden
 * @param {string} numeroOrden - Número de orden para filtrar alternativas
 * @returns {Array} - Lista de alternativas asociadas a la orden
 */
export const consultarAlternativasPorOrden = async (numeroOrden) => {
  try {
    if (!numeroOrden) {
      console.error('Número de orden no proporcionado');
      return [];
    }

    const { data, error } = await supabase
      .from('alternativa')
      .select(`
        id,
        numerorden,
        nlinea,
        anio,
        mes,
        id_campania,
        num_contrato,
        id_soporte,
        descripcion,
        tipo_item,
        id_clasificacion,
        detalle,
        id_tema,
        segundos,
        total_general,
        total_neto,
        descuento_pl,
        id_programa,
        calendar,
        recargo_plan,
        valor_unitario,
        medio,
        total_bruto,
        ordencreada,
        copia,
        estado_orden,
        Programas:id_programa(id, descripcion),
        Clasificacion(id, NombreClasificacion),
        Temas(id_tema, NombreTema),
        Soportes(id_soporte, nombreIdentficiador),
        Anios(id, years),
        Meses(Id, Nombre),
        Medios(id, "NombredelMedio")
      `)
      .eq('numerorden', numeroOrden)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al consultar alternativas de la orden:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`No se encontraron alternativas para la orden ${numeroOrden}`);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error general al consultar alternativas de la orden:', error);
    return [];
  }
};

/**
 * Procesa el calendario de una alternativa y lo convierte en formato legible
 * @param {Object} alternativa - Objeto alternativa con datos de calendario
 * @returns {string} - Calendario formateado
 */
export const procesarCalendario = (alternativa) => {
  if (!alternativa?.calendar) {
    return '';
  }
  
  try {
    let calendarData = alternativa.calendar;
    if (typeof calendarData === 'string') {
      try {
        calendarData = JSON.parse(calendarData);
      } catch (e) {
        return '';
      }
    }
    
    if (Array.isArray(calendarData)) {
      if (calendarData.length > 0 && calendarData[0].dia) {
        // Si es formato con {dia, cantidad}
        return calendarData.map(item => `${item.dia}: ${item.cantidad || 1}`).join(', ');
      } else {
        // Si es un array simple de días
        return calendarData.join(', ');
      }
    } else if (calendarData && calendarData.days && Array.isArray(calendarData.days)) {
      // Si es formato con propiedad days
      return calendarData.days.join(', ');
    }
    
    return '';
  } catch (e) {
    return '';
  }
}; 