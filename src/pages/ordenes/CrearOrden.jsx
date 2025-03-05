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

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (selectedCampana) {
      fetchPlanes(selectedCampana.id_campania);
    }
  }, [selectedCampana]);

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
            Programas (descripcion, hora_inicio, hora_fin, codigo_programa),
            Temas (CodigoMegatime, NombreTema, Duracion, id_tema),
            Contratos (NombreContrato, FormaDePago (NombreFormadePago), Proveedores (nombreProveedor, rutProveedor, direccionFacturacion, id_comuna)),
            Soportes (nombreIdentficiador),
            Clasificacion (NombreClasificacion),
            Meses (Id, Nombre),
            Anios (years),
            calendar (dia, cantidad),
            total_bruto,
            descuento_pl,
            valor_unitario,
            total_neto,
            num_contrato,
            tipo_item
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
          Comunas!inner (id_comuna, nombreComuna)
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
  
      // Obtener datos del usuario desde localStorage
      const userData = localStorage.getItem('user');
      let usuario_registro = [{ nombre: 'Usuario', email: 'no_email@example.com' }];
  
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          usuario_registro = [{
            nombre: parsedUserData?.Nombre || 'Usuario', // Fallback a 'Usuario'
            email: parsedUserData?.Email || 'no_email@example.com' // Fallback a un email por defecto
          }];
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
  
      // Crear la orden en la base de datos
      const { data, error } = await supabase
        .from('OrdenesDePublicidad')
        .insert({
          id_campania: selectedCampana.id_campania,
          id_plan: selectedPlan.id,
          id_compania: selectedCampana.id_compania,
          alternativas_plan_orden: selectedAlternativas,
          usuario_registro: usuario_registro // Insertamos los datos del usuario
        })
        .select()
        .single();
  
      if (error) {
        console.error('Error al crear la orden:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear la orden. Por favor, intente nuevamente.',
        });
        return;
      }
  
      // Actualizar alternativas seleccionadas
      const { error: updateError } = await supabase
        .from('alternativa')
        .update({ ordencreada: true })
        .in('id', selectedAlternativas);
  
      if (updateError) {
        console.error('Error al actualizar alternativas:', updateError);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'La orden se creó pero hubo un error al actualizar las alternativas.',
        });
        return;
      }
  
      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'La orden ha sido creada correctamente',
        showConfirmButton: true,
        timer: 2000
      });
  
      // Generar PDF de la orden
      const alternativasSeleccionadas = alternativas.filter(alt => selectedAlternativas.includes(alt.id));
      generateOrderPDF(data, alternativasSeleccionadas, selectedCliente, selectedCampana, selectedPlan);
  
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
