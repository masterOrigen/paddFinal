import { supabase } from '../config/supabase';
import * as XLSX from 'xlsx';
import { format, parse, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Función para generar un Excel con el formato del informe de inversión
 * @param {Object} filtros - Filtros para la consulta (opcional)
 */
export const generarExcelInformeInversion = async (filtros = {}) => {
  try {
    console.log('Generando informe de inversión...');
    console.log('Filtros aplicados:', filtros);
    
    // Array para almacenar todas las filas del informe
    let filasInforme = [];
    
    // Iniciar la consulta base a OrdenesDePublicidad
    let query = supabase
      .from('OrdenesDePublicidad')
      .select(`
        id_ordenes_de_comprar,
        fechaCreacion,
        numero_correlativo,
        copia,
        estado,
        alternativas_plan_orden,
        OrdenesUsuarios!left (
          id_orden_usuario,
          Usuarios (
            id_usuario,
            Nombre,
            Email,
            id_grupo,
            Grupos (id_grupo, nombre_grupo)
          )
        ),
        Campania!inner (
          id_campania,
          NombreCampania,
          Presupuesto,
          id_Cliente,
          id_Producto,
          Clientes (id_cliente, nombreCliente, RUT, razonSocial),
          Productos!id_Producto (id, NombreDelProducto)
        ),
        Contratos (
          id,
          NombreContrato,
          num_contrato,
          id_FormadePago,
          IdProveedor,
          FormaDePago (id, NombreFormadePago),
          Proveedores (id_proveedor, nombreProveedor, rutProveedor)
        ),
        Soportes (id_soporte, nombreIdentficiador, id_medios),
        plan (
          id,
          nombre_plan,
          anio,
          mes,
          Anios!anio (id, years),
          Meses (Id, Nombre)
        )
      `);
    
    // Aplicar filtros si existen
    if (filtros.cliente) {
      query = query.eq('Campania.id_Cliente', filtros.cliente);
    }
    
    if (filtros.fechaInicio) {
      query = query.gte('fechaCreacion', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      query = query.lte('fechaCreacion', filtros.fechaFin);
    }
    
    // Ordenar por fecha de creación descendente
    query = query.order('fechaCreacion', { ascending: false });
    
    // Ejecutar la consulta
    const { data: ordenes, error: errorOrdenes } = await query;
    
    if (errorOrdenes) {
      console.error('Error al obtener órdenes:', errorOrdenes);
      throw new Error('Error al obtener órdenes');
    }
    
    if (!ordenes || ordenes.length === 0) {
      console.log('No se encontraron órdenes para generar el informe');
      return null;
    }
    
    console.log(`Se encontraron ${ordenes.length} órdenes para procesar`);
    
    // Procesar cada orden de compra
    for (const orden of ordenes) {
      // Extraer IDs de alternativas usando el helper
      const idsAlternativas = extraerIdsAlternativas(orden.alternativas_plan_orden);
      
      console.log(`Orden ${orden.id_ordenes_de_comprar} (${orden.numero_correlativo}) tiene ${idsAlternativas.length} alternativas`);
      
      // Si hay alternativas, buscarlas y procesarlas
      if (idsAlternativas.length > 0) {
        // Búsqueda detallada de alternativas con todas las relaciones necesarias
        const { data: alternativas, error: errorAlternativas } = await supabase
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
            Medios(id, nombre),
            Campania:id_campania(id_campania, NombreCampania)
          `)
          .in('id', idsAlternativas);
        
        if (errorAlternativas) {
          console.error(`Error al obtener alternativas para la orden ${orden.id_ordenes_de_comprar}:`, errorAlternativas);
          continue; // Pasar a la siguiente orden
        }
        
        if (!alternativas || alternativas.length === 0) {
          console.log(`No se encontraron alternativas para la orden ${orden.id_ordenes_de_comprar} a pesar de tener IDs`);
          
          // Crear una fila con datos básicos de la orden si no hay alternativas
          filasInforme.push(crearFilaBasicaOrden(orden));
          continue; // Pasar a la siguiente orden
        }
        
        console.log(`Se encontraron ${alternativas.length} alternativas para la orden ${orden.id_ordenes_de_comprar}`);
        
        // Procesar cada alternativa y generar una fila en el informe
        alternativas.forEach(alt => {
          // Procesar calendario para obtener la fecha de exhibición con días de la semana
          const fechaExhibicion = procesarCalendario(alt);
          
          // Crear una fila del informe
          filasInforme.push({
            'CLIENTE': orden.Campania?.Clientes?.nombreCliente || '',
            'Mes': obtenerNombreMes(orden, alt),
            'Año': obtenerAnio(orden, alt),
            'N° de Ctto.': orden.Contratos?.num_contrato || alt.num_contrato || '',
            'N° de Orden': orden.numero_correlativo || alt.numerorden || '',
            'Version': orden.copia || alt.copia || '',
            'Medio': obtenerNombreMedio(orden, alt),
            'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
            'Soporte': obtenerNombreSoporte(orden, alt),
            'Campaña': obtenerNombreCampania(orden, alt),
            'Plan de Medios': orden.plan?.nombre_plan || '',
            'Producto': orden.Campania?.Productos?.NombreDelProducto || '',
            'Tema': alt.Temas?.NombreTema || '',
            'Seg': alt.segundos || '',
            'Prog./Elem./Formato': alt.Programas?.descripcion || alt.descripcion || '',
            'Fecha Exhib./Pub.': fechaExhibicion || '',
            'Inversion Neta': alt.total_neto || 0,
            'Agen.Creativa': '',
            'Cod. Univ. Aviso': '',
            'Cod. Univ. Prog.': '',
            'Calidad': alt.Clasificacion?.NombreClasificacion || '',
            'Nombre Usuario': getUsuarioInfo(orden, 'nombre') || '',
            'Grupo Usuario': getUsuarioInfo(orden, 'grupo') || ''
          });
        });
      } else {
        // Si no hay alternativas, intentar buscar por número de orden
        const numeroOrden = orden.numero_correlativo;
        
        if (numeroOrden) {
          console.log(`Intentando buscar alternativas por número de orden: ${numeroOrden}`);
          
          const { data: alternativasPorNumero, error: errorAlternativasPorNumero } = await supabase
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
              Medios(id, nombre),
              Campania:id_campania(id_campania, NombreCampania)
            `)
            .eq('numerorden', numeroOrden);
          
          if (errorAlternativasPorNumero) {
            console.error(`Error al buscar alternativas por número de orden ${numeroOrden}:`, errorAlternativasPorNumero);
          } else if (alternativasPorNumero && alternativasPorNumero.length > 0) {
            console.log(`Se encontraron ${alternativasPorNumero.length} alternativas por número de orden ${numeroOrden}`);
            
            // Procesar cada alternativa encontrada por número de orden
            alternativasPorNumero.forEach(alt => {
              // Procesar calendario para fecha de exhibición
              const fechaExhibicion = procesarCalendario(alt);
              
              // Crear una fila del informe
              filasInforme.push({
                'CLIENTE': orden.Campania?.Clientes?.nombreCliente || '',
                'Mes': obtenerNombreMes(orden, alt),
                'Año': obtenerAnio(orden, alt),
                'N° de Ctto.': orden.Contratos?.num_contrato || alt.num_contrato || '',
                'N° de Orden': orden.numero_correlativo || alt.numerorden || '',
                'Version': orden.copia || alt.copia || '',
                'Medio': obtenerNombreMedio(orden, alt),
                'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
                'Soporte': obtenerNombreSoporte(orden, alt),
                'Campaña': obtenerNombreCampania(orden, alt),
                'Plan de Medios': orden.plan?.nombre_plan || '',
                'Producto': orden.Campania?.Productos?.NombreDelProducto || '',
                'Tema': alt.Temas?.NombreTema || '',
                'Seg': alt.segundos || '',
                'Prog./Elem./Formato': alt.Programas?.descripcion || alt.descripcion || '',
                'Fecha Exhib./Pub.': fechaExhibicion || '',
                'Inversion Neta': alt.total_neto || 0,
                'Agen.Creativa': '',
                'Cod. Univ. Aviso': '',
                'Cod. Univ. Prog.': '',
                'Calidad': alt.Clasificacion?.NombreClasificacion || '',
                'Nombre Usuario': getUsuarioInfo(orden, 'nombre') || '',
                'Grupo Usuario': getUsuarioInfo(orden, 'grupo') || ''
              });
            });
          } else {
            console.log(`No se encontraron alternativas por número de orden ${numeroOrden}`);
            // Crear una fila con datos básicos de la orden
            filasInforme.push(crearFilaBasicaOrden(orden));
          }
        } else {
          console.log(`La orden ${orden.id_ordenes_de_comprar} no tiene número de orden ni alternativas`);
          // Crear una fila con datos básicos de la orden
          filasInforme.push(crearFilaBasicaOrden(orden));
        }
      }
    }
    
    console.log(`Se generaron ${filasInforme.length} filas para el informe de inversión`);
    
    // Si no hay datos, retornar
    if (filasInforme.length === 0) {
      console.log('No se generaron filas para el informe');
      return null;
    }
    
    // Formatear números en las filas
    filasInforme = filasInforme.map(fila => {
      // Formatear inversión neta como número
      if (fila['Inversion Neta']) {
        fila['Inversion Neta'] = Number(fila['Inversion Neta']);
      }
      return fila;
    });
    
    // Crear un Workbook de Excel
    const wb = XLSX.utils.book_new();
    
    // Crear una Worksheet con los datos
    const ws = XLSX.utils.json_to_sheet(filasInforme);
    
    // Añadir título al Excel en la celda A1
    XLSX.utils.sheet_add_aoa(ws, [
      ['INFORME DE INVERSION: DETALLE ORDENES POR CLIENTE //MEDIO//PROVEEDOR//SOPORTE//ORDENES', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [`AÑO: ${new Date().getFullYear()}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    ], { origin: 'A1' });
    
    // Añadir la worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Informe de Inversión');
    
    // Generar nombre de archivo con fecha actual
    const fechaActual = format(new Date(), 'dd-MM-yyyy');
    const nombreArchivo = `INFORME_INVERSION_DETALLE_ORDENES_${fechaActual}.xlsx`;
    
    // Escribir el archivo
    XLSX.writeFile(wb, nombreArchivo);
    
    console.log(`Excel generado exitosamente: ${nombreArchivo}`);
    
    return nombreArchivo;
  } catch (error) {
    console.error('Error al generar el Excel del informe de inversión:', error);
    throw error;
  }
};

// Función auxiliar para extraer IDs de alternativas_plan_orden
function extraerIdsAlternativas(alternativasPlanOrden) {
  let ids = [];
  
  if (!alternativasPlanOrden) {
    return ids;
  }
  
  try {
    // Si es un array, extraer directamente
    if (Array.isArray(alternativasPlanOrden)) {
      ids = alternativasPlanOrden.filter(id => 
        typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id)))
      ).map(id => typeof id === 'number' ? id : Number(id));
    } 
    // Si es string, intentar parsear como JSON
    else if (typeof alternativasPlanOrden === 'string') {
      try {
        const parsed = JSON.parse(alternativasPlanOrden);
        if (Array.isArray(parsed)) {
          ids = parsed.filter(id => 
            typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id)))
          ).map(id => typeof id === 'number' ? id : Number(id));
        } else if (parsed && typeof parsed === 'object') {
          // Si es un objeto, extraer valores
          const valores = Object.values(parsed);
          ids = valores.filter(val => 
            typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)))
          ).map(val => typeof val === 'number' ? val : Number(val));
        }
      } catch (e) {
        console.log('Error al parsear JSON de alternativas_plan_orden:', e);
      }
    } 
    // Si es objeto, extraer valores
    else if (typeof alternativasPlanOrden === 'object') {
      const valores = Object.values(alternativasPlanOrden);
      ids = valores.filter(val => 
        typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)))
      ).map(val => typeof val === 'number' ? val : Number(val));
    }
  } catch (e) {
    console.error('Error general al extraer IDs de alternativas:', e);
  }
  
  return ids;
}

// Función auxiliar para procesar calendario
function procesarCalendario(alternativa) {
  if (!alternativa.calendar) {
    return '';
  }
  
  try {
    let calendarData = alternativa.calendar;
    if (typeof calendarData === 'string') {
      try {
        calendarData = JSON.parse(calendarData);
      } catch (e) {
        console.log(`Error al parsear calendario de alternativa ${alternativa.id}:`, e);
        return '';
      }
    }
    
    // Si es formato con {dia, cantidad}
    if (Array.isArray(calendarData) && calendarData.length > 0 && calendarData[0].dia) {
      return calendarData.map(item => {
        // Intentar crear una fecha completa con año y mes
        if (alternativa.anio && alternativa.mes) {
          try {
            const fechaStr = `${alternativa.anio}-${alternativa.mes.toString().padStart(2, '0')}-${item.dia.toString().padStart(2, '0')}`;
            const fecha = parse(fechaStr, 'yyyy-MM-dd', new Date());
            const diaSemana = getDay(fecha);
            const nombreDia = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][diaSemana];
            return `${item.dia}(${nombreDia}):${item.cantidad || 1}`;
          } catch (e) {
            return `${item.dia}:${item.cantidad || 1}`;
          }
        } else {
          return `${item.dia}:${item.cantidad || 1}`;
        }
      }).join(', ');
    } 
    // Si es un array simple de días
    else if (Array.isArray(calendarData)) {
      return calendarData.map(dia => {
        // Intentar crear una fecha completa con año y mes
        if (alternativa.anio && alternativa.mes && (typeof dia === 'number' || !isNaN(parseInt(dia)))) {
          try {
            const diaNum = typeof dia === 'number' ? dia : parseInt(dia);
            const fechaStr = `${alternativa.anio}-${alternativa.mes.toString().padStart(2, '0')}-${diaNum.toString().padStart(2, '0')}`;
            const fecha = parse(fechaStr, 'yyyy-MM-dd', new Date());
            const diaSemana = getDay(fecha);
            const nombreDia = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][diaSemana];
            return `${diaNum}(${nombreDia})`;
          } catch (e) {
            return dia;
          }
        } else {
          return dia;
        }
      }).join(', ');
    } 
    // Si es formato con propiedad days
    else if (calendarData && calendarData.days && Array.isArray(calendarData.days)) {
      return calendarData.days.map(dia => {
        // Intentar crear una fecha completa con año y mes
        if (alternativa.anio && alternativa.mes && (typeof dia === 'number' || !isNaN(parseInt(dia)))) {
          try {
            const diaNum = typeof dia === 'number' ? dia : parseInt(dia);
            const fechaStr = `${alternativa.anio}-${alternativa.mes.toString().padStart(2, '0')}-${diaNum.toString().padStart(2, '0')}`;
            const fecha = parse(fechaStr, 'yyyy-MM-dd', new Date());
            const diaSemana = getDay(fecha);
            const nombreDia = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][diaSemana];
            return `${diaNum}(${nombreDia})`;
          } catch (e) {
            return dia;
          }
        } else {
          return dia;
        }
      }).join(', ');
    }
    
    return '';
  } catch (e) {
    console.log(`Error al procesar calendario para alternativa ${alternativa.id}:`, e);
    return '';
  }
}

// Función auxiliar para obtener información de usuario
function getUsuarioInfo(orden, tipo) {
  // Primero buscar en OrdenesUsuarios
  if (orden.OrdenesUsuarios && orden.OrdenesUsuarios.length > 0 && orden.OrdenesUsuarios[0].Usuarios) {
    const usuario = orden.OrdenesUsuarios[0].Usuarios;
    
    if (tipo === 'id') {
      return usuario.id_usuario || '';
    } else if (tipo === 'nombre') {
      return usuario.Nombre || '';
    } else if (tipo === 'grupo') {
      return usuario.Grupos?.nombre_grupo || '';
    }
  }
  
  // Si no hay en OrdenesUsuarios, buscar en usuario_registro
  if (orden.usuario_registro) {
    if (tipo === 'id') {
      return orden.usuario_registro.id || '';
    } else if (tipo === 'nombre') {
      return orden.usuario_registro.nombre || '';
    } else if (tipo === 'grupo') {
      return orden.usuario_registro.grupo || '';
    }
  }
  
  return '';
}

// Función para obtener el nombre del mes correctamente
function obtenerNombreMes(orden, alternativa) {
  // Primero intentar desde la orden y plan
  if (orden?.plan?.Meses?.Nombre) {
    return orden.plan.Meses.Nombre;
  } 
  
  // Luego desde la alternativa directamente
  if (alternativa?.Meses?.Nombre) {
    return alternativa.Meses.Nombre;
  }
  
  // Si solo tenemos el ID del mes, intentar obtener el nombre
  if (alternativa?.mes && typeof alternativa.mes === 'number') {
    // Mapeo de ID a nombre de mes
    const mesesMap = {
      1: 'Enero',
      2: 'Febrero',
      3: 'Marzo',
      4: 'Abril',
      5: 'Mayo',
      6: 'Junio',
      7: 'Julio',
      8: 'Agosto',
      9: 'Septiembre',
      10: 'Octubre',
      11: 'Noviembre',
      12: 'Diciembre'
    };
    
    return mesesMap[alternativa.mes] || `Mes ${alternativa.mes}`;
  }
  
  return '';
}

// Función para obtener el año correctamente como texto
function obtenerAnio(orden, alternativa) {
  // Primero intentar desde la alternativa con Anios
  if (alternativa?.Anios?.years) {
    return alternativa.Anios.years.toString();
  }
  
  // Luego desde la orden con plan
  if (orden?.plan?.Anios?.years) {
    return orden.plan.Anios.years.toString();
  }
  
  // Si solo tenemos el ID/número del año
  if (alternativa?.anio) {
    return alternativa.anio.toString();
  }
  
  return '';
}

// Función para obtener el nombre del soporte correctamente
function obtenerNombreSoporte(orden, alternativa) {
  // Primero intentar desde la alternativa
  if (alternativa?.Soportes?.nombreIdentficiador) {
    return alternativa.Soportes.nombreIdentficiador;
  }
  
  // Luego desde la orden
  if (orden?.Soportes?.nombreIdentficiador) {
    return orden.Soportes.nombreIdentficiador;
  }
  
  return '';
}

// Función para obtener el nombre de la campaña
function obtenerNombreCampania(orden, alternativa) {
  // Primero desde la alternativa si tiene relación con Campaña
  if (alternativa?.Campania?.NombreCampania) {
    return alternativa.Campania.NombreCampania;
  }
  
  // Luego desde la orden
  if (orden?.Campania?.NombreCampania) {
    return orden.Campania.NombreCampania;
  }
  
  return '';
}

// Función para obtener el nombre del medio correctamente
function obtenerNombreMedio(orden, alternativa) {
  // Primero intentar desde la alternativa
  if (alternativa?.Medios?.nombre) {
    return alternativa.Medios.nombre;
  }
  
  // Luego desde la orden
  if (orden?.Contratos?.Proveedores?.nombreProveedor) {
    return orden.Contratos.Proveedores.nombreProveedor;
  }
  
  // También puede estar en el campo medio de la alternativa
  if (alternativa?.medio) {
    // Si es un ID numérico, no lo mostramos directamente
    if (typeof alternativa.medio === 'number' || !isNaN(Number(alternativa.medio))) {
      return ''; // No mostramos IDs numéricos directamente
    }
    return alternativa.medio;
  }
  
  return '';
}

// Función auxiliar para crear una fila básica de orden
function crearFilaBasicaOrden(orden) {
  return {
    'CLIENTE': orden.Campania?.Clientes?.nombreCliente || '',
    'Mes': obtenerNombreMes(orden) || '',
    'Año': obtenerAnio(orden) || '',
    'N° de Ctto.': orden.Contratos?.num_contrato || '',
    'N° de Orden': orden.numero_correlativo || '',
    'Version': orden.copia || '',
    'Medio': obtenerNombreMedio(orden) || '',
    'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
    'Soporte': obtenerNombreSoporte(orden) || '',
    'Campaña': obtenerNombreCampania(orden) || '',
    'Plan de Medios': orden.plan?.nombre_plan || '',
    'Producto': orden.Campania?.Productos?.NombreDelProducto || '',
    'Tema': '',
    'Seg': '',
    'Prog./Elem./Formato': '',
    'Fecha Exhib./Pub.': '',
    'Inversion Neta': orden.Campania?.Presupuesto || 0,
    'Agen.Creativa': '',
    'Cod. Univ. Aviso': '',
    'Cod. Univ. Prog.': '',
    'Calidad': '',
    'Nombre Usuario': getUsuarioInfo(orden, 'nombre') || '',
    'Grupo Usuario': getUsuarioInfo(orden, 'grupo') || ''
  };
}

// Función para usar desde la consola del navegador
window.generarExcelInversion = () => generarExcelInformeInversion(); 