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
    CircularProgress,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../../config/supabase';
import { executeWithRetry } from '../../utils/supabaseHelpers';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import ModalAgregarContrato from './ModalAgregarContrato';
import ModalEditarContrato from './ModalEditarContrato';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Contratos = () => {
    const navigate = useNavigate();
    const [contratos, setContratos] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedContrato, setSelectedContrato] = useState(null);
    const [openClienteModal, setOpenClienteModal] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCliente, setSelectedCliente] = useState(null);


    

    useEffect(() => {
        const shouldPersist = localStorage.getItem('contratos_persist_on_return') === '1';
        const stored = localStorage.getItem('contratos_selected_cliente');
        if (shouldPersist && stored) {
            const cliente = JSON.parse(stored);
            setSelectedCliente(cliente);
            fetchContratos(cliente.id_cliente);
            localStorage.removeItem('contratos_persist_on_return');
        } else {
            setOpenClienteModal(true);
            fetchClientes();
        }
    }, []);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));
            let query = supabase
                .from('Clientes')
                .select('id_cliente, nombreCliente, razonSocial, RUT')
                .order('nombreCliente');

            if (user?.Perfiles?.NombrePerfil === 'Área Planificación' && user?.Grupos?.id_grupo) {
                query = query.eq('id_grupo', user.Grupos.id_grupo);
            }

            const { data, error } = await executeWithRetry(() => query);

            if (error) throw error;
            setClientes(data || []);
        } catch (error) {
            // Ignorar error de transacción abortada (común en hot reload/strict mode)
            if (error.code === '25P02') return;
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los clientes'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchContratos = async (clienteIdParam) => {
        try {
            const clienteId = clienteIdParam ?? selectedCliente?.id_cliente;
            if (!clienteId) {
                setContratos([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            let { data: contratosData, error } = await supabase
                .from('Contratos')
                .select(`
                    *,
                    cliente:Clientes(id_cliente, nombreCliente),
                    proveedor:Proveedores(id_proveedor, nombreProveedor),
                    medio:Medios(id, NombredelMedio)
                `)
                .eq('IdCliente', clienteId)
                .order('NombreContrato');

            if (error) throw error;

            // Fetch manual de FormaDePago para evitar errores de relación
            if (contratosData && contratosData.length > 0) {
                const formaPagoIds = [...new Set(contratosData.map(c => c.id_FormadePago).filter(id => id))];
                
                if (formaPagoIds.length > 0) {
                    const { data: formasPagoData, error: fpError } = await supabase
                        .from('FormaDePago')
                        .select('id, NombreFormadePago')
                        .in('id', formaPagoIds);
                        
                    if (!fpError && formasPagoData) {
                        const formasPagoMap = {};
                        formasPagoData.forEach(fp => {
                            formasPagoMap[fp.id] = fp;
                        });
                        
                        contratosData = contratosData.map(c => ({
                            ...c,
                            formaPago: formasPagoMap[c.id_FormadePago] || null
                        }));
                    }
                }
            }

            setContratos(contratosData || []);
        } catch {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los contratos'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClienteSelect = async (cliente) => {
        try {
            setSelectedCliente(cliente);
            localStorage.setItem('contratos_selected_cliente', JSON.stringify(cliente));
            setOpenClienteModal(false);
            await fetchContratos(cliente.id_cliente);
        } catch {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo seleccionar el cliente'
            });
        }
    };

    const handleDelete = async (id) => {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: "No podrás revertir esta acción",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                const { error } = await supabase
                    .from('Contratos')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                fetchContratos();
                Swal.fire(
                    'Eliminado',
                    'El contrato ha sido eliminado.',
                    'success'
                );
            }
        } catch {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el contrato'
            });
        }
    };

    const handleEdit = (contrato) => {
          // Verificar si el contrato forma parte de una orden creada
          if (contrato.c_orden === true) {
            Swal.fire({
                icon: 'warning',
                title: 'No se puede editar',
                text: 'Este registro no se puede actualizar ya que forma parte de una Orden Creada.',
                confirmButtonColor: '#3085d6',
            });
            return;
        }
        setSelectedContrato(contrato);
        setOpenEditModal(true);
    };

    const handleView = (contrato) => {
        localStorage.setItem('contratos_persist_on_return', '1');
        navigate(`/contratos/view/${contrato.id}`);
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'Vigente':
                return 'success.main';
            case 'Consumido':
                return 'warning.main';
            case 'Anulado':
                return 'error.main';
            default:
                return 'text.primary';
        }
    };

    const filteredContratos = contratos.filter(contrato => {
        const matchesSearch = Object.values({
            id: contrato.id,
            nombreCliente: contrato.cliente?.nombreCliente,
            NombreContrato: contrato.NombreContrato,
            nombreProveedor: contrato.proveedor?.nombreProveedor,
            nombreMedio: contrato.medio?.NombredelMedio,
            formaPago: contrato.formaPago?.NombreFormadePago
        }).join(' ').toLowerCase().includes(searchText.toLowerCase());

        const fechaInicio = new Date(contrato.FechaInicio);
        const matchesDateFrom = !dateFrom || fechaInicio >= new Date(dateFrom);
        const matchesDateTo = !dateTo || fechaInicio <= new Date(dateTo);

        return matchesSearch && matchesDateFrom && matchesDateTo;
    });

    const exportToExcel = () => {
        const dataToExport = contratos.map(contrato => ({
            'ID': contrato.id,
            'Cliente': contrato.cliente?.nombreCliente,
            'Nombre de Contrato': contrato.NombreContrato,
            'Proveedor': contrato.proveedor?.nombreProveedor,
            'Medio': contrato.medio?.NombredelMedio,
            'Forma de Pago': contrato.formaPago?.NombreFormadePago,
            'Tipo de Orden': contrato.tipoOrden?.NombreTipoOrden,
            'Fecha Inicio': new Date(contrato.FechaInicio).toLocaleDateString(),
            'Fecha Fin': new Date(contrato.FechaTermino).toLocaleDateString(),
            'Estado': contrato.Estado ? 'Activo' : 'Inactivo'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contratos');
        XLSX.writeFile(wb, 'Contratos.xlsx');
    };

    if (loading && selectedCliente) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Dialog 
                open={openClienteModal || !selectedCliente}
                maxWidth="md"
                fullWidth
                onClose={() => {
                    setOpenClienteModal(false);
                    navigate('/dashboard');
                }}
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
                            navigate('/dashboard');
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
                    <Typography color="textPrimary">Contratos</Typography>
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
                         InputProps={{
            sx: {
              paddingLeft: '12px'
            }
            }}
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <TextField
                        fullWidth
                        type="date"
                        variant="outlined"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                         InputProps={{
            sx: {
              paddingLeft: '12px'
            }
            }}
                    />
                </Grid>
                <Grid item xs={12} sm={4} container justifyContent="flex-end" spacing={1}>
                    <Grid item>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => {
                                setSelectedCliente(null);
                                localStorage.removeItem('contratos_selected_cliente');
                                setContratos([]);
                                setOpenClienteModal(true);
                                fetchClientes();
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
                            Nuevo Contrato
                        </Button>
                    </Grid>
                </Grid>
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>

                            <TableCell>Nombre de Contrato</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Proveedor</TableCell>
                            <TableCell>Medio</TableCell>
                            <TableCell>Forma de Pago</TableCell>
                            <TableCell>Fecha Inicio</TableCell>
                            <TableCell>Fecha Fin</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredContratos.map((contrato) => (
                            <TableRow key={contrato.id}>
                                <TableCell>{contrato.NombreContrato}</TableCell>
                                <TableCell>{contrato.cliente?.nombreCliente}</TableCell>
                                <TableCell>{contrato.proveedor?.nombreProveedor}</TableCell>
                                <TableCell>{contrato.medio?.NombredelMedio}</TableCell>
                                <TableCell>{contrato.formaPago?.NombreFormadePago}</TableCell>
                                <TableCell>{new Date(contrato.FechaInicio).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
                                <TableCell>{new Date(contrato.FechaTermino).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
                                <TableCell>
                                    <Box
                                        sx={{
                                            color: getEstadoColor(contrato.Estado),
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {contrato.Estado}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <div className="action-buttons">
                                        <IconButton
                                            className="view-button"
                                            size="small"
                                            onClick={() => handleView(contrato)}
                                        >
                                            <i className="fas fa-eye"></i>
                                        </IconButton>
                                        <IconButton
                                            className="edit-button"
                                            size="small"
                                            onClick={() => handleEdit(contrato)}
                                        >
                                            <i className="fas fa-edit"></i>
                                        </IconButton>
                                        <IconButton
                                            className="delete-button"
                                            size="small"
                                            onClick={() => handleDelete(contrato.id)}
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

            <ModalAgregarContrato 
                open={openModal}
                onClose={() => setOpenModal(false)}
                onContratoAdded={fetchContratos}
                clienteId={selectedCliente?.id_cliente}
                clienteNombre={selectedCliente?.nombreCliente}
                disableClienteSelect={!!selectedCliente}
            />

            <ModalEditarContrato 
                open={openEditModal} 
                onClose={() => setOpenEditModal(false)} 
                contrato={selectedContrato} 
                onContratoUpdated={fetchContratos}
                clienteId={selectedCliente?.id_cliente}
                clienteNombre={selectedCliente?.nombreCliente}
                disableClienteSelect={!!selectedCliente}
            />
            </Container>
        </>
    );
};

export default Contratos;
