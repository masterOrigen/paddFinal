import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
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

const ModalEditarContrato = ({ open, onClose, contrato, onContratoUpdated, clienteId, clienteNombre, disableClienteSelect }) => {
    const [formData, setFormData] = useState({
        NombreContrato: '',
        IdCliente: '',
        IdProveedor: '',
        IdMedios: '',
        FechaInicio: '',
        FechaTermino: '',
        Estado: '',
        id_FormadePago: '',
        id_GeneraracionOrdenTipo: ''
    });

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
    const [medios, setMedios] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [tiposOrden, setTiposOrden] = useState([]);
    useEffect(() => {
        if (contrato && open) {
            console.log('Contrato recibido:', contrato); // Para debugging
            
            // Asegurarse de que todos los campos estén correctamente mapeados
            setFormData({
                NombreContrato: contrato.NombreContrato || '',
                IdCliente: clienteId || contrato.IdCliente || '',
                IdProveedor: contrato.IdProveedor || '',
                IdMedios: contrato.IdMedios || '',
                FechaInicio: contrato.FechaInicio ? new Date(contrato.FechaInicio).toISOString().split('T')[0] : '',
                FechaTermino: contrato.FechaTermino ? new Date(contrato.FechaTermino).toISOString().split('T')[0] : '',
                Estado: contrato.Estado || 'Vigente',
                id_FormadePago: contrato.id_FormadePago || '',
                id_GeneraracionOrdenTipo: contrato.id_GeneraracionOrdenTipo || ''
            });
            
            // Añadir un log para verificar que formData se está actualizando
            console.log('FormData actualizado:', {
                NombreContrato: contrato.NombreContrato || '',
                IdCliente: clienteId || contrato.IdCliente || '',
                IdProveedor: contrato.IdProveedor || '',
                IdMedios: contrato.IdMedios || '',
                FechaInicio: contrato.FechaInicio ? new Date(contrato.FechaInicio).toISOString().split('T')[0] : '',
                FechaTermino: contrato.FechaTermino ? new Date(contrato.FechaTermino).toISOString().split('T')[0] : '',
                Estado: contrato.Estado || 'Vigente',
                id_FormadePago: contrato.id_FormadePago || '',
                id_GeneraracionOrdenTipo: contrato.id_GeneraracionOrdenTipo || ''
            });
        }
    }, [contrato, clienteId, open]);

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

                const [proveedoresResponse, mediosResponse, formasPagoResponse, tiposOrdenResponse] = await Promise.all([
                    supabase.from('Proveedores')
                        .select('id_proveedor, nombreProveedor')
                        .eq('estado', true),
                    supabase.from('Medios')
                        .select('id, NombredelMedio'),
                    supabase.from('FormaDePago')
                        .select('id, NombreFormadePago'),
                    supabase.from('TipoGeneracionDeOrden')
                        .select('id, NombreTipoOrden')
                ]);

                if (proveedoresResponse.error) throw proveedoresResponse.error;
                if (mediosResponse.error) throw mediosResponse.error;
                if (formasPagoResponse.error) throw formasPagoResponse.error;
                if (tiposOrdenResponse.error) throw tiposOrdenResponse.error;

                setProveedores(proveedoresResponse.data || []);
                setMedios(mediosResponse.data || []);
                setFormasPago(formasPagoResponse.data || []);
                setTiposOrden(tiposOrdenResponse.data || []);

            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al cargar los datos'
                });
            } finally {
                setLoadingData(false);
            }
        };

        if (open) {
            fetchData();
        }
    }, [open, disableClienteSelect]);
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
            
            // Si el proveedor actual no está en la lista filtrada, resetear el valor
            if (formData.IdProveedor && !proveedoresProcesados.some(p => p.id_proveedor === formData.IdProveedor)) {
                setFormData(prev => ({
                    ...prev,
                    IdProveedor: ''
                }));
            }
            
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('Contratos')
                .update({
                    NombreContrato: formData.NombreContrato,
                    IdCliente: formData.IdCliente,
                    IdProveedor: formData.IdProveedor,
                    IdMedios: formData.IdMedios,
                    FechaInicio: formData.FechaInicio,
                    FechaTermino: formData.FechaTermino,
                    Estado: formData.Estado,
                    id_FormadePago: formData.id_FormadePago,
                    id_GeneraracionOrdenTipo: formData.id_GeneraracionOrdenTipo
                })
                .eq('id', contrato.id);
    
            if (error) throw error;
    
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Contrato actualizado correctamente'
            });
    
            onContratoUpdated();
            onClose(); // Añadir esta línea para cerrar el modal después de actualizar
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al actualizar el contrato'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Si cambia el medio, resetear el proveedor
        if (name === 'IdMedios') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                IdProveedor: ''
            }));
        }
    };
     // Añadir justo antes del return
     console.log('Rendering with formData:', formData);
     if (loadingData) {
         return (
             <Grid container justifyContent="center" sx={{ py: 3 }}>
                 <CircularProgress />
             </Grid>
         );
     }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Editar Contrato
                <IconButton
                    aria-label="close"
                    onClick={onClose}
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
                            select
                            fullWidth
                            label="Cliente"
                            name="IdCliente"
                            value={formData.IdCliente}
                            onChange={handleChange}
                            disabled={loading || disableClienteSelect}
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
                      <Grid item xs={12}>
                        <TextField
                            select
                            fullWidth
                            label="Medio"
                            name="IdMedios"
                            value={formData.IdMedios}
                            onChange={handleChange}
                            disabled={loading}
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
                    <Grid item xs={12}>
                        <TextField
                            select
                            fullWidth
                            label="Proveedor"
                            name="IdProveedor"
                            value={formData.IdProveedor}
                            onChange={handleChange}
                            disabled={loading || !formData.IdMedios}
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
                            <MenuItem value="Vigente">Vigente</MenuItem>
                            <MenuItem value="Consumido">Consumido</MenuItem>
                            <MenuItem value="Anulado">Anulado</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary" 
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalEditarContrato;
