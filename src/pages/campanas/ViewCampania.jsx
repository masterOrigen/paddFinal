import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Breadcrumbs,
    Link,
    Card,
    CardContent,
    CardHeader,
    Tabs,
    Tab,
    Box,
    Button,
    Divider,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../../config/supabase';
import ModalEditarCampana from './ModalEditarCampana';
import ModalAgregarFactura from './ModalAgregarFactura';
import ModalEditarFactura from './ModalEditarFactura';
import ModalAgregarTema from './ModalAgregarTema';
import ModalEditarTema from './ModalEditarTema';
import Swal from 'sweetalert2';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ViewCampania = () => {
    const { id } = useParams();
    const [campana, setCampana] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openFacturaModal, setOpenFacturaModal] = useState(false);
    const [openEditFacturaModal, setOpenEditFacturaModal] = useState(false);
    const [selectedFactura, setSelectedFactura] = useState(null);
    const [facturas, setFacturas] = useState([]);
    const [openTemaModal, setOpenTemaModal] = useState(false);
    const [openEditTemaModal, setOpenEditTemaModal] = useState(false);
    const [selectedTema, setSelectedTema] = useState(null);
    const [temas, setTemas] = useState([]);
    const [alternativaData, setAlternativaData] = useState([]);

    useEffect(() => {
        fetchCampanaDetails();
        fetchFacturas();
        fetchTemas();
        fetchAlternativaData();
    }, [id]);

    const fetchCampanaDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('Campania')
                .select(`
                    *,
                    Clientes!id_Cliente (
                        id_cliente,
                        nombreCliente
                    ),
                    Productos!id_Producto (
                        id,
                        NombreDelProducto
                    ),
                    Anios!Anio (
                        id,
                        years
                    ),
                    Agencias!Id_Agencia (
                        id,
                        NombreIdentificador
                    )
                `)
                .eq('id_campania', id)
                .single();

            if (error) throw error;
            console.log('Datos de campaña:', data);
            setCampana(data);
        } catch (error) {
            console.error('Error al obtener detalles de la campaña:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFacturas = async () => {
        try {
            const { data, error } = await supabase
                .from('Facturas')
                .select('*')
                .eq('IdCampania', id);

            if (error) throw error;
            setFacturas(data || []);
        } catch (error) {
            console.error('Error al cargar facturas:', error);
        }
    };

    const fetchTemas = async () => {
        try {
            const { data, error } = await supabase
                .from('campania_temas')
                .select(`
                    id_temas,
                    Temas!inner (
                        id_tema,
                        NombreTema,
                        Duracion,
                        CodigoMegatime,
                        color,
                        cooperado,
                        rubro,
                        estado,
                        c_orden,
                        Medios:id_medio (
                            id,
                            NombredelMedio
                        ),
                        Calidad:id_Calidad (
                            id,
                            NombreCalidad
                        )
                    )
                `)
                .eq('id_campania', id);

            if (error) {
                console.error('Error al cargar temas:', error);
                throw error;
            }

            console.log('Temas cargados:', data);
            // Transformar la estructura de datos para mantener compatibilidad
            const temasTransformados = data?.map(item => ({
                ...item.Temas,
                id_tema: item.id_temas, // Asegurar que usamos el id correcto
                Calidad: item.Temas.Calidad ? {
                    id_calidad: item.Temas.Calidad.id,
                    NombreCalidad: item.Temas.Calidad.NombreCalidad
                } : null,
                Medios: item.Temas.Medios ? {
                    id_medio: item.Temas.Medios.id,
                    NombredelMedio: item.Temas.Medios.NombredelMedio
                } : null
            })) || [];
            
            console.log('Temas transformados:', temasTransformados);
            setTemas(temasTransformados);
        } catch (error) {
            console.error('Error al cargar temas:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los temas: ' + error.message
            });
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleToggleFacturaEstado = async (factura) => {
        const nuevoEstado = !factura.estado;
        const accion = nuevoEstado ? 'activar' : 'desactivar';

        // Mostrar confirmación con SweetAlert2
        const result = await Swal.fire({
            title: `¿Estás seguro?`,
            text: `¿Deseas ${accion} esta factura?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const { error } = await supabase
                    .from('Facturas')
                    .update({ estado: nuevoEstado })
                    .eq('id_factura', factura.id_factura);

                if (error) throw error;

                // Mostrar mensaje de éxito
                await Swal.fire({
                    title: '¡Completado!',
                    text: `La factura ha sido ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente.`,
                    icon: 'success',
                    confirmButtonColor: '#3085d6'
                });

                // Actualizar la lista de facturas
                fetchFacturas();
            } catch (error) {
                console.error('Error al actualizar estado de factura:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo actualizar el estado de la factura.',
                    icon: 'error',
                    confirmButtonColor: '#3085d6'
                });
            }
        }
    };

    const handleDeleteFactura = async (facturaId) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const { error } = await supabase
                    .from('Facturas')
                    .delete()
                    .match({ id_factura: facturaId });

                if (error) throw error;

                await fetchFacturas();

                Swal.fire(
                    '¡Eliminado!',
                    'La factura ha sido eliminada.',
                    'success'
                );
            } catch (error) {
                console.error('Error al eliminar la factura:', error);
                Swal.fire(
                    'Error',
                    'No se pudo eliminar la factura',
                    'error'
                );
            }
        }
    };

    const handleEditFactura = (factura) => {
        setSelectedFactura(factura);
        setOpenEditFacturaModal(true);
    };

    const handleEditTema = (tema) => {
        if (tema.c_orden === true) {
            Swal.fire({
                icon: 'warning',
                title: 'No se puede editar',
                text: 'Este registro no se puede actualizar ya que forma parte de una Orden Creada.',
                confirmButtonColor: '#3085d6',
            });
            return;
        }
        setSelectedTema(tema);
        setOpenEditTemaModal(true);
    };  

    const handleDeleteTema = async (temaId) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // Primero eliminar la relación en campania_temas
                const { error: relError } = await supabase
                    .from('campania_temas')
                    .delete()
                    .eq('id_temas', temaId);

                if (relError) throw relError;

                // Luego eliminar el tema
                const { error: temaError } = await supabase
                    .from('Temas')
                    .delete()
                    .eq('id_tema', temaId);

                if (temaError) throw temaError;

                await fetchTemas(); // Recargar la lista de temas

                Swal.fire(
                    '¡Eliminado!',
                    'El tema ha sido eliminado.',
                    'success'
                );
            } catch (error) {
                console.error('Error al eliminar tema:', error);
                Swal.fire(
                    'Error',
                    'No se pudo eliminar el tema: ' + error.message,
                    'error'
                );
            }
        }
    };

    const fetchAlternativaData = async () => {
        try {
            const { data, error } = await supabase
                .from('alternativa')
                .select(`
                    *,
                    Contratos:num_contrato (
                        id,
                        NombreContrato
                    ),
                    Temas:id_tema (
                        id_tema,
                        NombreTema
                    ),
                    Anios:anio (
                        id,
                        years
                    ),
                    Meses:mes (
                        Id,
                        Nombre
                    ),
                    Campania:id_campania (
                        id_campania,
                        NombreCampania
                    ),
                    Soportes:id_soporte (
                        id_soporte,
                        nombreIdentficiador
                    )
                `)
                .eq('ordencreada', true)
                .eq('id_campania', id);
            if (error) throw error;
            setAlternativaData(data || []);
        } catch (error) {
            console.error('Error fetching alternativa data:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las órdenes de contrato'
            });
        }
    };

    const handleToggleTemaEstado = async (tema) => {
        try {
            // Convertir el estado actual a string para la comparación
            const estadoActual = String(tema.estado) === "true" || tema.estado === "1" ? "1" : "0";
            const nuevoEstado = estadoActual === "1" ? "0" : "1";
            
            // Mostrar SweetAlert de confirmación
            const result = await Swal.fire({
                title: '¿Cambiar estado?',
                text: `¿Desea ${estadoActual === "1" ? "desactivar" : "activar"} el tema "${tema.NombreTema}"?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cambiar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                const { error } = await supabase
                    .from('Temas')
                    .update({ estado: nuevoEstado })
                    .eq('id_tema', tema.id_tema);

                if (error) throw error;

                await fetchTemas();

                // Mostrar SweetAlert de éxito
                await Swal.fire({
                    title: 'Estado actualizado',
                    text: `El tema ha sido ${nuevoEstado === "1" ? "activado" : "desactivado"} exitosamente`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar el estado del tema'
            });
        }
    };

    if (loading) {
        return <Typography>Cargando...</Typography>;
    }

    if (!campana) {
        return <Typography>No se encontró la campaña</Typography>;
    }

    return (
        <Container maxWidth="xl">
            <div style={{ marginBottom: '20px', marginTop: '20px' }}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                    <Link component={RouterLink} to="/dashboard" color="inherit">
                        Inicio
                    </Link>
                    <Link component={RouterLink} to="/campanas" color="inherit">
                        Ver Campañas
                    </Link>
                    <Typography color="textPrimary">{campana.NombreCampania}</Typography>
                </Breadcrumbs>
            </div>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
                        {campana?.NombreCampania?.toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Registrado el: {new Date(campana?.fechaCreacion).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cliente: {campana?.Clientes?.nombreCliente}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Producto: {campana?.Productos?.NombreDelProducto}
                    </Typography>
                </Paper>

                    <Card sx={{ mt: 2 }}>
                        <CardHeader
                            title="Detalles de la Campaña"
                            action={
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<EditIcon />}
                                    onClick={() => setOpenEditModal(true)}
                                >
                                    Editar datos
                                </Button>
                            }
                        />
                        <Divider />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Nombre Cliente
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography align="right">
                                        {campana.Clientes?.nombreCliente}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Producto
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography align="right">
                                        {campana.Productos?.NombreDelProducto}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Estado
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box display="flex" justifyContent="flex-end">
                                        <Switch
                                            checked={campana.estado}
                                            disabled
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Presupuesto
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography align="right">
                                        {campana.Presupuesto?.toLocaleString('es-CL', { 
                                            style: 'currency', 
                                            currency: 'CLP' 
                                        })}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Año
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography align="right">
                                        {campana.Anios?.years}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            indicatorColor="primary"
                            textColor="primary"
                        >
                            <Tab label="Temas" />
                            <Tab label="Ordenes de Contrato" />
                            <Tab label="Factura" />
                        </Tabs>

                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ mb: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={() => setOpenTemaModal(true)}
                                >
                                    Agregar Tema
                                </Button>
                            </Box>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Nombre del Tema</TableCell>
                                            <TableCell>Medio</TableCell>
                                            <TableCell>Duración</TableCell>
                                            <TableCell>Calidad</TableCell>
                                            <TableCell>Color</TableCell>
                                            <TableCell>Código Megatime</TableCell>
                                            <TableCell>Rubro</TableCell>
                                            <TableCell>Cooperado</TableCell>
                                            <TableCell align="center">Estado</TableCell>
                                            <TableCell>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {temas.map((tema) => (
                                            <TableRow key={tema.id_tema}>
                                                <TableCell>{tema.NombreTema}</TableCell>
                                                <TableCell>{tema.Medios?.NombredelMedio}</TableCell>
                                                <TableCell>{tema.Duracion}</TableCell>
                                                <TableCell>{tema.Calidad?.NombreCalidad}</TableCell>
                                                <TableCell>{tema.color || '-'}</TableCell>
                                                <TableCell>{tema.CodigoMegatime || '-'}</TableCell>
                                                <TableCell>{tema.rubro || '-'}</TableCell>
                                                <TableCell>{tema.cooperado}</TableCell>
                                                <TableCell align="center">
                                                    <Switch
                                                        checked={String(tema.estado) === "true" || tema.estado === "1"}
                                                        onChange={() => handleToggleTemaEstado(tema)}
                                                        color="primary"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton 
                                                        onClick={() => handleEditTema(tema)}
                                                        color="primary"
                                                        title="Editar tema"
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton 
                                                        onClick={() => handleDeleteTema(tema.id_tema)}
                                                        color="error"
                                                        title="Eliminar tema"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        <TabPanel value={tabValue} index={1}>
                            <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>Tema</TableCell>
                                            <TableCell>Contrato</TableCell>
                                            <TableCell>Año</TableCell>
                                            <TableCell>Mes</TableCell>
                                            <TableCell>Campaña</TableCell>
                                            <TableCell>Soporte</TableCell>
                                            <TableCell>Valor Unitario</TableCell>
                                            <TableCell>Total Neto</TableCell>
                                            <TableCell>Total Bruto</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {alternativaData.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{row.id}</TableCell>
                                                <TableCell>{row.Temas?.NombreTema}</TableCell>
                                                <TableCell>{row.Contratos?.NombreContrato}</TableCell>
                                                <TableCell>{row.Anios?.years}</TableCell>
                                                <TableCell>{row.Meses?.Nombre}</TableCell>
                                                <TableCell>{row.Campania?.NombreCampania}</TableCell>
                                                <TableCell>{row.Soportes?.nombreIdentficiador}</TableCell>
                                                <TableCell>{row.valor_unitario?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</TableCell>
                                                <TableCell>{row.total_neto?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</TableCell>
                                                <TableCell>{row.total_bruto?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        <TabPanel value={tabValue} index={2}>
                            <Box sx={{ mb: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={() => setOpenFacturaModal(true)}
                                >
                                    Agregar Factura
                                </Button>
                            </Box>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>Fecha</TableCell>
                                            <TableCell>Razón Social</TableCell>
                                            <TableCell>Monto</TableCell>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Estado</TableCell>
                                            <TableCell>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {facturas.map((factura) => (
                                            <TableRow key={factura.id_factura}>
                                                <TableCell>{factura.id_factura}</TableCell>
                                                <TableCell>{new Date(factura.fecha_factura).toLocaleDateString()}</TableCell>
                                                <TableCell>{factura.RazonSocial}</TableCell>
                                                <TableCell>
                                                    {factura.monto?.toLocaleString('es-CL', { 
                                                        style: 'currency', 
                                                        currency: 'CLP' 
                                                    })}
                                                </TableCell>
                                                <TableCell>{factura.TipodeFactura}</TableCell>
                                                <TableCell>
                                                    <Switch
                                                        checked={factura.estado}
                                                        onChange={() => handleToggleFacturaEstado(factura)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => handleEditFactura(factura)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() => handleDeleteFactura(factura.id_factura)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>
                    </Paper>
                </Grid>
            </Grid>

            <ModalEditarCampana
                open={openEditModal}
                onClose={() => setOpenEditModal(false)}
                onCampanaUpdated={fetchCampanaDetails}
                campanaData={campana}
            />

            <ModalAgregarFactura
                open={openFacturaModal}
                onClose={() => setOpenFacturaModal(false)}
                onFacturaAdded={fetchFacturas}
                idCampania={id}
            />

            <ModalEditarFactura
                open={openEditFacturaModal}
                onClose={() => setOpenEditFacturaModal(false)}
                onFacturaUpdated={fetchFacturas}
                facturaData={selectedFactura}
            />

            <ModalAgregarTema
                open={openTemaModal}
                onClose={() => setOpenTemaModal(false)}
                onTemaAdded={fetchTemas}
                idCampania={id}
            />

            <ModalEditarTema
                open={openEditTemaModal}
                onClose={() => setOpenEditTemaModal(false)}
                onTemaUpdated={fetchTemas}
                temaData={selectedTema}
            />
        </Container>
    );
};

export default ViewCampania;
