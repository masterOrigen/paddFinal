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
    const [medios, setMedios] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [tiposOrden, setTiposOrden] = useState([]);

    useEffect(() => {
        if (contrato) {
            console.log('Contrato recibido:', contrato); // Para debugging
            setFormData({
                NombreContrato: contrato.NombreContrato || '',
                IdCliente: clienteId || contrato.IdCliente || '',
                IdProveedor: contrato.IdProveedor || '',
                IdMedios: contrato.IdMedios || '',
                FechaInicio: contrato.FechaInicio ? contrato.FechaInicio.split('T')[0] : '',
                FechaTermino: contrato.FechaTermino ? contrato.FechaTermino.split('T')[0] : '',
                Estado: contrato.Estado || 'Vigente',
                id_FormadePago: contrato.id_FormadePago || '',
                id_GeneraracionOrdenTipo: contrato.id_GeneraracionOrdenTipo || ''
            });
        }
    }, [contrato, clienteId]);

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
    };

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
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CategoryIcon />
                                    </InputAdornment>
                                ),
                            }}
                        >
                            {medios.map((medio) => (
                                <MenuItem key={medio.id} value={medio.id}>
                                    {medio.NombredelMedio}
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
