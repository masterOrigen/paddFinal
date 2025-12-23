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
    const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
    const [medios, setMedios] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [formasPago, setFormasPago] = useState([]);
    const [tiposOrden, setTiposOrden] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            try {
                // Solo cargar clientes si no está deshabilitada la selección
                if (!disableClienteSelect) {
                    const user = JSON.parse(localStorage.getItem('user'));
                    let query = supabase
                        .from('Clientes')
                        .select('id_cliente, nombreCliente')
                        .eq('estado', true);

                    if (user?.Perfiles?.NombrePerfil === 'Área Planificación' && user?.Grupos?.id_grupo) {
                        query = query.eq('id_grupo', user.Grupos.id_grupo);
                    }

                    const { data: clientesData, error: clientesError } = await query;
                    if (clientesError) throw clientesError;
                    setClientes(clientesData);
                }

                const [proveedoresResponse, mediosResponse, formasPagoResponse, tiposOrdenResponse] = await Promise.all([
                    supabase.from('Proveedores')
                        .select('id_proveedor, nombreProveedor')
                        .eq('estado', true),
                    supabase.from('Medios')
                        .select('id, NombredelMedio')
                        .eq('Estado', true),
                    supabase.from('FormaDePago')
                        .select('id, NombreFormadePago'),
                    supabase.from('TipoGeneracionDeOrden')
                        .select('id, NombreTipoOrden')
                ]);

                if (proveedoresResponse.error) throw new Error('Error al cargar proveedores: ' + proveedoresResponse.error.message);
                if (mediosResponse.error) throw new Error('Error al cargar medios: ' + mediosResponse.error.message);
                if (formasPagoResponse.error) throw new Error('Error al cargar formas de pago: ' + formasPagoResponse.error.message);
                if (tiposOrdenResponse.error) throw new Error('Error al cargar tipos de orden: ' + tiposOrdenResponse.error.message);

                setProveedores(proveedoresResponse.data || []);
                setMedios(mediosResponse.data || []);
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
        if (formData.IdMedios) {
            fetchProveedoresByMedio(parseInt(formData.IdMedios));
        } else {
            setProveedoresFiltrados([]);
        }
    }, [formData.IdMedios]);

    const fetchProveedoresByMedio = async (medioId) => {
        try {
            if (!medioId) {
                setProveedoresFiltrados([]);
                return;
            }

            // Primero obtenemos los soportes asociados al medio
            const { data: soporteMediosData, error: soporteMediosError } = await supabase
                .from('soporte_medios')
                .select('id_soporte')
                .eq('id_medio', medioId);

            if (soporteMediosError) throw soporteMediosError;

            if (!soporteMediosData || soporteMediosData.length === 0) {
                console.log('No hay soportes asociados a este medio');
                setProveedoresFiltrados([]);
                return;
            }

            // Filtramos cualquier id_soporte que sea null
            const soporteIds = soporteMediosData
                .map(s => s.id_soporte)
                .filter(id => id != null);

            if (soporteIds.length === 0) {
                console.log('No hay soportes válidos asociados a este medio');
                setProveedoresFiltrados([]);
                return;
            }

            // Obtenemos los proveedores asociados a estos soportes
            const { data: proveedorSoporteData, error: proveedorSoporteError } = await supabase
                .from('proveedor_soporte')
                .select(`
                    id_proveedor,
                    Proveedores!inner (
                        id_proveedor,
                        nombreProveedor,
                        estado
                    )
                `)
                .in('id_soporte', soporteIds);

            if (proveedorSoporteError) throw proveedorSoporteError;

            // Transformamos los datos para tener un formato más simple y filtramos por estado
            const proveedoresProcesados = proveedorSoporteData
                .filter(item => item.Proveedores && item.Proveedores.estado) // Solo proveedores activos
                .map(item => ({
                    id_proveedor: item.Proveedores.id_proveedor,
                    nombreProveedor: item.Proveedores.nombreProveedor
                }))
                .filter((proveedor, index, self) => // Eliminamos duplicados
                    index === self.findIndex((p) => p.id_proveedor === proveedor.id_proveedor)
                );

            setProveedoresFiltrados(proveedoresProcesados);
            
            if (proveedoresProcesados.length === 0) {
                console.log('No hay proveedores activos asociados a los soportes de este medio');
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los proveedores'
            });
            setProveedoresFiltrados([]);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Si cambia el medio, resetear el proveedor
        if (name === 'IdMedios') {
            setFormData(prev => ({
                ...prev,
                IdProveedor: ''
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

            // Ajustar fechas para evitar problemas de zona horaria (agregar T12:00:00)
            const contratoData = {
                ...formData,
                FechaInicio: formData.FechaInicio ? `${formData.FechaInicio}T12:00:00` : null,
                FechaTermino: formData.FechaTermino ? `${formData.FechaTermino}T12:00:00` : null
            };

            const { error } = await supabase
                .from('Contratos')
                .insert([contratoData]);

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
                        {/* Primero seleccionar el Medio */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Medio"
                                name="IdMedios"
                                value={formData.IdMedios}
                                onChange={handleChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CategoryIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                <MenuItem value="">Seleccionar Medio</MenuItem>
                                {medios.map((medio) => (
                                    <MenuItem key={medio.id} value={medio.id}>
                                        {medio.NombredelMedio}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Luego seleccionar el Proveedor filtrado por el Medio */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Proveedor"
                                name="IdProveedor"
                                value={formData.IdProveedor}
                                onChange={handleChange}
                                required
                                disabled={!formData.IdMedios}
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <StorefrontIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                <MenuItem value="">Seleccionar Proveedor</MenuItem>
                                {proveedoresFiltrados.map((proveedor) => (
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
