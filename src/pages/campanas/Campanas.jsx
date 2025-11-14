import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
    Container,
    IconButton,
    TextField,
    Grid,
    InputAdornment,
    Breadcrumbs,
    Link,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import ModalAgregarCampana from './ModalAgregarCampana';
import ModalEditarCampana from './ModalEditarCampana';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Campanas.css';

const Campanas = () => {
    const navigate = useNavigate();
    const [campanas, setCampanas] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedCampana, setSelectedCampana] = useState(null);
    const [openClienteModal, setOpenClienteModal] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCliente, setSelectedCliente] = useState(null);

    useEffect(() => {
        const shouldPersist = localStorage.getItem('campanas_persist_on_return') === '1';
        const stored = localStorage.getItem('campanas_selected_cliente');
        if (shouldPersist && stored) {
            const cliente = JSON.parse(stored);
            setSelectedCliente(cliente);
            fetchCampanas(cliente.id_cliente);
            localStorage.removeItem('campanas_persist_on_return');
        } else {
            setOpenClienteModal(true);
            fetchClientes();
        }
    }, []);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('Clientes')
                .select('id_cliente, nombreCliente, razonSocial, RUT')
                .order('nombreCliente');

            if (error) throw error;
            setClientes(data || []);
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los clientes'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCampanas = async (clienteIdParam) => {
        try {
            const clienteId = clienteIdParam ?? selectedCliente?.id_cliente;
            if (!clienteId) {
                setCampanas([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            const { data, error } = await supabase
                .from('Campania')
                .select(`
                    *,
                    c_orden,
                    Clientes!id_Cliente (
                        id_cliente,
                        nombreCliente
                    ),
                    Productos!id_Producto (
                        id,
                        NombreDelProducto,
                        Id_Cliente
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
                .eq('id_Cliente', clienteId)
                .order('NombreCampania');

            if (error) throw error;
            setCampanas(data || []);
        } catch (error) {
            console.error('Error al obtener campañas:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las campañas'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClienteSelect = async (cliente) => {
        try {
            setSelectedCliente(cliente);
            localStorage.setItem('campanas_selected_cliente', JSON.stringify(cliente));
            setOpenClienteModal(false);
            await fetchCampanas(cliente.id_cliente);
        } catch (error) {
            console.error('Error al seleccionar cliente:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await Swal.fire({
                title: '¿Estás seguro?',
                text: "No podrás revertir esta acción",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const { error } = await supabase
                        .from('Campania')
                        .delete()
                        .eq('id_campania', id);

                    if (error) throw error;

                    fetchCampanas();
                    Swal.fire(
                        'Eliminado',
                        'La campaña ha sido eliminada.',
                        'success'
                    );
                }
            });
        } catch (error) {
            console.error('Error al eliminar campaña:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar la campaña'
            });
        }
    };

    const handleEdit = (campana) => {
              // Verificar si la campaña forma parte de una orden creada
              if (campana.c_orden === true) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No se puede editar',
                    text: 'Este registro no se puede actualizar ya que forma parte de una Orden Creada.',
                    confirmButtonColor: '#3085d6',
                });
                return;
            }
        // Preparar los datos de la campaña para el modal
        const campanaParaEditar = {
            id_campania: campana.id_campania,
            NombreCampania: campana.NombreCampania,
            Anio: campana.Anio,
            id_Cliente: campana.id_Cliente,
            Id_Agencia: campana.Id_Agencia,
            id_Producto: campana.id_Producto,
            Presupuesto: campana.Presupuesto,
            estado: campana.estado,
            // Incluir los datos relacionados
            Clientes: campana.Clientes,
            Productos: campana.Productos,
            Anios: campana.Anios,
            Agencias: campana.Agencias
        };
        
        setSelectedCampana(campanaParaEditar);
        setOpenEditModal(true);
    };

    const handleView = (campana) => {
        localStorage.setItem('campanas_persist_on_return', '1');
        navigate(`/campanas/${campana.id_campania}`);
    };

    const handleToggleEstado = async (campana) => {
        const nuevoEstado = !campana.estado;
        const accion = nuevoEstado ? 'activar' : 'desactivar';
        
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: `¿Deseas ${accion} esta campaña?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, confirmar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                const { error } = await supabase
                    .from('Campania')
                    .update({ estado: nuevoEstado })
                    .eq('id_campania', campana.id_campania);

                if (error) throw error;

                await fetchCampanas();
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Actualizado!',
                    text: `La campaña ha sido ${accion}da exitosamente`,
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cambiar el estado de la campaña'
            });
        }
    };

    const filteredCampanas = campanas.filter(campana => {
        const matchesSearch = Object.values({
            id_campania: campana.id_campania,
            nombreCliente: campana.Clientes?.nombreCliente,
            NombreCampania: campana.NombreCampania,
            nombreAgencia: campana.Agencias?.NombreIdentificador,
            NombreDelProducto: campana.Productos?.NombreDelProducto,
            years: campana.Anios?.years
        }).join(' ').toLowerCase().includes(searchText.toLowerCase());

        const fechaCreacion = new Date(campana.fechaCreacion);
        const matchesDateFrom = !dateFrom || fechaCreacion >= new Date(dateFrom);
        const matchesDateTo = !dateTo || fechaCreacion <= new Date(dateTo);

        return matchesSearch && matchesDateFrom && matchesDateTo;
    });

    const exportToExcel = () => {
        const dataToExport = campanas.map(campana => ({
            'ID': campana.id_campania,
            'Cliente': campana.Clientes?.nombreCliente,
            'Nombre Campaña': campana.NombreCampania,
            'Agencia': campana.Agencias?.NombreIdentificador,
            'Producto': campana.Productos?.NombreDelProducto,
            'Año': campana.Anios?.years,
            'Presupuesto': campana.Presupuesto,
            'Fecha Creación': new Date(campana.fechaCreacion).toLocaleDateString(),
            'Estado': campana.estado ? 'Activo' : 'Inactivo'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Campañas');
        XLSX.writeFile(wb, 'Campañas.xlsx');
    };

    if (loading && selectedCliente) {
        return <div>Cargando...</div>;
    }

    return (
        <>
            <Dialog 
                open={openClienteModal || !selectedCliente}
                maxWidth="md"
                fullWidth
                disableEscapeKeyDown
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Seleccionar Cliente</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ mt: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                    {loading ? (
                        <Box display="flex" justifyContent="center" m={3}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer component={Paper} sx={{ mt: 2 }}>
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
                                    {clientes
                                        .filter(cliente =>
                                            cliente.nombreCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (cliente.razonSocial || '').toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((cliente) => (
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
                <DialogActions>
                    <Button 
                        variant="outlined"
                        onClick={() => {
                            setOpenClienteModal(false);
                        }}
                    >
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            <Container maxWidth="xl">
                <div style={{ marginBottom: '20px', marginTop: '20px' }}>
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                        <Link component={RouterLink} to="/dashboard" color="inherit">
                            Inicio
                        </Link>
                        <Typography color="textPrimary">Campañas</Typography>
                    </Breadcrumbs>
                </div>

            <Grid container spacing={3} style={{ marginBottom: '20px' }}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <TextField
                        fullWidth
                        type="date"
                        variant="outlined"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <TextField
                        fullWidth
                        type="date"
                        variant="outlined"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={4} container justifyContent="flex-end" spacing={1}>
                    <Grid item>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => {
                                setSelectedCliente(null);
                                localStorage.removeItem('campanas_selected_cliente');
                                setCampanas([]);
                                setOpenClienteModal(true);
                            }}
                        >
                            Cambiar cliente
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<FileDownloadIcon />}
                            onClick={exportToExcel}
                        >
                            Exportar
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenModal(true)}
                        >
                            Nueva Campaña
                        </Button>
                    </Grid>
                </Grid>
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                          
                            <TableCell>Cliente</TableCell>
                            <TableCell>Nombre de campaña</TableCell>
                            <TableCell>Agencia</TableCell>
                            <TableCell>Producto</TableCell>
                            <TableCell>Año</TableCell>
                            <TableCell>Presupuesto</TableCell>
                            <TableCell>Fecha de Creación</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCampanas.map((campana) => (
                            <TableRow key={campana.id_campania}>
                                
                                <TableCell>{campana.Clientes?.nombreCliente}</TableCell>
                                <TableCell>{campana.NombreCampania}</TableCell>
                                <TableCell>{campana.Agencias?.NombreIdentificador}</TableCell>
                                <TableCell>{campana.Productos?.NombreDelProducto}</TableCell>
                                <TableCell>{campana.Anios?.years}</TableCell>
                                <TableCell>{campana.Presupuesto?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</TableCell>
                                <TableCell>{new Date(campana.fechaCreacion).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Switch
                                        checked={campana.estado}
                                        onChange={() => handleToggleEstado(campana)}
                                        color="primary"
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="action-buttons">
                                        <IconButton
                                            className="view-button"
                                            size="small"
                                            onClick={() => handleView(campana)}
                                        >
                                            <i className="fas fa-eye"></i>
                                        </IconButton>
                                        <IconButton
                                            className="edit-button"
                                            size="small"
                                            onClick={() => handleEdit(campana)}
                                        >
                                            <i className="fas fa-edit"></i>
                                        </IconButton>
                                        <IconButton
                                            className="delete-button"
                                            size="small"
                                            onClick={() => handleDelete(campana.id_campania)}
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </IconButton>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <ModalAgregarCampana 
                open={openModal}
                onClose={() => setOpenModal(false)}
                onCampanaAdded={fetchCampanas}
            />

            <ModalEditarCampana
                open={openEditModal}
                onClose={() => {
                    setOpenEditModal(false);
                    setSelectedCampana(null);
                }}
                onCampanaUpdated={fetchCampanas}
                campanaData={selectedCampana}
            />
            </Container>
        </>
    );
};

export default Campanas;
