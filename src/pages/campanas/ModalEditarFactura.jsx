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
    InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CircleIcon from '@mui/icons-material/Circle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';

const ModalEditarFactura = ({ open, onClose, onFacturaUpdated, facturaData }) => {
    const [formData, setFormData] = useState({
        fecha_factura: '',
        RazonSocial: '',
        monto: '',
        estado: true,
        TipodeFactura: 'Venta'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (facturaData) {
            setFormData({
                fecha_factura: facturaData.fecha_factura,
                RazonSocial: facturaData.RazonSocial,
                monto: facturaData.monto,
                estado: facturaData.estado,
                TipodeFactura: facturaData.TipodeFactura
            });
        }
    }, [facturaData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('Facturas')
                .update({
                    fecha_factura: formData.fecha_factura,
                    RazonSocial: formData.RazonSocial,
                    monto: parseInt(formData.monto),
                    estado: formData.estado,
                    TipodeFactura: formData.TipodeFactura
                })
                .eq('id_factura', facturaData.id_factura);

            if (error) throw error;

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Factura actualizada correctamente'
            });

            onFacturaUpdated();
            onClose();
        } catch (error) {
            console.error('Error al actualizar factura:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar la factura'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Editar Factura
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
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Fecha de Factura"
                                name="fecha_factura"
                                type="date"
                                value={formData.fecha_factura}
                                onChange={handleChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarTodayIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Razón Social"
                                name="RazonSocial"
                                value={formData.RazonSocial}
                                onChange={handleChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <BusinessIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Monto"
                                name="monto"
                                type="number"
                                value={formData.monto}
                                onChange={handleChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AttachMoneyIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Estado"
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CircleIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                <MenuItem value={true}>Activo</MenuItem>
                                <MenuItem value={false}>Inactivo</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Tipo de Factura"
                                name="TipodeFactura"
                                value={formData.TipodeFactura}
                                onChange={handleChange}
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <ReceiptIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                <MenuItem value="Venta">Venta</MenuItem>
                                <MenuItem value="Compra">Compra</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ModalEditarFactura;
