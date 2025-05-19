import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import TablaOrden from '../../components/ordenes/TablaOrden';
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
  Checkbox
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const CrearOrden = () => {
  const navigate = useNavigate();
  
  const handleClose = () => {
    navigate('/');
  };

  const [openClienteModal, setOpenClienteModal] = useState(true);
  const [openCampanaModal, setOpenCampanaModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedCampana, setSelectedCampana] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [planes, setPlanes] = useState([]);
  const [alternativas, setAlternativas] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAlternativas, setSelectedAlternativas] = useState([]);
  const [ordenCreada, setOrdenCreada] = useState(null);
  const [alternativasOrden, setAlternativasOrden] = useState([]);
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (selectedCampana) {
      fetchPlanes(selectedCampana.id_campania);
    }
  }, [selectedCampana]);
  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        const { data: userData, error: userError } = await supabase
          .from('usuarios') // or your users table name
          .select('nombre, email')
          .eq('id', session.user.id)
          .single();
        
        if (!userError && userData) {
          setUser(userData);
        }
      }
    };
    
    getUserSession();
  }, []);
  const fetchAlternativas = async () => {
    if (selectedPlan) {
      setLoading(true);
      try {
        // Primero obtenemos los id_alternativa relacionados con el plan
        const { data: planAlternativas, error: planAltError } = await supabase
          .from('plan_alternativas')
          .select('id_alternativa')
          .eq('id_plan', selectedPlan.id);

        if (planAltError) {
          console.error('Error al obtener plan_alternativas:', planAltError);
          throw planAltError;
        }

        if (!planAlternativas?.length) {
          console.log('No se encontraron alternativas para este plan');
          setAlternativas([]);
          setLoading(false);
          return;
        }

        // Obtenemos los ids de las alternativas
        const alternativaIds = planAlternativas
          .map(pa => pa.id_alternativa)
          .filter(id => id != null);

        // Ahora obtenemos los detalles de las alternativas
        const { data: alternativasData, error: altError } = await supabase
          .from('alternativa')
            .select(`
            *,
            Anios (id, years),
            Meses (Id, Nombre),
            Contratos (id, NombreContrato, num_contrato, id_FormadePago, IdProveedor,
              FormaDePago (id, NombreFormadePago),
              Proveedores (id_proveedor, nombreProveedor, rutProveedor, direccionFacturacion, id_comuna),
              TipoGeneracionDeOrden (id, NombreTipoOrden)
            ),
            tipo_item,
            Soportes (id_soporte, nombreIdentficiador),
            Clasificacion (id, NombreClasificacion),
            Temas (id_tema, NombreTema, Duracion, CodigoMegatime),
            Programas (id, codigo_programa, hora_inicio, hora_fin, descripcion)
            `)
          .in('id', alternativaIds)
          .or('ordencreada.is.null,ordencreada.eq.false');

        if (altError) {
          console.error('Error al obtener alternativas:', altError);
          throw altError;
        }

        console.log('Alternativas cargadas:', alternativasData);
        setAlternativas(alternativasData || []);
      } catch (error) {
        console.error('Error al cargar alternativas:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las alternativas'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAlternativas();
  }, [selectedPlan]);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Clientes')
        .select(`
          id_cliente, 
          nombreCliente, 
          RUT, 
          razonSocial, 
          direccionEmpresa,
          id_comuna,
          Comunas (
            id_comuna,
            nombreComuna
          )
        `)
        .order('nombreCliente');
  
      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
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
            nombreCliente
          ),
          Anios:Anio (
            id,
            years
          ),
          Productos (
            id,
            NombreDelProducto
          )
        `)
        .eq('id_Cliente', clienteId)
        .order('NombreCampania');

      if (error) throw error;
      setCampanas(data || []);
    } catch (error) {
      console.error('Error al cargar campañas:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleClienteSelect = async (cliente) => {
    try {
      setSelectedCliente(cliente);
      await fetchCampanas(cliente.id_cliente);
      setOpenClienteModal(false);
      setOpenCampanaModal(true);
    } catch (error) {
      console.error('Error al seleccionar cliente:', error);
    }
  };

  const handleCampanaSelect = (campana) => {
    setSelectedCampana(campana);
    setOpenCampanaModal(false);
    // Aquí continuaremos con la creación de la orden
  };

  const handleResetSelection = () => {
    setSelectedCliente(null);
    setSelectedCampana(null);
    setOpenClienteModal(true);
  };

  const fetchPlanes = async (campaniaId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plan')
        .select(`
          id,
          nombre_plan,
          Anios (id, years),
          Meses (Id, Nombre)
        `)
        .eq('id_campania', campaniaId)
        .eq('estado2', 'aprobado');

      if (error) throw error;
      console.log('Planes cargados:', data);
      setPlanes(data || []);
    } catch (error) {
      console.error('Error al cargar planes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los planes'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlternativa = (alternativaId) => {
    setSelectedAlternativas(prev => {
      if (prev.includes(alternativaId)) {
        return prev.filter(id => id !== alternativaId);
      } else {
        return [...prev, alternativaId];
      }
    });
  };

  const handleSelectAllAlternativas = (event) => {
    if (event.target.checked) {
      setSelectedAlternativas(alternativas.map(alt => alt.id));
    } else {
      setSelectedAlternativas([]);
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Add debugging
  console.log('Current user info:', {
    nombre: user?.nombre || 'No name available',
    email: user?.email || 'No email available'
  });

  try {
    const orderData = {
      // ... your existing order data ...
      usuario_registro: {
        nombre: user?.nombre,
        email: user?.email
      }
    };

    console.log('Order data being sent:', orderData);

    const response = await axios.post('/api/orders', orderData);
    
    // Add debugging for response
    console.log('Order creation response:', response.data);

    // ... rest of your code ...
  } catch (error) {
    console.error('Error creating order:', error);
    // Handle error appropriately
  }
};
const [user2] = useState(JSON.parse(localStorage.getItem('user')));
const handleCrearOrden = async () => {
  try {
    if (!selectedAlternativas.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'Debe seleccionar al menos una alternativa'
      });
      return;
    }

    // Obtener el último número correlativo válido (no nulo)
    const { data: ultimaOrden, error: errorCorrelativo } = await supabase
      .from('OrdenesDePublicidad')
      .select('numero_correlativo')
      .not('numero_correlativo', 'is', null)
      .order('numero_correlativo', { ascending: false })
      .limit(1)
      .single();

    if (errorCorrelativo && errorCorrelativo.code !== 'PGRST116') {
      throw errorCorrelativo;
    }

    let nuevoCorrelativo = (ultimaOrden?.numero_correlativo || 33992) + 1;

    // Obtener las alternativas seleccionadas
    const alternativasSeleccionadas = alternativas.filter(alt => selectedAlternativas.includes(alt.id));

    // Agrupar alternativas por soporte, contrato y proveedor
    const alternativasPorGrupo = alternativasSeleccionadas.reduce((acc, alt) => {
      const soporteId = alt.Soportes?.id_soporte;
      const contratoId = alt.Contratos?.id;
      const proveedorId = alt.Contratos?.IdProveedor;
      const tipoItem = alt.tipo_item;
      
      // Crear una clave única combinando soporte, contrato y proveedor
      const grupoKey = `${soporteId}-${contratoId}-${proveedorId}-${tipoItem}`;
      
      if (!acc[grupoKey]) {
        acc[grupoKey] = {
          alternativas: [],
          soporte: alt.Soportes,
          contrato: alt.Contratos,
          proveedor: alt.Contratos?.Proveedores,
          tipo_item: alt.tipo_item
        };
      }
      acc[grupoKey].alternativas.push(alt);
      return acc;
    }, {});

     // Recolectar IDs únicos para actualizar las tablas relacionadas
     const campaniaId = selectedCampana.id_campania;
     const soporteIds = [...new Set(alternativasSeleccionadas.map(alt => alt.Soportes?.id_soporte).filter(Boolean))];
     const contratoIds = [...new Set(alternativasSeleccionadas.map(alt => alt.Contratos?.id).filter(Boolean))];
     const temaIds = [...new Set(alternativasSeleccionadas.map(alt => alt.Temas?.id_tema).filter(Boolean))];
     const programaIds = [...new Set(alternativasSeleccionadas.map(alt => alt.Programas?.id).filter(Boolean))];

    // Para cada grupo (combinación única de soporte, contrato y proveedor), crear una orden y un PDF independiente
    for (const [grupoKey, grupo] of Object.entries(alternativasPorGrupo)) {
      const altsDelGrupo = grupo.alternativas;
      
      // Crear el registro en OrdenesDePublicidad
      const { data, error } = await supabase
        .from('OrdenesDePublicidad')
        .insert({
          id_campania: selectedCampana.id_campania,
          id_plan: selectedPlan.id,
          id_compania: selectedCampana.id_compania,
          alternativas_plan_orden: altsDelGrupo.map(alt => alt.id),
          numero_correlativo: nuevoCorrelativo,
          usuario_registro: user2 ? {
            nombre: user2.Nombre,
            email: user2.Email
          } : null,
          // Solo incluir los campos que existen en la tabla
          id_soporte: grupo.soporte?.id_soporte,
          id_contrato: grupo.contrato?.id,
          estado: 'activa'
        })
        .select()
        .single();

      if (error) {
        console.error('Error al crear la orden:', error);
        throw error;
      }

      // Actualizar las alternativas de este grupo
      const { error: updateError } = await supabase
        .from('alternativa')
        .update({ 
          ordencreada: true,
          numerorden: nuevoCorrelativo
        })
        .in('id', altsDelGrupo.map(alt => alt.id));

      if (updateError) {
        console.error('Error al actualizar alternativas:', updateError);
        throw updateError;
      }

      // Generar el PDF para este grupo de alternativas
      generateOrderPDF(data, altsDelGrupo, selectedCliente, selectedCampana, selectedPlan);

      // Incrementar el correlativo para la siguiente orden
      nuevoCorrelativo++;
    }

       // Actualizar campo c_orden en las tablas relacionadas
       const updatePromises = [];

       // Actualizar campaña
       if (campaniaId) {
         updatePromises.push(
           supabase
             .from('Campania')
             .update({ c_orden: true })
             .eq('id_campania', campaniaId)
         );
       }
   
       // Actualizar soportes
       if (soporteIds.length > 0) {
         updatePromises.push(
           supabase
             .from('Soportes')
             .update({ c_orden: true })
             .in('id_soporte', soporteIds)
         );
       }
   
       // Actualizar contratos
       if (contratoIds.length > 0) {
         updatePromises.push(
           supabase
             .from('Contratos')
             .update({ c_orden: true })
             .in('id', contratoIds)
         );
       }
   
       // Actualizar temas
       if (temaIds.length > 0) {
         updatePromises.push(
           supabase
             .from('Temas')
             .update({ c_orden: true })
             .in('id_tema', temaIds)
         );
       }
   
       // Actualizar programas
       if (programaIds.length > 0) {
         updatePromises.push(
           supabase
             .from('Programas')
             .update({ c_orden: true })
             .in('id', programaIds)
         );
       }
   
       // Ejecutar todas las actualizaciones en paralelo
       await Promise.all(updatePromises);

    // Mostrar mensaje de éxito
    const cantidadOrdenes = Object.keys(alternativasPorGrupo).length;
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: cantidadOrdenes > 1 
        ? `Se han creado ${cantidadOrdenes} órdenes correctamente`
        : 'La orden ha sido creada correctamente',
      showConfirmButton: true,
      timer: 2000
    });

    // Refrescar la tabla de alternativas
    await fetchAlternativas();

    // Limpiar selecciones
    setSelectedAlternativas([]);
    
  } catch (error) {
    console.error('Error al crear la orden:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al crear la orden'
    });
  }
};

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombreCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Modal de Selección de Cliente */}
        <Dialog 
        open={openClienteModal} 
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown
        >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Seleccionar Cliente
          </Typography>
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
        >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">
            Seleccionar Campaña
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
            Cliente: {selectedCliente?.nombreCliente}
            </Typography>
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
          </Box>
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
                  <TableCell>Nombre de Campaña</TableCell>
                  <TableCell>Año</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campanas.map((campana) => (
                  <TableRow key={campana.id_campania}>
                    <TableCell>{campana.NombreCampania}</TableCell>
                    <TableCell>{campana.Anios?.years || 'No especificado'}</TableCell>
                    <TableCell>{campana.Productos?.NombreDelProducto || 'No especificado'}</TableCell>
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
          <Button onClick={handleResetSelection} startIcon={<CancelIcon />}>
            Cambiar Cliente
          </Button>
        </DialogActions>
      </Dialog>

        {selectedCliente && selectedCampana && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header Section */}
            <Paper 
              elevation={3}
              sx={{ 
              p: 3,
              backgroundColor: '#ffffff',
              position: 'relative'
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Crear Orden de Publicidad
              </Typography>
              
              <Typography variant="subtitle1">
                <strong>Cliente:</strong> {selectedCliente.nombreCliente}
              </Typography>
              
              <Typography variant="subtitle1">
                <strong>Campaña:</strong> {selectedCampana.NombreCampania}
              </Typography>
              </Box>
              
              <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleResetSelection}
              >
                Cambiar Selección
              </Button>
              </Box>
            </Paper>


            {/* Tables Container */}
            <Box sx={{ 
              display: 'flex', 
              gap: 3,
              height: 'calc(100vh - 280px)'
            }}>
              {/* Planes Section */}
              <Box sx={{ 
                flex: '0 0 35%',
                p: 3,
                borderRadius: 2,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  Planes Aprobados
                </Typography>
                {selectedCampana ? (
                  <TableContainer sx={{ 
                    flex: 1, 
                    overflow: 'auto',
                    backgroundColor: '#ffffff',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Año</TableCell>
                          <TableCell>Mes</TableCell>
                          <TableCell>Acción</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {planes.map((plan) => (
                          <TableRow 
                            key={plan.id}
                            selected={selectedPlan?.id === plan.id}
                          >
                            <TableCell>{plan.nombre_plan}</TableCell>
                            <TableCell>{plan.Anios?.years}</TableCell>
                            <TableCell>{plan.Meses?.Nombre}</TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                  console.log('Seleccionando plan:', plan);
                                  setSelectedPlan(plan);
                                }}
                              >
                                Seleccionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary" align="center">
                    Seleccione una campaña para ver sus planes
                  </Typography>
                )}
              </Box>

              {/* Alternativas Section */}
              <Box sx={{ 
                flex: 1,
                p: 3,
                borderRadius: 2,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Alternativas del Plan
                  </Typography>
                  {selectedPlan && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleCrearOrden}
                      disabled={selectedAlternativas.length === 0 || loading}
                    >
                      Crear Orden
                    </Button>
                  )}
                </Box>
              {selectedPlan ? (
                <TableContainer sx={{ 
                  flex: 1,
                  overflow: 'auto',
                  '& .MuiTable-root': {
                    minWidth: 1500 
                  }
                }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" style={{backgroundColor: '#f5f5f5'}}>
                          <Checkbox
                            indeterminate={
                              selectedAlternativas.length > 0 && 
                              selectedAlternativas.length < alternativas.length
                            }
                            checked={
                              alternativas.length > 0 && 
                              selectedAlternativas.length === alternativas.length
                            }
                            onChange={handleSelectAllAlternativas}
                          />
                        </TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>N° Línea</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>N° Orden</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Contrato</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Soporte</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Programa</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Clasificación</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Tema</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Tipo Item</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Detalle</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Segundos</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Valor Unit.</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Desc.</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Rec.</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Total Bruto</TableCell>
                        <TableCell style={{backgroundColor: '#f5f5f5'}}>Total Neto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {alternativas.map((alt) => (
                        <TableRow 
                          key={alt.id}
                          selected={selectedAlternativas.includes(alt.id)}
                          hover
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedAlternativas.includes(alt.id)}
                              onChange={() => handleSelectAlternativa(alt.id)}
                            />
                          </TableCell>
                          <TableCell>{alt.nlinea}</TableCell>
                          <TableCell>{alt.numerorden}</TableCell>
                          <TableCell>{alt.Contratos?.NombreContrato}</TableCell>
                          <TableCell>{alt.Soportes?.nombreIdentficiador}</TableCell>
                          <TableCell>{alt.Programas?.descripcion}</TableCell>
                          <TableCell>{alt.Clasificacion?.NombreClasificacion}</TableCell>
                          <TableCell>{alt.Temas?.NombreTema}</TableCell>
                          <TableCell>{alt.tipo_item}</TableCell>
                          <TableCell>{alt.detalle}</TableCell>
                          <TableCell>{alt.segundos}</TableCell>
                          <TableCell>
                            {alt.valor_unitario?.toLocaleString('es-CL', {
                              style: 'currency',
                              currency: 'CLP'
                            })}
                          </TableCell>
                          <TableCell>{alt.descuento_plan}%</TableCell>
                          <TableCell>{alt.recargo_plan}%</TableCell>
                          <TableCell>
                            {alt.total_bruto?.toLocaleString('es-CL', {
                              style: 'currency',
                              currency: 'CLP'
                            })}
                          </TableCell>
                          <TableCell>
                            {alt.total_neto?.toLocaleString('es-CL', {
                              style: 'currency',
                              currency: 'CLP'
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center">
                  Seleccione un plan para ver sus alternativas
                </Typography>
              )}
              </Box>
            </Box>
            </Box>
          )}
      {/* Mostrar la tabla de orden después de crearla */}
      {ordenCreada && alternativasOrden.length > 0 && (
        <TablaOrden
          ordenData={ordenCreada}
          alternativas={alternativasOrden}
          cliente={selectedCliente}
          campana={selectedCampana}
        />
      )}
    </Container>
  );
};

export default CrearOrden;
