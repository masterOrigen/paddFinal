import React, { useState, useEffect } from 'react';
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
    IconButton
} from '@mui/material';
import { 
    Search as SearchIcon,
    Print as PrintIcon,
    Cancel as CancelIcon,
    SwapHoriz as SwapHorizIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';


const RevisarOrden = () => {
    const navigate = useNavigate();
    const [openClienteModal, setOpenClienteModal] = useState(true);

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
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [selectedCampana, setSelectedCampana] = useState(null);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [alternatives, setAlternatives] = useState([]);
    const [selectedAlternative, setSelectedAlternative] = useState(null);

	
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
    alternatives, // Pass all alternatives of the selected order
    selectedCliente,
    selectedCampana
    );
    } catch (error) {
    console.error('Error al generar PDF:', error);
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
    
    // Eliminamos la actualización de la tabla alternativa ya que no tiene campo estado
    // Solo actualizamos la orden principal
    const { error: ordenError } = await supabase
    .from('OrdenesDePublicidad')
    .update({ estado: 'anulada' })
    .eq('id_ordenes_de_comprar', selectedOrder.id_ordenes_de_comprar);
  
    if (ordenError) throw ordenError;
  
    Swal.fire(
    'Anulada',
    'La orden ha sido anulada correctamente',
    'success'
    );
  
    // Actualizamos la lista de órdenes para reflejar el cambio
    fetchOrders(selectedCampana.id_campania);
    
    // Actualizamos las alternativas si hay una orden seleccionada
    if (selectedOrder) {
    fetchAlternatives(selectedOrder.alternativas_plan_orden);
    }
    
    // Actualizamos el estado de la orden seleccionada en el estado local
    setSelectedOrder({
    ...selectedOrder,
    estado: 'anulada'
    });
    
    } catch (error) {
    console.error('Error al anular:', error);
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
    setOpenReplaceModal(true);
};


    useEffect(() => {
    fetchClientes();
    }, []);

    const fetchClientes = async () => {
    try {
    setLoading(true);
    const { data, error } = await supabase
    .from('Clientes')
    .select(`
    id_cliente,
    nombreCliente,
    direccionEmpresa,
    RUT,
    razonSocial,
    id_comuna,
    comuna:Comunas!inner (
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
    fetchOrders(campana.id_campania);
    };

    const handleResetSelection = () => {
    setSelectedCliente(null);
    setSelectedCampana(null);
    setOpenClienteModal(true);
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
    nombre_plan
    ),
    usuario_registro
    `)
    .eq('id_campania', campaignId);
    
    if (error) throw error;
    setOrders(data || []);
    } catch (error) {
    console.error('Error fetching orders:', error);
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
    Contratos (
    id,
    num_contrato,
    id_FormadePago,
    IdProveedor,
    FormaDePago (
    id,
    NombreFormadePago
    ),
    Proveedores (
    id_proveedor,
    nombreProveedor,
    rutProveedor,
    direccionFacturacion,
    id_comuna
    )
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
    Duracion
    ),
    Programas (
    id,
    codigo_programa,
    hora_inicio,
    hora_fin,
    descripcion
    )
    `)
    .in('id', alternativeIds);
    
    if (error) throw error;
    setAlternatives(data || []);
    } catch (error) {
    console.error('Error fetching alternatives:', error);
    } finally {
    setLoading(false);
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
    >
    <DialogTitle sx={{ m: 0, p: 2 }}>
    <Box>
    <Typography variant="h6" sx={{ textAlign: 'left' }}>
    Seleccionar Campaña
    </Typography>
    <Typography variant="subtitle1" sx={{ textAlign: 'left' }}color="textSecondary">
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
    </DialogTitle>
    <DialogContent>
    {loading ? (
    <Box display="flex" justifyContent="center" m={3}>
    <CircularProgress />
    </Box>
    ) : campanas.length === 0 ? (
    <Box display="flex" justifyContent="center" m={3}>
    <Typography>No hay campañas asociadas</Typography>
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
    <Button variant="outlined" onClick={handleResetSelection}>
    Cambiar Selección
    </Button>
    </Box>
    <Typography>Cliente: {selectedCliente.nombreCliente}</Typography>
    <Typography>Campaña: {selectedCampana.NombreCampania}</Typography>
    <Typography>Año: {selectedCampana.Anios?.years || 'No especificado'}</Typography>
    <Typography>Producto: {selectedCampana.Productos?.NombreDelProducto || 'No especificado'}</Typography>


					{/* Órdenes */}
					<Grid item xs={12}>
						<Paper sx={{ p: 2 }}>
							<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
								<Typography variant="h6">
									Órdenes Asociadas
								</Typography>
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
											disabled={!selectedOrder}
										>
											Anular y reemplazar
										</Button>
									</Tooltip>
									<Tooltip title="Anular orden">
										<Button
											onClick={handleCancel}
											startIcon={<CancelIcon />}
											color="error"
											disabled={!selectedOrder}
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
											<TableCell>ID Orden</TableCell>
											<TableCell>N° de Orden</TableCell>
											<TableCell>N° de copias</TableCell>
											<TableCell>Plan</TableCell>
											<TableCell>Fecha</TableCell>
											<TableCell>Estado</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{orders.map((order) => (
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
												<TableCell>{order.id_ordenes_de_comprar}</TableCell>
												<TableCell>{order.numero_correlativo || '-'}</TableCell>
												<TableCell>{order.copia || '-'}</TableCell>
												<TableCell>{order.plan?.nombre_plan || 'Sin plan'}</TableCell>
												<TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
												<TableCell>{order.estado}</TableCell>
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
                maxWidth="xl" 
                fullWidth
                onClose={() => setOpenReplaceModal(false)}
            >
                <DialogTitle sx={{ m: 0, p: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Estas anulando reemplazando los datos de la orden</Typography>
                        <IconButton
                            aria-label="close"
                            onClick={() => setOpenReplaceModal(false)}
                            sx={{ color: (theme) => theme.palette.grey[500] }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        {/* Left container - Alternatives List */}
                        <Grid item xs={6}>
                            <Paper sx={{ p: 2, height: '100%' }}>
                                <Typography variant="h6" gutterBottom>
                                    Alternativas de la Orden
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>N° Orden</TableCell>
                                                <TableCell>Soporte</TableCell>
                                                <TableCell>Tipo Item</TableCell>
                                                <TableCell>Acción</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {alternatives.map((alternative) => (
                                                <TableRow 
                                                    key={alternative.id}
                                                    sx={{ 
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedAlternativeToReplace?.id === alternative.id 
                                                            ? 'rgba(0, 0, 0, 0.04)' 
                                                            : 'inherit'
                                                    }}
                                                >
                                                    <TableCell>{alternative.numerorden}</TableCell>
                                                    <TableCell>{alternative.Soportes?.nombreIdentficiador}</TableCell>
                                                    <TableCell>{alternative.tipo_item}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={() => setSelectedAlternativeToReplace(alternative)}
                                                        >
                                                            Seleccionar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>

                        {/* Right container - Edit Alternative */}
                        <Grid item xs={6}>
                            <Paper sx={{ p: 2, height: '100%' }}>
                                {selectedAlternativeToReplace ? (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            Editar Alternativa
                                        </Typography>
                                        {/* Add your edit form here */}
                                        <Typography>
                                            Formulario de edición para la alternativa {selectedAlternativeToReplace.numerorden}
                                        </Typography>
                                    </>
                                ) : (
                                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                        <Typography color="textSecondary">
                                            Seleccione una alternativa para editar
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
                        disabled={!selectedAlternativeToReplace}
                    >
                        Guardar Cambios
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
    <TableCell>{alternative.Contratos?.num_contrato}</TableCell>
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
    </Grid>
    )}
    </Container>
    );
};

export default RevisarOrden;