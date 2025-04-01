import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    IconButton,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CategoryIcon from '@mui/icons-material/Category';
import EventIcon from '@mui/icons-material/Event';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CircleIcon from '@mui/icons-material/Circle';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';

const ModalAgregarContrato = ({ open, onClose, onContratoAdded, clienteId, clienteNombre, disableClienteSelect }) => {
    const initialFormData = {
        NombreContrato: '',
        IdCliente: clienteId || '', // Usar el clienteId proporcionado
        IdProveedor: '',
        IdMedios: '',
        FechaInicio: '',
        FechaTermino: '',
        Estado: 'Vigente',
        id_FormadePago: '',
        id_GeneraracionOrdenTipo: ''
    };

    const estadosContrato = [
        { value: 'Vigente', label: 'Vigente' },
        { value: 'Consumido', label: 'Consumido' },
        { value: 'Anulado', label: 'Anulado' }
    ];

    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [medios, setMedios] = useState([]);
    const [mediosFiltrados, setMediosFiltrados] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [formasPago, setFormasPago] = useState([]);
    const [tiposOrden, setTiposOrden] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            try {
                // Solo cargar clientes si no está deshabilitada la selección
                if (!disableClienteSelect) {
                    const { data: clientesData, error: clientesError } = await supabase
                        .from('Clientes')
                        .select('id_cliente, nombreCliente')
                        .eq('estado', true);
                    if (clientesError) throw clientesError;
                    setClientes(clientesData);
                }

                const [proveedoresResponse, formasPagoResponse, tiposOrdenResponse] = await Promise.all([
                    supabase.from('Proveedores')
                        .select('id_proveedor, nombreProveedor')
                        .eq('estado', true),
                    supabase.from('FormaDePago')
                        .select('id, NombreFormadePago'),
                    supabase.from('TipoGeneracionDeOrden')
                        .select('id, NombreTipoOrden')
                ]);

                if (proveedoresResponse.error) throw new Error('Error al cargar proveedores: ' + proveedoresResponse.error.message);
                if (formasPagoResponse.error) throw new Error('Error al cargar formas de pago: ' + formasPagoResponse.error.message);
                if (tiposOrdenResponse.error) throw new Error('Error al cargar tipos de orden: ' + tiposOrdenResponse.error.message);

                setProveedores(proveedoresResponse.data || []);
                setFormasPago(formasPagoResponse.data || []);
                setTiposOrden(tiposOrdenResponse.data || []);

            } catch (error) {
                console.error('Error al cargar datos:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al cargar los datos'
                });
            } finally {
                setLoadingData(false);
            }
        };

        if (open) {
            fetchData();
            // Si tenemos un clienteId, establecerlo en el formulario
            if (clienteId) {
                setFormData(prev => ({
                    ...prev,
                    IdCliente: clienteId
                }));
            }
        }
    }, [open, clienteId, disableClienteSelect]);

    useEffect(() => {
        if (formData.IdProveedor) {
            fetchMediosByProveedor(parseInt(formData.IdProveedor));
        } else {
            setMediosFiltrados([]);
        }
    }, [formData.IdProveedor]);

    const fetchMediosByProveedor = async (proveedorId) => {
        try {
            if (!proveedorId) {
                setMediosFiltrados([]);
                return;
            }

            // Primero obtenemos los soportes del proveedor
            const { data: soportesData, error: soportesError } = await supabase
                .from('proveedor_soporte')
                .select('id_soporte')
                .eq('id_proveedor', proveedorId);

            if (soportesError) throw soportesError;

            if (!soportesData || soportesData.length === 0) {
                console.log('No hay soportes asociados a este proveedor');
                setMediosFiltrados([]);
                return;
            }

            // Filtramos cualquier id_soporte que sea null
            const soporteIds = soportesData
                .map(s => s.id_soporte)
                .filter(id => id != null);

            if (soporteIds.length === 0) {
                console.log('No hay soportes válidos asociados a este proveedor');
                setMediosFiltrados([]);
                return;
            }

            // Obtenemos los medios asociados a estos soportes
            const { data: mediosData, error: mediosError } = await supabase
                .from('soporte_medios')
                .select(`
                    id_medio,
                    Medios!inner (
                        id,
                        NombredelMedio,
                        Estado
                    )
                `)
                .in('id_soporte', soporteIds);

            if (mediosError) throw mediosError;

            // Transformamos los datos para tener un formato más simple y filtramos por Estado
            const mediosProcesados = mediosData
                .filter(item => item.Medios && item.Medios.Estado) // Solo medios activos
                .map(item => ({
                    id: item.Medios.id,
                    NombredelMedio: item.Medios.NombredelMedio
                }))
                .filter((medio, index, self) => // Eliminamos duplicados
                    index === self.findIndex((m) => m.id === medio.id)
                );

            setMediosFiltrados(mediosProcesados);
            
            if (mediosProcesados.length === 0) {
                console.log('No hay medios activos asociados a los soportes de este proveedor');
            }
        } catch (error) {
            console.error('Error al cargar medios:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los medios'
            });
            setMediosFiltrados([]);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'IdProveedor') {
            setFormData(prev => ({
                ...prev,
                IdMedios: '' // Resetear el id del medio
            }));
        }
    };

    const handleSubmit = async () => {
        const camposRequeridos = [
            'NombreContrato',
            'IdCliente',
            'IdProveedor',
            'IdMedios',
            'FechaInicio',
            'FechaTermino',
            'id_FormadePago',
            'id_GeneraracionOrdenTipo'
        ];

        const camposFaltantes = camposRequeridos.filter(campo => !formData[campo]);

        if (camposFaltantes.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor complete todos los campos requeridos'
            });
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase
                .from('Contratos')
                .insert([formData]);

            if (error) throw error;

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Contrato agregado correctamente'
            });

            onContratoAdded();
            handleClose();
        } catch (error) {
            console.error('Error al guardar contrato:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar el contrato'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData(initialFormData);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Agregar Nuevo Contrato
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {loadingData ? (
                    <Grid container justifyContent="center" sx={{ py: 3 }}>
                        <CircularProgress />
                    </Grid>
                ) : (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre del Contrato"
                                name="NombreContrato"
                                value={formData.NombreContrato}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <DriveFileRenameOutlineIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Cliente"
                                value={formData.IdCliente}
                                onChange={handleChange}
                                name="IdCliente"
                                disabled={disableClienteSelect}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <BusinessIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                {disableClienteSelect ? (
                                    <MenuItem value={clienteId}>{clienteNombre}</MenuItem>
                                ) : (
                                    clientes.map((cliente) => (
                                        <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                                            {cliente.nombreCliente}
                                        </MenuItem>
                                    ))
                                )}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Proveedor"
                                name="IdProveedor"
                                value={formData.IdProveedor}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <StorefrontIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                {proveedores.map((proveedor) => (
                                    <MenuItem key={proveedor.id_proveedor} value={proveedor.id_proveedor}>
                                        {proveedor.nombreProveedor}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Medio"
                                name="IdMedios"
                                value={formData.IdMedios}
                                onChange={handleChange}
                                disabled={!formData.IdProveedor || loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CategoryIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                {mediosFiltrados.length > 0 ? (
                                    mediosFiltrados.map((medio) => (
                                        <MenuItem key={medio.id} value={medio.id}>
                                            {medio.NombredelMedio}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        No existen medios asociados
                                    </MenuItem>
                                )}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Tipo de Orden"
                                name="id_GeneraracionOrdenTipo"
                                value={formData.id_GeneraracionOrdenTipo}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <ReceiptIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                {tiposOrden.map((tipo) => (
                                    <MenuItem key={tipo.id} value={tipo.id}>
                                        {tipo.NombreTipoOrden}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Forma de Pago"
                                name="id_FormadePago"
                                value={formData.id_FormadePago}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PaymentIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                {formasPago.map((forma) => (
                                    <MenuItem key={forma.id} value={forma.id}>
                                        {forma.NombreFormadePago}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Fecha de Inicio"
                                type="date"
                                name="FechaInicio"
                                value={formData.FechaInicio}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EventIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Fecha de Término"
                                type="date"
                                name="FechaTermino"
                                value={formData.FechaTermino}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EventIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Estado"
                                name="Estado"
                                value={formData.Estado}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CircleIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                {estadosContrato.map((estado) => (
                                    <MenuItem key={estado.value} value={estado.value}>
                                        {estado.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary" 
                    disabled={loading || loadingData}
                >
                    {loading ? <CircularProgress size={24} /> : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalAgregarContrato;
