import React, { useState, useEffect } from 'react';
import EditarAlternativaReemplazo from '../../components/alternativas/EditarAlternativaReemplazo';
import { useNavigate } from 'react-router-dom';
import { generateOrderPDF } from '../../utils/pdfGenerator';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Button,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Box,
    CircularProgress,
    InputAdornment,
    DialogActions,
    ButtonGroup,
    Tooltip,
    IconButton,
    TableSortLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { 
    Search as SearchIcon,
    Print as PrintIcon,
    Cancel as CancelIcon,
    SwapHoriz as SwapHorizIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';

const RevisarOrden = () => {
    const navigate = useNavigate();
    const [openClienteModal, setOpenClienteModal] = useState(true);
    const [modifiedAlternatives, setModifiedAlternatives] = useState([]);
    const [isCreatingNewAlternative, setIsCreatingNewAlternative] = useState(false);
    const handleClose = () => {
    navigate('/');
    };
	const [openReplaceModal, setOpenReplaceModal] = useState(false);
    const [selectedAlternativeToReplace, setSelectedAlternativeToReplace] = useState(null);
    const [openCampanaModal, setOpenCampanaModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientes, setClientes] = useState([]);
    const [campanas, setCampanas] = useState([]);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('anio');
    const [campanaNameFilter, setCampanaNameFilter] = useState('');
    const [campanaYearFilter, setCampanaYearFilter] = useState('');
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [selectedCampana, setSelectedCampana] = useState(null);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [alternatives, setAlternatives] = useState([]);
    const [selectedAlternative, setSelectedAlternative] = useState(null);
    const [ordersOrder, setOrdersOrder] = useState('desc');
    const [ordersOrderBy, setOrdersOrderBy] = useState('numero_correlativo');
    const [orderNumberFilter, setOrderNumberFilter] = useState('');
    const [orderMonthFilter, setOrderMonthFilter] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('');
    const [meses, setMeses] = useState([]);

    const handleRequestSortOrders = (property) => {
        const isAsc = ordersOrderBy === property && ordersOrder === 'asc';
        setOrdersOrder(isAsc ? 'desc' : 'asc');
        setOrdersOrderBy(property);
    };

    const sortedOrders = [...orders]
        .filter(order => {
            // Filtro por número de orden - búsqueda parcial
            if (orderNumberFilter && !order.numero_correlativo?.toString().includes(orderNumberFilter)) {
                return false;
            }
            
            // Filtro por mes - filtrar por plan.mes
            if (orderMonthFilter && order.plan?.mes !== parseInt(orderMonthFilter)) {
                return false;
            }
            
            // Filtro por estado
            if (orderStatusFilter && order.estado !== orderStatusFilter) {
                return false;
            }
            
            return true;
        })
        .sort((a, b) => {
            if (ordersOrderBy === 'numero_correlativo') {
                const valA = Number(a.numero_correlativo) || 0;
                const valB = Number(b.numero_correlativo) || 0;
                return ordersOrder === 'asc' ? valA - valB : valB - valA;
            }
            return 0;
        });

	
    const handlePrint = async () => {
    if (!selectedOrder) {
    Swal.fire({
    icon: 'warning',
    title: 'Selección requerida',
    text: 'Por favor, seleccione una orden para imprimir'
    });
    return;
    }

    try {
    await generateOrderPDF(
      selectedOrder,
      alternatives,
      selectedCliente,
      selectedCampana,
      selectedOrder?.plan
    );
    } catch (error) {
    Swal.fire({
    icon: 'error',
    title: 'Error',
    text: 'No se pudo generar el PDF'
    });
    }
    };

 // Modificamos la función handleCancel
  const handleCancel = async () => {
    if (!selectedOrder) {
    Swal.fire({
    icon: 'warning',
    title: 'Selección requerida',
    text: 'Por favor, seleccione una orden para anular'
    });
    return;
    }
  
    const result = await Swal.fire({
    title: '¿Está seguro?',
    text: "Esta orden será anulada y no podrá revertir esta acción",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, anular',
    cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
    try {
    setLoading(true);
    // Obtener el usuario actual para registrar quién realiza la anulación
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const usuarioCancelador = currentUser ? {
      nombre: currentUser.user_metadata?.name || currentUser.email || 'Usuario',
      email: currentUser.email || '',
      id: currentUser.id
    } : selectedOrder?.usuario_registro;

    // 1) Actualizar la orden principal: estado anulada y usuario que anula
    const { error: ordenError } = await supabase
      .from('OrdenesDePublicidad')
      .update({ 
        estado: 'anulada',
        usuario_registro: usuarioCancelador,
        ...(selectedOrder?.created_at ? {} : { created_at: new Date().toISOString(), fechaCreacion: new Date().toISOString() })
      })
      .eq('id_ordenes_de_comprar', selectedOrder.id_ordenes_de_comprar);

    if (ordenError) throw ordenError;

    // 2) Marcar las alternativas asociadas como anuladas
    if (selectedOrder.alternativas_plan_orden && selectedOrder.alternativas_plan_orden.length > 0) {
        const { error: alternativesError } = await supabase
            .from('alternativa')
            .update({ anulada: true })
            .in('id', selectedOrder.alternativas_plan_orden);

        if (alternativesError) {
            // No interrumpimos el flujo si falla
        }
    }

    // 3) Ajustar el estado local para reflejar los cambios inmediatamente
    setSelectedOrder(prev => ({
      ...prev,
      estado: 'anulada',
      usuario_registro: usuarioCancelador
    }));

    Swal.fire(
      'Anulada',
      'La orden ha sido anulada correctamente. Totales y tarifas fueron puestos en 0.',
      'success'
    );

    // 3) Refrescar datos del servidor
    fetchOrders(selectedCampana.id_campania);
    if (selectedOrder) {
      fetchAlternatives(selectedOrder.alternativas_plan_orden);
    }
    
    } catch (error) {
    Swal.fire({
    icon: 'error',
    title: 'Error',
    text: 'No se pudo anular la orden'
    });
    } finally {
    setLoading(false);
    }
    }
  };
  const handleCancelAndReplace = () => {
    if (!selectedOrder) {
        Swal.fire({
            icon: 'warning',
            title: 'Selección requerida',
            text: 'Por favor, seleccione una orden para anular y reemplazar'
        });
        return;
    }
    if (selectedOrder.estado === 'anulada') {
        Swal.fire({
            icon: 'info',
            title: 'Orden anulada',
            text: 'No se puede anular y reemplazar una orden que ya está anulada'
        });
        return;
    }

    // Inicializar las alternativas modificadas con las alternativas actuales si no existen
    if (modifiedAlternatives.length === 0) {
        setModifiedAlternatives([...alternatives]);
    }
    setOpenReplaceModal(true);
};

// Reset modifiedAlternatives when selectedOrder changes
useEffect(() => {
    setModifiedAlternatives([]);
}, [selectedOrder]);
   // Agregar función para manejar la creación de una nueva alternativa
   const handleCreateNewAlternative = async () => {
    try {
        setLoading(true);
        
        // Obtener información del contrato y soporte directamente de la orden
        const { data: ordenData, error: ordenError } = await supabase
            .from('OrdenesDePublicidad')
            .select(`
                id_ordenes_de_comprar,
                id_contrato,
                id_soporte,
                Contratos (
                    id,
                    NombreContrato
                ),
                Soportes (
                    id_soporte,
                    nombreIdentficiador
                )
            `)
            .eq('id_ordenes_de_comprar', selectedOrder.id_ordenes_de_comprar)
            .single();
        
        if (ordenError) {
            throw ordenError;
        }
        
        // Obtener el contrato y soporte de la primera alternativa existente (si hay alguna)
        // o directamente de la orden
        const baseAlternative = modifiedAlternatives.length > 0 ? modifiedAlternatives[0] : null;
        
        // Obtener información del plan para extraer año y mes
        const { data: planData, error: planError } = await supabase
            .from('plan')
            .select('anio, mes')
            .eq('id', selectedOrder.id_plan)
            .single();
            
        if (planError) {
            throw planError;
        }
        
        setIsCreatingNewAlternative(true);
        setSelectedAlternativeToReplace({
            numerorden: selectedOrder?.id_ordenes_de_comprar, // Usar numerorden en lugar de id_orden
            // Usar datos de alternativa existente o de la orden
            num_contrato: baseAlternative?.num_contrato || ordenData?.id_contrato, // Usar num_contrato en lugar de id_contrato
            id_soporte: baseAlternative?.id_soporte || ordenData?.id_soporte,
            // También incluimos los objetos relacionados para mostrarlos en los campos de solo lectura
            Contratos: baseAlternative?.Contratos || ordenData?.Contratos,
            Soportes: baseAlternative?.Soportes || ordenData?.Soportes,
            // Usar los valores de año y mes del plan
            anio: planData?.anio || null,
            mes: planData?.mes || null,
            // Incluir id_campania de la orden
            id_campania: selectedOrder.id_campania,
            // Inicializar el calendario como un array vacío
            calendar: '[]',
            cantidades: [] // Inicializar cantidades para la UI
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear la nueva alternativa: ' + error.message
        });
    } finally {
        setLoading(false);
    }
};
// Modifica la función handleSaveModifiedAlternative para asignar correctamente el número de orden
const handleSaveModifiedAlternative = (modifiedAlternative) => {
    
    // Crear una copia para no modificar el original
    const alternativaCopy = { ...modifiedAlternative };
    
    // Asegurarse de que calendar sea un string JSON si cantidades existe
    if (alternativaCopy.cantidades && Array.isArray(alternativaCopy.cantidades)) {
        alternativaCopy.calendar = alternativaCopy.cantidades;
        delete alternativaCopy.cantidades;
    } else if (alternativaCopy.calendar && typeof alternativaCopy.calendar === 'string') {
        try {
            alternativaCopy.calendar = JSON.parse(alternativaCopy.calendar);
        } catch (e) {
            alternativaCopy.calendar = [];
        }
    }
    
    // Cambiar id_orden a numerorden si existe
    if (alternativaCopy.id_orden !== undefined) {
        alternativaCopy.numerorden = alternativaCopy.id_orden;
        delete alternativaCopy.id_orden;
    }
    
    // Cambiar id_contrato a num_contrato si existe
    if (alternativaCopy.id_contrato !== undefined) {
        alternativaCopy.num_contrato = alternativaCopy.id_contrato;
        delete alternativaCopy.id_contrato;
    }
    
    // Cambiar id_medio a medio si existe
    if (alternativaCopy.id_medio !== undefined) {
        alternativaCopy.medio = alternativaCopy.id_medio;
        delete alternativaCopy.id_medio;
    }
    
    setModifiedAlternatives(prevAlternatives => {
        // Verificar si esta alternativa ya existe en nuestra lista modificada
        const existingIndex = prevAlternatives.findIndex(alt => String(alt.id) === String(alternativaCopy.id));
        
        // Si la alternativa tiene un ID que no es temporal (es una pre-cargada)
        // y no es una alternativa que ya hayamos reemplazado antes
        if (existingIndex >= 0 && 
            !String(alternativaCopy.id).startsWith('temp_') && 
            !alternativaCopy._isReplacement) {
            
            // Crear una nueva alternativa con ID temporal que reemplaza a la original
            const newTempId = `temp_${Date.now()}`;
            
            // Guardar una copia completa de la alternativa original para referencia
            const originalData = prevAlternatives[existingIndex];
            
            const replacementAlternative = {
                ...alternativaCopy,
                id: newTempId,
                original_id: alternativaCopy.id, // Guardar referencia al ID original
                _isReplacement: true, // Marcar como reemplazo
                _lastUpdated: new Date().getTime(),
                // Mantener el mismo número de orden
                numerorden: alternativaCopy.numerorden || selectedOrder.numero_correlativo
                // No guardar _originalData ya que no existe en la tabla
            };
            
            // Filtrar la alternativa original y agregar la nueva versión
            return [
                ...prevAlternatives.filter(alt => String(alt.id) !== String(alternativaCopy.id)),
                replacementAlternative
            ];
        } 
        // Si es una alternativa temporal o ya es un reemplazo, solo actualizamos sus datos
        else if (existingIndex >= 0) {
            const updatedAlternatives = [...prevAlternatives];
            updatedAlternatives[existingIndex] = {
                ...alternativaCopy,
                _lastUpdated: new Date().getTime(),
                // Asegurarse de mantener el mismo número de orden
                numerorden: prevAlternatives[existingIndex].numerorden || selectedOrder.numero_correlativo
            };
            
            return updatedAlternatives;
        } 
        // Si es una alternativa completamente nueva
        else {
            const newTempId = `temp_${Date.now()}`;
            const newAlternative = {
                ...alternativaCopy,
                id: String(alternativaCopy.id).startsWith('temp_') ? alternativaCopy.id : newTempId,
                numerorden: selectedOrder.numero_correlativo,
                _lastUpdated: new Date().getTime()
            };
            return [...prevAlternatives, newAlternative];
        }
    });
    
    // Mostrar mensaje de confirmación
    Swal.fire({
        icon: 'success',
        title: 'Guardado',
        text: 'La alternativa ha sido guardada correctamente',
        timer: 1500,
        showConfirmButton: false
    });
    
    // Limpiar la selección para volver a la lista
    setSelectedAlternativeToReplace(null);
    setIsCreatingNewAlternative(false);
};
    
    // Agregar función para eliminar una alternativa (solo de la lista temporal)
    const handleDeleteAlternative = (alternativeId) => {
        setModifiedAlternatives(prevAlternatives => 
            prevAlternatives.filter(alt => alt.id !== alternativeId)
        );
    };

   // Agregar función para guardar y reemplazar la orden
// Modifica la función handleSaveAndReplaceOrder para corregir el tipo de dato
  const handleSaveAndReplaceOrder = async () => {
    try {
        setLoading(true);
        
        // 1. Marcar la orden original como anulada y remplazada
        const { error: cancelError } = await supabase
            .from('OrdenesDePublicidad')
            .update({ 
                estado: 'anulada y remplazada'
            })
            .eq('id_ordenes_de_comprar', selectedOrder.id_ordenes_de_comprar);
        
        if (cancelError) throw cancelError;

        // 1.1 Marcar TODAS las alternativas de la orden original como anuladas
        // Usamos selectedOrder.alternativas_plan_orden que contiene los IDs de las alternativas asociadas a la orden
        const alternativesToAnnul = selectedOrder.alternativas_plan_orden || [];

        if (alternativesToAnnul.length > 0) {
            const { error: annulError } = await supabase
                .from('alternativa')
                .update({ anulada: true })
                .in('id', alternativesToAnnul);
            
            if (annulError) {
                console.error('Error al anular alternativas antiguas:', annulError);
                // No lanzamos error para no interrumpir el flujo principal
            }
        }
        
        // 2. Crear una nueva orden con los datos base de la orden original
        const { data: newOrder, error: newOrderError } = await supabase
            .from('OrdenesDePublicidad')
            .insert({
              numero_correlativo: selectedOrder.numero_correlativo,
              id_plan: selectedOrder.id_plan,
              id_campania: selectedOrder.id_campania,
              id_contrato: selectedOrder.id_contrato,
              id_soporte: selectedOrder.id_soporte,
              usuario_registro: selectedOrder.usuario_registro,
              estado: 'activa',
              // Corregir la lógica para el campo copia
              copia: selectedOrder.copia === null || selectedOrder.copia === undefined ? 2 : (selectedOrder.copia + 1),
              orden_remplaza: selectedOrder.id_ordenes_de_comprar,
              created_at: new Date().toISOString(),
              fechaCreacion: new Date().toISOString(),
              fecha_creacion2: new Date().toISOString()
            })
            .select();
        
        if (newOrderError) throw newOrderError;
        
        // 3. Crear nuevas alternativas basadas en las modificadas
        const newAlternativesPromises = modifiedAlternatives.map(async (alt) => {
            // Crear una copia para no modificar el original
            const alternativaData = { ...alt };
            
            // Eliminar el id si es temporal o si es una alternativa reemplazada
            if (alternativaData.id && (
                String(alternativaData.id).startsWith('temp_') || 
                alternativaData._isReplacement
            )) {
                delete alternativaData.id;
            }
            
            // IMPORTANTE: Siempre eliminar el ID para permitir que la base de datos genere uno nuevo
            delete alternativaData.id;
            
            // Eliminar campos internos de control que no existen en la tabla
            delete alternativaData._lastUpdated;
            delete alternativaData._isReplacement;
            delete alternativaData.original_id;
            delete alternativaData._originalData;
              // Cambiar id_anio a anio si existe
            if (alternativaData.id_anio !== undefined) {
                alternativaData.anio = alternativaData.id_anio;
                delete alternativaData.id_anio;
            }
            
            // Cambiar id_mes a mes si existe
            if (alternativaData.id_mes !== undefined) {
                alternativaData.mes = alternativaData.id_mes;
                delete alternativaData.id_mes;
            }
            
            // Cambiar id_orden a numerorden si existe
            if (alternativaData.id_orden !== undefined) {
                alternativaData.numerorden = alternativaData.id_orden;
                delete alternativaData.id_orden;
            }
            
            // Cambiar id_contrato a num_contrato si existe
            if (alternativaData.id_contrato !== undefined) {
                alternativaData.num_contrato = alternativaData.id_contrato;
                delete alternativaData.id_contrato;
            }
            
            // Cambiar id_medio a medio si existe
            if (alternativaData.id_medio !== undefined) {
                alternativaData.medio = alternativaData.id_medio;
                delete alternativaData.id_medio;
            } else if (alternativaData.medio && typeof alternativaData.medio === 'object') {
                // Si medio es un objeto (por el fetch), extraer el ID
                alternativaData.medio = alternativaData.medio.id;
            }
            
            // Asegurarse de que calendar sea un string JSON para la base de datos
            if (alternativaData.cantidades && Array.isArray(alternativaData.cantidades)) {
                alternativaData.calendar = JSON.stringify(alternativaData.cantidades);
                delete alternativaData.cantidades;
            } else if (alternativaData.calendar) {
                if (typeof alternativaData.calendar !== 'string') {
                    alternativaData.calendar = JSON.stringify(alternativaData.calendar);
                }
                // Si ya es string, lo dejamos así
            } else {
                alternativaData.calendar = '[]';
            }
            
            // Eliminar objetos relacionados que no deben insertarse
            delete alternativaData.Anios;
            delete alternativaData.Meses;
            delete alternativaData.Contratos;
            delete alternativaData.Soportes;
            delete alternativaData.Clasificacion; // Relación objeto
            delete alternativaData.clasificacion; // Campo string temporal
            delete alternativaData['clasificacion']; // Asegurar eliminación por string key
            delete alternativaData.Temas;
            delete alternativaData.Programas;
            delete alternativaData.Medios;

            // Eliminar campos calculados que no existen en la base de datos
            delete alternativaData.iva;
            delete alternativaData.total_orden;
            delete alternativaData.total_general;
            
            // Map multiplicar_valor_unitario to multiplicar_valor before saving
            if (alternativaData.multiplicar_valor_unitario !== undefined) {
                alternativaData.multiplicar_valor = alternativaData.multiplicar_valor_unitario;
                delete alternativaData.multiplicar_valor_unitario;
            }
            
            // Eliminar cualquier otro campo que pueda causar conflicto
            if ('clasificacion' in alternativaData) delete alternativaData.clasificacion;
            
            // Asegurarse de que los campos booleanos sean números
            Object.keys(alternativaData).forEach(key => {
                if (typeof alternativaData[key] === 'boolean') {
                    alternativaData[key] = alternativaData[key] ? 1 : 0;
                }
            });
            
            // Asegurarse de que id_campania esté incluido
            alternativaData.id_campania = selectedOrder.id_campania;
            
            // Crear nueva alternativa
            const { data: newAlternative, error: altError } = await supabase
                .from('alternativa')
                .insert({
                    ...alternativaData,
                    // Usar numero_correlativo en lugar de id_ordenes_de_comprar para numerorden
                    numerorden: newOrder[0].numero_correlativo,
                    // Establecer copia igual que en la orden
                    copia: newOrder[0].copia
                })
                .select();
            
            if (altError) {
                throw altError;
            }
            
            return newAlternative[0];
        });
        
        // Esperar a que todas las alternativas se creen y obtener los resultados
        const createdAlternatives = await Promise.all(newAlternativesPromises);
        
        // 4. Actualizar la nueva orden con la lista de IDs de alternativas
        const alternativeIds = createdAlternatives.map(alt => alt.id);
        
        const { error: updateOrderError } = await supabase
            .from('OrdenesDePublicidad')
            .update({
                alternativas_plan_orden: alternativeIds
            })
            .eq('id_ordenes_de_comprar', newOrder[0].id_ordenes_de_comprar);
        
        if (updateOrderError) throw updateOrderError;
        
        // 5. Registrar en la tabla plan_alternativas
        const planAlternativasData = alternativeIds.map(altId => ({
            id_plan: selectedOrder.id_plan,
            id_alternativa: altId
        }));
        
        const { error: planAltError } = await supabase
            .from('plan_alternativas')
            .insert(planAlternativasData);
        
        if (planAltError) {
            throw planAltError;
        }
        
        // 6. Limpiar las alternativas temporales del sessionStorage
        sessionStorage.removeItem('tempAlternativas');
        
        // 7. Generar e imprimir el PDF de la nueva orden automáticamente
        try {
            const { data: fullAlternatives, error: fetchError } = await supabase
                .from('alternativa')
                .select(`
                    *,
                    Anios (id, years),
                    Meses (Id, Nombre),
                    Contratos!inner (
                        id, NombreContrato, num_contrato, id_FormadePago, IdProveedor,
                        FormaDePago (id, NombreFormadePago),
                        Proveedores (
                            id_proveedor, nombreProveedor, rutProveedor, direccionFacturacion, id_comuna,
                            Comunas (id_comuna, nombreComuna)
                        ),
                        medio:IdMedios (id, NombredelMedio),
                        Medios:IdMedios (id, NombredelMedio)
                    ),
                    tipo_item,
                    Soportes (id_soporte, nombreIdentficiador),
                    Clasificacion (id, NombreClasificacion),
                    Temas (id_tema, NombreTema, Duracion, CodigoMegatime),
                    Programas (id, codigo_programa, hora_inicio, hora_fin, descripcion),
                    Medios:medio (id, NombredelMedio)
                `)
                .in('id', alternativeIds);
            
            if (fetchError) throw fetchError;
            
            // Procesar calendar para el PDF
            const alternativesForPdf = fullAlternatives.map(alt => {
                const altCopy = { ...alt };
                let parsedCalendar = [];
                
                if (altCopy.calendar) {
                    if (Array.isArray(altCopy.calendar)) {
                        parsedCalendar = altCopy.calendar;
                    } else if (typeof altCopy.calendar === 'string') {
                        try {
                            parsedCalendar = JSON.parse(altCopy.calendar);
                        } catch (e) {
                            parsedCalendar = [];
                        }
                    }
                }
                
                altCopy.calendar = parsedCalendar;
                altCopy.cantidades = parsedCalendar;
                return altCopy;
            });
            
            // Preparar objeto de orden completo
            const orderForPdf = {
                ...newOrder[0],
                plan: selectedOrder.plan,
                usuario_registro: selectedOrder.usuario_registro
            };
            
            await generateOrderPDF(
                orderForPdf,
                alternativesForPdf,
                selectedCliente,
                selectedCampana,
                selectedOrder.plan
            );
            
        } catch (pdfError) {
            // No detenemos el flujo de éxito si falla el PDF, solo avisamos
            Swal.fire({
                icon: 'warning',
                title: 'Orden creada',
                text: 'La orden se creó correctamente pero hubo un error al generar el PDF automático.'
            });
            fetchOrders(selectedCampana.id_campania);
            setOpenReplaceModal(false);
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'La orden ha sido anulada y reemplazada correctamente. Se ha generado el PDF de la nueva orden.'
        });
        
        // Cerrar el modal de reemplazo
        setOpenReplaceModal(false);
        
        // Refrescar el listado de órdenes para mostrar la nueva orden
        await fetchOrders(selectedCampana.id_campania);
        
        // Limpiar la selección de orden actual
        setSelectedOrder(null);
        setAlternatives([]);
        setModifiedAlternatives([]);
        
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo anular y reemplazar la orden: ' + error.message
        });
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                setLoading(true);
                const user = JSON.parse(localStorage.getItem('user'));
                let query = supabase
                    .from('Clientes')
                    .select(`
                        id_cliente,
                        nombreCliente,
                        direccionEmpresa,
                        RUT,
                        razonSocial,
                        id_comuna,
                        Comunas (
                            id_comuna,
                            nombreComuna
                        )
                    `)
                    .order('nombreCliente');

                if (user?.Perfiles?.NombrePerfil === 'Área Planificación' && user?.Grupos?.id_grupo) {
                    query = query.eq('id_grupo', user.Grupos.id_grupo);
                }
                
                const { data, error } = await query;

                if (error) throw error;
                setClientes(data || []);
            } catch (error) {
                // Silent error or show Swal if critical
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
        fetchMeses();
    }, []);

    const fetchMeses = async () => {
        try {
            const { data, error } = await supabase
                .from('Meses')
                .select('Id, Nombre')
                .order('Id');

            if (error) throw error;
            setMeses(data || []);
        } catch (error) {
            // Silent error
        }
    };

    const fetchCampanas = async (clienteId) => {
    try {
    setLoading(true);
    const { data, error } = await supabase
    .from('Campania')
    .select(`
    *,
    Clientes!inner (
    id_cliente,
    nombreCliente,
    id_comuna,
    comuna:Comunas (
    id_comuna,
    nombreComuna
    )
    ),
    Anios:Anio (
    id,
    years
    ),
    Productos (
    id,
    NombreDelProducto
    ),
    Agencias (
    id,
    NombreIdentificador
    )
    `)
    .eq('id_Cliente', clienteId);

    if (error) throw error;

    const sortedData = (data || []).sort((a, b) => {
        const yearA = Number(a.Anios?.years) || 0;
        const yearB = Number(b.Anios?.years) || 0;
        const nameA = a.NombreCampania || '';
        const nameB = b.NombreCampania || '';

        if (yearA !== yearB) {
            return yearA - yearB;
        }
        return nameA.localeCompare(nameB);
    });

    setCampanas(sortedData);
    setOrder('asc');
    setOrderBy('anio');
    } catch (error) {
        // Silent error
    } finally {
    setLoading(false);
    }
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        const newOrder = isAsc ? 'desc' : 'asc';
        setOrder(newOrder);
        setOrderBy(property);

        const sortedCampanas = [...campanas].sort((a, b) => {
            const yearA = Number(a.Anios?.years) || 0;
            const yearB = Number(b.Anios?.years) || 0;
            const nameA = a.NombreCampania || '';
            const nameB = b.NombreCampania || '';

            if (property === 'anio') {
                if (yearA !== yearB) {
                    return newOrder === 'asc' ? yearA - yearB : yearB - yearA;
                }
                return nameA.localeCompare(nameB);
            }
            return 0;
        });

        setCampanas(sortedCampanas);
    };

    const handleClienteSelect = async (cliente) => {
    try {
    setSelectedCliente(cliente);
    setCampanaNameFilter('');
    setCampanaYearFilter('');
    await fetchCampanas(cliente.id_cliente);
    setOpenClienteModal(false);
    setOpenCampanaModal(true);
    } catch (error) {
        // Silent error
    }
    };

    const handleCampanaSelect = (campana) => {
    setSelectedCampana(campana);
    setOpenCampanaModal(false);
    fetchOrders(campana.id_campania);
    };

    const handleResetSelection = () => {
    setSelectedCliente(null);
    setSelectedCampana(null);
    setCampanaNameFilter('');
    setCampanaYearFilter('');
    setOpenCampanaModal(false);
    setOpenClienteModal(true);
    };

    const handleChangeCampana = () => {
    setSelectedCampana(null);
    setSelectedOrder(null);
    setAlternatives([]);
    setOrders([]);
    setCampanaNameFilter('');
    setCampanaYearFilter('');
    setOpenCampanaModal(true);
    };

    const fetchOrders = async (campaignId) => {
    try {
    setLoading(true);
    const { data, error } = await supabase
    .from('OrdenesDePublicidad')
    .select(`
    *,
    plan:plan (
    id,
    nombre_plan,
    mes,
    Meses (
        Id,
        Nombre
    )
    ),
    usuario_registro,
	copia,
	orden_remplaza
    `)
    .eq('id_campania', campaignId);
    
    if (error) throw error;
    setOrders(data || []);
    } catch (error) {
        // Silent error
    } finally {
    setLoading(false);
    }
    };

    const fetchAlternatives = async (alternativeIds) => {
        if (!alternativeIds || alternativeIds.length === 0) return;
        
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('alternativa')
                .select(`
                    *,
                    Anios (
                        id,
                        years
                    ),
                    Meses (
                        Id,
                        Nombre
                    ),
                    Contratos!inner (
                        id,
                        NombreContrato,
                        num_contrato,
                        id_FormadePago,
                        IdProveedor,
                        id_GeneraracionOrdenTipo,
                        TipoGeneracionDeOrden (
                            id,
                            NombreTipoOrden
                        ),
                        FormaDePago (
                            id,
                            NombreFormadePago
                        ),
                        Proveedores (
                            id_proveedor,
                            nombreProveedor,
                            rutProveedor,
                            direccionFacturacion,
                            id_comuna,
                            Comunas (
                                id_comuna,
                                nombreComuna
                            )
                        ),
                        medio:IdMedios (id, NombredelMedio),
                        Medios:IdMedios (id, NombredelMedio)
                    ),
                    tipo_item,
                    Soportes (
                        id_soporte,
                        nombreIdentficiador
                    ),
                    Clasificacion (
                        id,
                        NombreClasificacion
                    ),
                    Temas (
                        id_tema,
                        NombreTema,
                        Duracion,
                        CodigoMegatime
                    ),
                    Programas (
                        id,
                        codigo_programa,
                        hora_inicio,
                        hora_fin,
                        descripcion
                    ),
                    Medios:medio (id, NombredelMedio)
                `)
                .in('id', alternativeIds);
            
            if (error) throw error;
            
            // Procesar los datos para asegurarse de que cantidades esté disponible para la UI
            const processedData = (data || []).map(alt => {
                // Manejar calendar y cantidades
                if (alt.calendar) {
                    if (typeof alt.calendar === 'string') {
                        try {
                            const parsed = JSON.parse(alt.calendar);
                            alt.cantidades = parsed;
                            alt.calendar = parsed;
                        } catch (e) {
                            alt.cantidades = [];
                            alt.calendar = [];
                        }
                    } else if (Array.isArray(alt.calendar)) {
                        // Si ya es un array (por ejemplo, tipo JSONB en Supabase), usarlo directamente
                        alt.cantidades = alt.calendar;
                    } else {
                        alt.cantidades = [];
                        if (!Array.isArray(alt.calendar)) alt.calendar = [];
                    }
                } else {
                    alt.cantidades = [];
                    alt.calendar = [];
                }

                // Calcular total_general si no existe (Total Neto + IVA 19%)
                // Asumimos IVA 19% como en el generador de PDF
                if (!alt.total_general) {
                    alt.total_general = Math.round((alt.total_neto || 0) * 1.19);
                }

                // Map multiplicar_valor to multiplicar_valor_unitario for UI
                if (alt.multiplicar_valor !== undefined) {
                    alt.multiplicar_valor_unitario = alt.multiplicar_valor;
                }

                return alt;
            });
            
            setAlternatives(processedData);
        } catch (error) {
            // Silent error
        } finally {
            setLoading(false);
        }
    };


    const filteredClientes = clientes.filter(cliente =>
    cliente.nombreCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCampanas = campanas.filter(campana => {
        const matchesName = !campanaNameFilter || 
            campana.NombreCampania?.toLowerCase().includes(campanaNameFilter.toLowerCase());
        const matchesYear = !campanaYearFilter || 
            campana.Anios?.years?.toString().includes(campanaYearFilter);
        return matchesName && matchesYear;
    });

    return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    {/* Modal de Selección de Cliente */}
    <Dialog 
    open={openClienteModal} 
    maxWidth="md" 
    fullWidth
    onClose={handleClose}
    >
    <DialogTitle sx={{ m: 0, p: 2 }}>
    <Box display="flex" alignItems="center" justifyContent="space-between">
    <Typography variant="h6">Seleccionar Cliente</Typography>
    <IconButton
    aria-label="close"
    onClick={handleClose}
    sx={{
    color: (theme) => theme.palette.grey[500],
    }}
    >
    <CloseIcon />
    </IconButton>
    </Box>
    <TextField
    fullWidth
    variant="outlined"
    placeholder="Buscar cliente..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    sx={{ mt: 2 }}
    InputProps={{
    startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
    }}
    />
    </DialogTitle>
    <DialogContent>
    {loading ? (
    <Box display="flex" justifyContent="center" m={3}>
    <CircularProgress />
    </Box>
    ) : (
    <TableContainer component={Paper}>
    <Table>
    <TableHead>
    <TableRow>
    <TableCell>Nombre del Cliente</TableCell>
    <TableCell>Razón Social</TableCell>
    <TableCell>RUT</TableCell>
    <TableCell>Acción</TableCell>
    </TableRow>
    </TableHead>
    <TableBody>
    {filteredClientes.map((cliente) => (
    <TableRow key={cliente.id_cliente}>
    <TableCell>{cliente.nombreCliente}</TableCell>
    <TableCell>{cliente.razonSocial}</TableCell>
    <TableCell>{cliente.RUT}</TableCell>
    <TableCell>
    <Button
    variant="contained"
    color="primary"
    onClick={() => handleClienteSelect(cliente)}
    >
    Seleccionar
    </Button>
    </TableCell>
    </TableRow>
    ))}
    </TableBody>
    </Table>
    </TableContainer>
    )}
    </DialogContent>
    </Dialog>

    {/* Modal de Selección de Campaña */}
    <Dialog 
    open={openCampanaModal} 
    maxWidth="md" 
    fullWidth
    onClose={handleClose}
    >
    <DialogTitle sx={{ m: 0, p: 2 }}>
    <Box>
    <Typography variant="h6" sx={{ textAlign: 'left' }}>
    Seleccionar Campaña
    </Typography>
    <Typography variant="subtitle1" sx={{ textAlign: 'left' }}color="textSecondary">
    Cliente: {selectedCliente?.nombreCliente}
    </Typography>
    <Box display="flex" gap={2} mt={2}>
    <TextField
    size="small"
    variant="outlined"
    placeholder="Filtrar por nombre de campaña..."
    value={campanaNameFilter}
    onChange={(e) => setCampanaNameFilter(e.target.value)}
    sx={{ flex: 1 }}
    InputProps={{
    startAdornment: (
    <InputAdornment position="start">
    <SearchIcon />
    </InputAdornment>
    )
    }}
    />
    <TextField
    size="small"
    variant="outlined"
    placeholder="Filtrar por año..."
    value={campanaYearFilter}
    onChange={(e) => setCampanaYearFilter(e.target.value)}
    sx={{ width: 250 }}
    InputProps={{
    startAdornment: (
    <InputAdornment position="start">
    <SearchIcon />
    </InputAdornment>
    )
    }}
    />
    </Box>
    </Box>
    <IconButton
    aria-label="close"
    onClick={handleClose}
    sx={{
    position: 'absolute',
    right: 8,
    top: 8,
    color: (theme) => theme.palette.grey[500],
    }}
    >
    <CloseIcon />
    </IconButton>
    </DialogTitle>
    <DialogContent>
    {loading ? (
    <Box display="flex" justifyContent="center" m={3}>
    <CircularProgress />
    </Box>
    ) : filteredCampanas.length === 0 ? (
    <Box display="flex" justifyContent="center" m={3}>
    <Typography>No hay campañas que coincidan con los filtros</Typography>
    </Box>
    ) : (
    <TableContainer component={Paper}>
    <Table>
    <TableHead>
    <TableRow>
    <TableCell>Nombre de Campaña</TableCell>
    <TableCell>
    <TableSortLabel
        active={orderBy === 'anio'}
        direction={orderBy === 'anio' ? order : 'asc'}
        onClick={() => handleRequestSort('anio')}
    >
        Año
    </TableSortLabel>
    </TableCell>
    <TableCell>Producto</TableCell>
    <TableCell>Agencia</TableCell>
    <TableCell>Acción</TableCell>
    </TableRow>
    </TableHead>
    <TableBody>
    {filteredCampanas.map((campana) => (
    <TableRow key={campana.id_campania}>
    <TableCell>{campana.NombreCampania}</TableCell>
    <TableCell>{campana.Anios?.years || 'No especificado'}</TableCell>
    <TableCell>{campana.Productos?.NombreDelProducto || 'No especificado'}</TableCell>
    <TableCell>{campana.Agencias?.NombreIdentificador || 'No especificada'}</TableCell>
    <TableCell>
    <Button
    variant="contained"
    color="primary"
    onClick={() => handleCampanaSelect(campana)}
    >
    Seleccionar
    </Button>
    </TableCell>
    </TableRow>
    ))}
    </TableBody>
    </Table>
    </TableContainer>
    )}
    </DialogContent>
    <DialogActions>
    <Button onClick={handleResetSelection} color="primary">
    Cambiar Cliente
    </Button>
    </DialogActions>
    </Dialog>

    {/* Contenido principal - Se mostrará después de seleccionar cliente y campaña */}
    {selectedCliente && selectedCampana && (
    <Grid container spacing={3}>
    {/* Información de la Campaña */}
    <Grid item xs={12}>
    <Paper sx={{ p: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
    <Typography variant="h6">Información de la Campaña</Typography>
    <Button variant="outlined" onClick={handleChangeCampana}>
    Cambiar Selección
    </Button>
    </Box>
    <Typography>Cliente: {selectedCliente.nombreCliente}</Typography>
    <Typography>Campaña: {selectedCampana.NombreCampania}</Typography>
    <Typography>Año: {selectedCampana.Anios?.years || 'No especificado'}</Typography>
    <Typography>Producto: {selectedCampana.Productos?.NombreDelProducto || 'No especificado'}</Typography>
    <Typography>Agencia: {selectedCampana.Agencias?.NombreIdentificador || 'No especificada'}</Typography>
<div className='espaciadorx'></div>

					{/* Órdenes */}
					<Grid item xs={12}>
						<Paper sx={{ p: 2 }}>
							<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
								<Box display="flex" alignItems="center" gap={1.5}>
									<Typography variant="h6" sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}>
										Órdenes Asociadas
									</Typography>
									<TextField
										size="small"
										label="N° de Orden"
										placeholder="Buscar..."
										value={orderNumberFilter}
										onChange={(e) => setOrderNumberFilter(e.target.value)}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<SearchIcon />
												</InputAdornment>
											),
										}}
										sx={{ minWidth: 120 }}
									/>
									<FormControl size="small" sx={{ minWidth: 120 }}>
										<InputLabel shrink>Mes</InputLabel>
										<Select
											value={orderMonthFilter}
											label="Mes"
											onChange={(e) => setOrderMonthFilter(e.target.value)}
											displayEmpty
											notched
										>
											<MenuItem value="">Todos</MenuItem>
											{meses.map((mes) => (
												<MenuItem key={mes.Id} value={mes.Id}>
													{mes.Nombre}
												</MenuItem>
											))}
										</Select>
									</FormControl>
									<FormControl size="small" sx={{ minWidth: 150 }}>
										<InputLabel shrink>Estado</InputLabel>
										<Select
											value={orderStatusFilter}
											label="Estado"
											onChange={(e) => setOrderStatusFilter(e.target.value)}
											displayEmpty
											notched
										>
											<MenuItem value="">Todos</MenuItem>
											<MenuItem value="activa">Activa</MenuItem>
											<MenuItem value="anulada">Anulada</MenuItem>
											<MenuItem value="anulada y remplazada">Anulada y Remplazada</MenuItem>
										</Select>
									</FormControl>
								</Box>
								<ButtonGroup variant="contained">
									<Tooltip title="Imprimir orden">
										<Button
											onClick={handlePrint}
											startIcon={<PrintIcon />}
											disabled={!selectedOrder}
										>
											Imprimir
										</Button>
									</Tooltip>
                                    <Tooltip title="Anular y reemplazar orden">
                                        <Button
                                            onClick={handleCancelAndReplace}
                                            startIcon={<SwapHorizIcon />}
                                            disabled={!selectedOrder || selectedOrder?.estado === 'anulada' || selectedOrder?.estado === 'anulada y remplazada'}
                                        >
                                            Anular y reemplazar
                                        </Button>
                                    </Tooltip>
									<Tooltip title="Anular orden">
										<Button
											onClick={handleCancel}
											startIcon={<CancelIcon />}
											color="error"
											disabled={!selectedOrder || selectedOrder?.estado === 'anulada' || selectedOrder?.estado === 'anulada y remplazada'}
										>
											Anular
										</Button>
									</Tooltip>
								</ButtonGroup>
							</Box>
							<TableContainer>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell>
                                                <TableSortLabel
                                                    active={ordersOrderBy === 'numero_correlativo'}
                                                    direction={ordersOrderBy === 'numero_correlativo' ? ordersOrder : 'asc'}
                                                    onClick={() => handleRequestSortOrders('numero_correlativo')}
                                                >
                                                    N° de Orden
                                                </TableSortLabel>
                                            </TableCell>
											<TableCell>N° de copias</TableCell>
											<TableCell>Mes Plan</TableCell>
											<TableCell>Plan</TableCell>
											<TableCell>Fecha</TableCell>
											<TableCell>Estado</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{sortedOrders.map((order) => (
											<TableRow 
												key={order.id_ordenes_de_comprar}
												onClick={() => {
													setSelectedOrder(order);
													fetchAlternatives(order.alternativas_plan_orden);
												}}
												sx={{ 
													cursor: 'pointer',
													backgroundColor: selectedOrder?.id_ordenes_de_comprar === order.id_ordenes_de_comprar 
														? 'rgba(0, 0, 0, 0.04)' 
														: 'inherit'
												}}
											>
												<TableCell>{order.numero_correlativo || '-'}</TableCell>
												<TableCell>{order.copia || '-'}</TableCell>
												<TableCell>{order.plan?.Meses?.Nombre || order.plan?.mes || '-'}</TableCell>
												<TableCell>{order.plan?.nombre_plan || 'Sin plan'}</TableCell>
                                                <TableCell>{formatDate(order.created_at)}</TableCell>
												<TableCell>
													<Box
														component="span"
														sx={{
															display: 'inline-block',
															backgroundColor: 
																order.estado === 'activa' ? '#4caf50' : 
																order.estado === 'anulada' ? '#f44336' : 
																order.estado === 'anulada y remplazada' ? '#795548' : 
																'transparent',
															color: 
																order.estado === 'activa' || 
																order.estado === 'anulada' || 
																order.estado === 'anulada y remplazada' 
																	? 'white' 
																	: 'inherit',
															fontWeight: 
																order.estado === 'activa' || 
																order.estado === 'anulada' || 
																order.estado === 'anulada y remplazada' 
																	? 'bold' 
																	: 'normal',
															padding: 
																order.estado === 'activa' || 
																order.estado === 'anulada' || 
																order.estado === 'anulada y remplazada' 
																	? '4px 12px' 
																	: '0',
															borderRadius: 
																order.estado === 'activa' || 
																order.estado === 'anulada' || 
																order.estado === 'anulada y remplazada' 
																	? '4px' 
																	: '0'
														}}
													>
														{order.estado}
													</Box>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						</Paper>
					</Grid>

    </Paper>
    </Grid>


											    {/* Add the new Replace Modal */}
                                                <Dialog 
    open={openReplaceModal} 
    maxWidth="1650px" 
    fullWidth
    onClose={() => setOpenReplaceModal(false)}
    PaperProps={{
        sx: {
            maxHeight: '90vh',
            height: '90vh'
        }
    }}
>
    <DialogTitle sx={{ m: 0, p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Anular y Reemplazar Orden</Typography>
            <IconButton
                aria-label="close"
                onClick={() => setOpenReplaceModal(false)}
                sx={{ color: (theme) => theme.palette.grey[500] }}
            >
                <CloseIcon />
            </IconButton>
        </Box>
    </DialogTitle>
    <DialogContent sx={{ p: 2 }}>
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">
                        Orden: {selectedOrder?.numero_correlativo} - {selectedOrder?.plan?.nombre_plan}
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleCreateNewAlternative}
                    >
                        Agregar Nueva Alternativa
                    </Button>
                </Box>
            </Grid>

            <Grid item xs={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                        Alternativas de la Orden
                    </Typography>
                    <TableContainer sx={{ maxHeight: '65vh' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell  sx={{ fontSize: '10px' }}>N° Orden</TableCell>
                                    <TableCell sx={{ fontSize: '10px' }}>Soporte</TableCell>
                                    <TableCell sx={{ fontSize: '10px' }}>Tipo Item</TableCell>
                                    <TableCell sx={{ fontSize: '10px' }}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {modifiedAlternatives.map((alternative) => (
                                    <TableRow 
                                        key={alternative.id}
                                        sx={{ 
                                            cursor: 'pointer',
                                            backgroundColor: selectedAlternativeToReplace?.id === alternative.id 
                                                ? 'rgba(0, 0, 0, 0.04)' 
                                                : 'inherit'
                                        }}
                                    >
                                        <TableCell sx={{ fontSize: '10px' }}>{alternative.numerorden}</TableCell>
                                        <TableCell sx={{ fontSize: '10px' }}>{alternative.Soportes?.nombreIdentficiador}</TableCell>
                                        <TableCell sx={{ fontSize: '10px' }}>{alternative.tipo_item}</TableCell>
                                        <TableCell sx={{ fontSize: '10px' }}>
                                        <ButtonGroup size="small">
                                        <Button sx={{ fontSize: '10px', marginRight:'10px' }} 
    variant="contained"
    onClick={() => {
        // Asegurarse de que se carga la alternativa completa y actualizada
        // Usar toString() para evitar problemas de comparación entre tipos
        const alternativaCompleta = modifiedAlternatives.find(alt => String(alt.id) === String(alternative.id));
        
        if (!alternativaCompleta) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontró la alternativa seleccionada'
            });
            return;
        }
        
        // Crear una copia fresca para evitar referencias compartidas
        const freshCopy = JSON.parse(JSON.stringify(alternativaCompleta));
        
        // Agregar marca de tiempo para forzar actualización
        freshCopy._lastUpdated = new Date().getTime();
        
        setSelectedAlternativeToReplace(freshCopy);
        setIsCreatingNewAlternative(false);
    }}
>
    Editar
</Button>
    <Button sx={{ fontSize: '10px' }} 
        variant="contained"
        color="error"
        onClick={() => handleDeleteAlternative(alternative.id)}
    >
        Eliminar
    </Button>
</ButtonGroup>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>

            <Grid item xs={8}>
                <Paper sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
                    {(selectedAlternativeToReplace || isCreatingNewAlternative) ? (
                        <>
                            <Typography variant="h6" gutterBottom>
                                {isCreatingNewAlternative ? 'Crear Nueva Alternativa' : 'Editar Alternativa'}
                            </Typography>

                            <EditarAlternativaReemplazo 
    alternativaId={selectedAlternativeToReplace?.id}
    isCreatingNew={isCreatingNewAlternative}
    initialData={selectedAlternativeToReplace}
    ordenId={selectedOrder?.id_ordenes_de_comprar}
    onSave={handleSaveModifiedAlternative}
    onCancel={() => {
        setSelectedAlternativeToReplace(null);
        setIsCreatingNewAlternative(false);
    }}
    // Indicar si debe usar los datos proporcionados directamente (para IDs temporales)
    useProvidedDataOnly={String(selectedAlternativeToReplace?.id || '').startsWith('temp_')}
    // Usar un key único que incluya un timestamp para forzar re-render
    key={`alt-${selectedAlternativeToReplace?.id || 'new'}-${selectedAlternativeToReplace?._lastUpdated || new Date().getTime()}`}
/>
                        </>
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <Typography color="textSecondary">
                                Seleccione una alternativa para editar o cree una nueva
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Grid>
        </Grid>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setOpenReplaceModal(false)} color="primary">
            Cancelar
        </Button>
        <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveAndReplaceOrder}
            disabled={loading || modifiedAlternatives.length === 0}
        >
            {loading ? <CircularProgress size={24} /> : 'Guardar y Reemplazar Orden'}
        </Button>
    </DialogActions>
</Dialog>

    {/* Alternativas - Solo se muestra si hay una orden seleccionada y no está anulada */}
    {selectedOrder && selectedOrder.estado !== 'anulada' && (
    <Grid item xs={12}>
    <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
    Alternativas de la Orden
    </Typography>
    <TableContainer>
    <Table size="small">
    <TableHead>
    <TableRow>
    <TableCell>N° Orden</TableCell>
    <TableCell>Año</TableCell>
    <TableCell>Mes</TableCell>
    <TableCell>Contrato</TableCell>
    <TableCell>Soporte</TableCell>
    <TableCell>Tipo Item</TableCell>
    <TableCell>Clasificación</TableCell>
    <TableCell>Detalle</TableCell>
    <TableCell>Tema</TableCell>
    <TableCell>Duración</TableCell>
    <TableCell>Programa</TableCell>
    <TableCell align="right">Valor Unitario</TableCell>
    <TableCell align="right">Total Bruto</TableCell>
    <TableCell align="right">Total General</TableCell>
    <TableCell align="right">Total Neto</TableCell>
    </TableRow>
    </TableHead>
    <TableBody>
    {alternatives.map((alternative) => (
    <TableRow 
    key={alternative.id}
    onClick={() => setSelectedAlternative(alternative)}
    selected={selectedAlternative?.id === alternative.id}
    sx={{ 
    cursor: 'pointer',
    '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)'
    }
    }}
    >
    <TableCell>{alternative.numerorden}</TableCell>
    <TableCell>{alternative.Anios?.years}</TableCell>
    <TableCell>{alternative.Meses?.Nombre}</TableCell>
    <TableCell>{alternative.Contratos?.NombreContrato}</TableCell>
    <TableCell>{alternative.Soportes?.nombreIdentficiador}</TableCell>
    <TableCell>{alternative.tipo_item}</TableCell>
    <TableCell>{alternative.Clasificacion?.NombreClasificacion}</TableCell>
    <TableCell>{alternative.detalle}</TableCell>
    <TableCell>{alternative.Temas?.NombreTema}</TableCell>
    <TableCell>{alternative.Temas?.Duracion}</TableCell>
    <TableCell>{alternative.Programas?.codigo_programa}</TableCell>
    <TableCell align="right">
    {alternative.valor_unitario?.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP'
    })}
    </TableCell>
    <TableCell align="right">
    {alternative.total_bruto?.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP'
    })}
    </TableCell>
    <TableCell align="right">
    {alternative.total_general?.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP'
    })}
    </TableCell>
    <TableCell align="right">
    {alternative.total_neto?.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP'
    })}
    </TableCell>
    </TableRow>
    ))}
    {alternatives.length > 0 && (
    <TableRow>
    <TableCell colSpan={11} align="right">
    <strong>Totales:</strong>
    </TableCell>
    <TableCell align="right">
    <strong>
    {alternatives.reduce((sum, alt) => sum + (alt.valor_unitario || 0), 0)
    .toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP'
    })}
    </strong>
    </TableCell>
    <TableCell align="right">
    <strong>
    {alternatives.reduce((sum, alt) => sum + (alt.total_bruto || 0), 0)
    .toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP'
    })}
    </strong>
    </TableCell>
    <TableCell align="right">
    <strong>
    {alternatives.reduce((sum, alt) => sum + (alt.total_general || 0), 0)
    .toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP'
    })}
    </strong>
    </TableCell>
    <TableCell align="right">
    <strong>
    {alternatives.reduce((sum, alt) => sum + (alt.total_neto || 0), 0)
    .toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP'
    })}
    </strong>
    </TableCell>
    </TableRow>
    )}
    </TableBody>
    </Table>
    </TableContainer>
    </Paper>
    </Grid>
    )}
    {/* Totales de la Orden cuando está anulada (mostrar 0 sin afectar alternativas) */}
    {selectedOrder && selectedOrder.estado === 'anulada' && (
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Totales de la Orden (Anulada)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="right">Valor Unitario</TableCell>
                  <TableCell align="right">Total Bruto</TableCell>
                  <TableCell align="right">Total General</TableCell>
                  <TableCell align="right">Total Neto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell align="right"><strong>{(0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</strong></TableCell>
                  <TableCell align="right"><strong>{(0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</strong></TableCell>
                  <TableCell align="right"><strong>{(0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</strong></TableCell>
                  <TableCell align="right"><strong>{(0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    )}
    </Grid>
    )}
    </Container>
    );
};

export default RevisarOrden;
const formatDate = (value) => {
  if (!value) return '';
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms).toLocaleDateString();
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
};
