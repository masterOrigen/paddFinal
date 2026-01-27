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
    InputAdornment,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';

const ModalAgregarCampana = ({ open, onClose, onCampanaAdded, clienteId, clienteNombre, disableClienteSelect }) => {
    const initialFormData = {
        NombreCampania: '',
        Anio: '',
        id_Cliente: clienteId || '',
        Id_Agencia: '',
        id_Producto: '',
        Presupuesto: '',
    };

    const [formData, setFormData] = useState(initialFormData);

    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [agencias, setAgencias] = useState([]);
    const [productos, setProductos] = useState([]);
    const [anios, setAnios] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);

    useEffect(() => {
        if (open) {
            fetchData();
            if (clienteId) {
                setFormData(prev => ({
                    ...prev,
                    id_Cliente: clienteId
                }));
            }
        }
    }, [open, clienteId]);

    useEffect(() => {
        if (formData.id_Cliente) {
            setProductosFiltrados(
                productos.filter(producto => producto.Id_Cliente === formData.id_Cliente)
            );
        } else {
            setProductosFiltrados([]);
        }
    }, [formData.id_Cliente, productos]);

    const fetchData = async () => {
        try {
            // Fetch Clientes solo si no está deshabilitado
            if (!disableClienteSelect) {
                const user = JSON.parse(localStorage.getItem('user'));
                let query = supabase
                    .from('Clientes')
                    .select('id_cliente, nombreCliente');

                if (user?.Perfiles?.NombrePerfil === 'Área Planificación' && user?.Grupos?.id_grupo) {
                    query = query.eq('id_grupo', user.Grupos.id_grupo);
                }

                const { data: clientesData, error: clientesError } = await query;
                if (clientesError) throw clientesError;
                setClientes(clientesData);
            }

            // Fetch Agencias
            const { data: agenciasData, error: agenciasError } = await supabase
                .from('Agencias')
                .select('id, NombreIdentificador')
                .eq('estado', true);
            if (agenciasError) throw agenciasError;
            setAgencias(agenciasData);

            // Fetch Productos
            const { data: productosData, error: productosError } = await supabase
                .from('Productos')
                .select('id, NombreDelProducto, Id_Cliente');
            if (productosError) throw productosError;
            setProductos(productosData);

            // Fetch Años
            const { data: aniosData, error: aniosError } = await supabase
                .from('Anios')
                .select('id, years');
            if (aniosError) throw aniosError;
            const currentYear = new Date().getFullYear();
            setAnios((aniosData || []).filter(a => Number(a.years) >= currentYear));

        } catch (error) {
            console.error('Error al cargar datos:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los datos'
            });
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        
        if (name === 'Presupuesto') {
            // Remover puntos y permitir solo números
            const cleanValue = value.replace(/\./g, '');
            setFormData(prev => ({
                ...prev,
                [name]: cleanValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Si se cambia el cliente, resetear el producto
        if (name === 'id_Cliente') {
            setFormData(prev => ({
                ...prev,
                id_Producto: ''
            }));
        }
    };

    // Función para formatear el número con separación de miles
    const formatearNumero = (numero) => {
        if (!numero) return '';
        return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const selectedYear = anios.find(a => a.id === formData.Anio)?.years;
            const currentYear = new Date().getFullYear();
            if (!selectedYear || Number(selectedYear) < currentYear) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Año inválido',
                    text: 'No se puede seleccionar un año inferior al actual'
                });
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from('Campania')
                .insert([
                    {
                        NombreCampania: formData.NombreCampania,
                        Anio: formData.Anio,
                        id_Cliente: formData.id_Cliente,
                        Id_Agencia: formData.Id_Agencia,
                        id_Producto: formData.id_Producto,
                        Presupuesto: parseFloat(formData.Presupuesto),
                        estado: true,
                        fechaCreacion: new Date().toISOString()
                    }
                ])
                .select();

            if (error) throw error;

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Campaña agregada correctamente'
            });

            setFormData(initialFormData);
            onCampanaAdded();
            onClose();
        } catch (error) {
            console.error('Error al agregar campaña:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo agregar la campaña'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Agregar Campaña
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
                                label="Nombre Campaña"
                                name="NombreCampania"
                                value={formData.NombreCampania}
                                onChange={handleChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EditIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Año"
                                name="Anio"
                                value={formData.Anio}
                                onChange={handleChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarTodayIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                {anios.map((anio) => (
                                    <MenuItem key={anio.id} value={anio.id}>
                                        {anio.years}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Cliente"
                                name="id_Cliente"
                                value={formData.id_Cliente}
                                onChange={handleChange}
                                required
                                margin="normal"
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
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Agencia"
                                name="Id_Agencia"
                                value={formData.Id_Agencia}
                                onChange={handleChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <StorefrontIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                {agencias.map((agencia) => (
                                    <MenuItem key={agencia.id} value={agencia.id}>
                                        {agencia.NombreIdentificador}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Producto"
                                name="id_Producto"
                                value={formData.id_Producto}
                                onChange={handleChange}
                                required
                                margin="normal"
                                disabled={!formData.id_Cliente}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CategoryIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                {productosFiltrados.map((producto) => (
                                    <MenuItem key={producto.id} value={producto.id}>
                                        {producto.NombreDelProducto}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Presupuesto"
                                name="Presupuesto"
                                type="text"
                                value={formatearNumero(formData.Presupuesto)}
                                onChange={handleChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">$</InputAdornment>
                                    ),
                                }}
                            />
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

export default ModalAgregarCampana;
