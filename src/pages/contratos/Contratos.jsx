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
    CircularProgress,
    Box
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../../config/supabase';
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


    

    useEffect(() => {
        fetchContratos();
    }, []);

    const fetchContratos = async () => {
        setLoading(true);
        try {
            let { data: contratosData, error } = await supabase
                .from('Contratos')
                .select(`
                    *,
                    cliente:Clientes(id_cliente, nombreCliente),
                    proveedor:Proveedores(id_proveedor, nombreProveedor),
                    medio:Medios(id, NombredelMedio),
                    formaPago:FormaDePago(id, NombreFormadePago),
                    tipoOrden:TipoGeneracionDeOrden(id, NombreTipoOrden),
                    c_orden
                `);

            if (error) throw error;
            setContratos(contratosData || []);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los contratos'
            });
        } finally {
            setLoading(false);
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
        } catch (error) {
            console.error('Error al eliminar:', error);
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
          // Asegurarse de que todos los datos necesarios estén disponibles
          console.log("Contrato seleccionado para editar:", contrato);

        setSelectedContrato(contrato);
        setOpenEditModal(true);
    };

    const handleView = (contrato) => {
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
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
                                <TableCell>{new Date(contrato.FechaInicio).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(contrato.FechaTermino).toLocaleDateString()}</TableCell>
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
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        onClick={() => handleView(contrato)}
                                    >
                                        <i className="fas fa-eye"></i>
                                    </IconButton>
                                    <IconButton
                                        color="success"
                                        size="small"
                                        onClick={() => handleEdit(contrato)}
                                    >
                                        <i className="fas fa-edit"></i>
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        size="small"
                                        onClick={() => handleDelete(contrato.id)}
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </IconButton>
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
            />

<ModalEditarContrato 
        open={openEditModal} 
        onClose={() => setOpenEditModal(false)} 
        contrato={selectedContrato} 
        onContratoUpdated={fetchContratos} 
    />
        </Container>
    );
};

export default Contratos;
