import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  Tab,
  Tabs,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Container,
  Breadcrumbs
} from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import { Add as AddIcon } from '@mui/icons-material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import BadgeIcon from '@mui/icons-material/Badge';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import LanguageIcon from '@mui/icons-material/Language';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PercentIcon from '@mui/icons-material/Percent';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InventoryIcon from '@mui/icons-material/Inventory';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NumbersIcon from '@mui/icons-material/Numbers';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';
import './Clientes.css';

// Componente TabPanel
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

const ViewCliente = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [comisiones, setComisiones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [datosFacturacion, setDatosFacturacion] = useState(null);
  const [tiposMoneda, setTiposMoneda] = useState([]);
  const [formatosComision, setFormatosComision] = useState([]);
  const [otrosDatos, setOtrosDatos] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openContactoModal, setOpenContactoModal] = useState(false);
  const [openComisionModal, setOpenComisionModal] = useState(false);
  const [openProductosModal, setOpenProductosModal] = useState(false);
  const [openOtrosDatosModal, setOpenOtrosDatosModal] = useState(false);
  const [contactoForm, setContactoForm] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    cargo: '',
    id_cliente: ''
  });

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [grupos, setGrupos] = useState({});
  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [comunasFiltradas, setComunasFiltradas] = useState([]);
  const [tiposCliente, setTiposCliente] = useState({});
  const [formatos, setFormatos] = useState([]);
  const [errors, setErrors] = useState({
    RUT: '',
    RUT_representante: '',
    telCelular: '',
    telFijo: '',
    RUT_edit: '',
    RUT_representante_edit: '',
    telCelular_edit: '',
    telFijo_edit: ''
  });

  const [newComision, setNewComision] = useState({
    comision: '',
    tipomoneda: '',
    valorComision: '',
    inicioComision: '',
    finComision: ''
  });

  const [editingComision, setEditingComision] = useState(null);

  const tiposComision = [
    'ONLINE %',
    'ONLINE FEE',
    'OFF LINE %',
    'OFF LINE FEE',
    'FEE',
    'COMISION % FEE'
  ];

  const monedasDisponibles = ['UF', 'PESO', 'DOLAR'];

  const fetchClienteData = async () => {
    try {
      setLoading(true);
      const { data: clienteData, error: clienteError } = await supabase
        .from('Clientes')
        .select(`
          *,
          TipoCliente:id_tipoCliente(nombreTipoCliente),
          Region:id_region(nombreRegion),
          Comuna:id_comuna(nombreComuna)
        `)
        .eq('id_cliente', id)
        .single();

      if (clienteError) throw clienteError;

      if (clienteData) {
        setCliente(clienteData);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      setError(error.message);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la información del cliente'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComisiones = async () => {
    try {
      const { data: comisionesData, error } = await supabase
        .from('Comisiones')
        .select('*')
        .eq('id_cliente', id);

      if (error) {
        console.error('Error fetching comisiones:', error);
        throw error;
      }

      setComisiones(comisionesData || []);
    } catch (error) {
      console.error('Error al obtener comisiones:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      if (id) {
        await Promise.all([
          fetchContactos(),
          fetchComisiones(),
          fetchProductos(),
          fetchOtrosDatos()
        ]);
      }
    };
    loadInitialData();
  }, [id]);

  useEffect(() => {
    if (cliente?.id_cliente) {
      setContactoForm(prev => ({
        ...prev,
        id_cliente: cliente.id_cliente
      }));
    }
  }, [cliente]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Actualizar tiposMoneda con los valores estáticos
        setTiposMoneda(['UF', 'PESO', 'DOLAR']);
        
        const { data: clienteData, error: clienteError } = await supabase
          .from('Clientes')
          .select(`
            *,
            TipoCliente:id_tipoCliente(nombreTipoCliente),
            Region:id_region(nombreRegion),
            Comuna:id_comuna(nombreComuna)
          `)
          .eq('id_cliente', id)
          .single();

        if (clienteError) throw clienteError;

        if (clienteData) {
          setCliente(clienteData);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);



  const fetchContactos = async () => {
    try {
      console.log('Buscando contactos para cliente ID:', id);
      
      const { data: contactosData, error } = await supabase
        .from('contactocliente')
        .select('*')
        .eq('id_cliente', id);

      if (error) {
        console.error('Error al obtener contactos:', error);
        throw error;
      }

      console.log('Contactos obtenidos:', contactosData);
      setContactos(contactosData || []);
    } catch (error) {
      console.error('Error en fetchContactos:', error);
      setError(error.message);
    }
  };




  const fetchProductos = async () => {
    try {
      const { data: productosData, error } = await supabase
        .from('Productos')
        .select('*')
        .eq('Id_Cliente', id);

      if (error) {
        console.error('Error fetching productos:', error);
        throw error;
      }

      console.log('Productos received:', productosData);
      setProductos(productosData || []);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setError(error.message);
    }
  };

  const handleAddContacto = async () => {
    try {
      if (!cliente?.id_cliente) {
        throw new Error('ID de cliente no disponible');
      }

      const { error } = await supabase
        .from('contactocliente')
        .insert([{
          ...contactoForm,
          id_cliente: cliente.id_cliente
        }]);

      if (error) {
        console.error('Error adding contact:', error);
        throw error;
      }

      setOpenContactoModal(false);
      setContactoForm({
        nombre: '',
        telefono: '',
        correo: '',
        cargo: '',
        id_cliente: cliente?.id_cliente || ''
      });

      // Actualizar la lista de contactos
      await fetchContactos();

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Contacto agregado correctamente',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleDeleteContacto = async (contactoId) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        // Primero veamos qué datos tenemos
        console.log('Intentando eliminar contacto con ID:', contactoId);

        const { error } = await supabase
          .from('contactocliente')
          .delete()
          .eq('id', contactoId);

        if (error) {
          console.error('Error completo de Supabase:', error);
          throw new Error(`Error al eliminar: ${error.message} (Código: ${error.code})`);
        }

        // Si llegamos aquí, la eliminación fue exitosa
        await fetchContactos();

        await Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Contacto eliminado correctamente',
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      console.error('Error completo:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al eliminar el contacto',
        text: error.message,
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleOpenContactoModal = () => {
    setOpenContactoModal(true);
  };

  const handleCloseContactoModal = () => {
    setOpenContactoModal(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderContactosTable = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Listado de Contactos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenContactoModal}
        >
          Agregar Contacto
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contactos.map((contacto) => (
              <TableRow key={contacto.id}>
                <TableCell>{contacto.nombre || '-'}</TableCell>
                <TableCell>{contacto.telefono || '-'}</TableCell>
                <TableCell>{contacto.correo || '-'}</TableCell>
                <TableCell>{contacto.cargo || '-'}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleDeleteContacto(contacto.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  const renderComisionesTable = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Listado de Comisiones</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenComisionModal(true)}
        >
          Agregar Comisión
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Comisión</TableCell>
              <TableCell>Tipo Comisión</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Término</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comisiones.map((comision) => (
              <TableRow key={comision.id_comision}>
                <TableCell>{comision.comision}</TableCell>
                <TableCell>{comision.tipomoneda}</TableCell>
                <TableCell>{comision.valorComision}</TableCell>
                <TableCell>
                  {new Date(comision.inicioComision).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(comision.finComision).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEditComision(comision)}
                    color="primary"
                  >
                    <OpenInNewIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteComision(comision.id_comision)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  const renderProductosTable = () => (
    <TableContainer component={Paper}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Listado de Productos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenProductosModal(true)}
        >
          Agregar Producto
        </Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre del Producto</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {productos.map((producto) => (
            <TableRow key={producto.id}>
              <TableCell>{producto.NombreDelProducto}</TableCell>
              <TableCell>
                <Switch
                  checked={producto.Estado}
                  onChange={() => handleToggleProductoEstado(producto.id, producto.Estado)}
                  color="primary"
                />
              </TableCell>
              <TableCell align="center">
                <IconButton
                  onClick={() => handleDeleteProducto(producto.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const handleSaveOtroDato = async (datoData) => {
    try {
      if (datoData.id) {
        const { error } = await supabase
          .from('OtrosDatos')
          .update(datoData)
          .eq('id', datoData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('OtrosDatos')
          .insert([{ ...datoData, id_cliente: id }]);
        if (error) throw error;
      }
      setOtrosDatos(prev => [...prev, datoData]);
      handleCloseOtrosDatosModal();
    } catch (error) {
      console.error('Error saving otro dato:', error);
    }
  };

  const handleDeleteOtroDato = async (datoId) => {
    try {
      const { error } = await supabase
        .from('OtrosDatos')
        .delete()
        .eq('id', datoId);
      if (error) throw error;
      setOtrosDatos(prev => prev.filter(dato => dato.id !== datoId));
    } catch (error) {
      console.error('Error deleting otro dato:', error);
    }
  };

  const handleOpenOtrosDatosModal = (item = null) => {
    setOpenOtrosDatosModal(true);
  };

  const handleCloseOtrosDatosModal = () => {
    setOpenOtrosDatosModal(false);
  };

  const handleDeleteComision = async (id_comision) => {
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
          .from('Comisiones')
          .delete()
          .eq('id_comision', id_comision);

        if (error) throw error;

        // Actualizar la tabla inmediatamente
        await fetchComisiones();

        await Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'La comisión ha sido eliminada',
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      console.error('Error al eliminar comisión:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la comisión'
      });
    }
  };

  const handleEditComision = (comision) => {
    setEditingComision(comision);
    setNewComision({
      comision: comision.comision,
      tipomoneda: comision.tipomoneda,
      valorComision: comision.valorComision,
      inicioComision: comision.inicioComision,
      finComision: comision.finComision
    });
    setOpenComisionModal(true);
  };

  const handleOpenComisionModal = () => {
    setOpenComisionModal(true);
  };

  const handleCloseComisionModal = () => {
    setOpenComisionModal(false);
    setEditingComision(null);
    setNewComision({
      comision: '',
      tipomoneda: '',
      valorComision: '',
      inicioComision: '',
      finComision: ''
    });
  };

  const handleComisionInputChange = (event) => {
    const { name, value } = event.target;
    setNewComision(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleComisionSubmit = async () => {
    try {
      // Validar campos requeridos
      const camposFaltantes = [];
      if (!newComision.comision) camposFaltantes.push('Comisión');
      if (!newComision.tipomoneda) camposFaltantes.push('Tipo de Moneda');
      if (!newComision.valorComision) camposFaltantes.push('Valor de Comisión');
      if (!newComision.inicioComision) camposFaltantes.push('Fecha de Inicio');
      if (!newComision.finComision) camposFaltantes.push('Fecha de Término');

      if (camposFaltantes.length > 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Campos Requeridos',
          text: `Por favor complete los siguientes campos: ${camposFaltantes.join(', ')}`
        });
        return;
      }

      // Validar que la fecha de término sea posterior a la fecha de inicio
      if (new Date(newComision.finComision) <= new Date(newComision.inicioComision)) {
        await Swal.fire({
          icon: 'warning',
          title: 'Error en Fechas',
          text: 'La fecha de término debe ser posterior a la fecha de inicio'
        });
        return;
      }

      if (editingComision) {
        // Actualizar comisión existente
        const { error } = await supabase
          .from('Comisiones')
          .update({
            comision: newComision.comision,
            tipomoneda: newComision.tipomoneda,
            valorComision: newComision.valorComision,
            inicioComision: newComision.inicioComision,
            finComision: newComision.finComision
          })
          .eq('id_comision', editingComision.id_comision);

        if (error) throw error;

        await Swal.fire({
          icon: 'success',
          title: 'Comisión actualizada',
          text: 'La comisión se ha actualizado exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Insertar nueva comisión
        const { error } = await supabase
          .from('Comisiones')
          .insert([{
            id_cliente: id,
            comision: newComision.comision,
            tipomoneda: newComision.tipomoneda,
            valorComision: newComision.valorComision,
            inicioComision: newComision.inicioComision,
            finComision: newComision.finComision
          }]);

        if (error) throw error;

        await Swal.fire({
          icon: 'success',
          title: 'Comisión agregada',
          text: 'La comisión se ha agregado exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
      }

      handleCloseComisionModal();
      fetchComisiones();
    } catch (error) {
      console.error('Error al procesar comisión:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo ${editingComision ? 'actualizar' : 'agregar'} la comisión: ${error.message}`
      });
    }
  };

  const handleOpenProductosModal = () => {
    setOpenProductosModal(true);
  };

  const handleCloseProductosModal = () => {
    setOpenProductosModal(false);
  };

  const handleAddProducto = async (productoData) => {
    try {
      const { error } = await supabase
        .from('Productos')
        .insert([{
          ...productoData,
          Id_Cliente: id,
          Estado: true // Por defecto activo
        }]);

      if (error) {
        console.error('Error adding producto:', error);
        throw error;
      }

      // Actualizar la lista de productos
      await fetchProductos();
      setOpenProductosModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Producto agregado correctamente',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleDeleteProducto = async (productoId) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const { error } = await supabase
          .from('Productos')
          .delete()
          .eq('id', productoId);

        if (error) throw error;

        // Actualizar la lista de productos
        await fetchProductos();

        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Producto eliminado correctamente',
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      console.error('Error:', error);
      const mensaje = error.code === '23503' 
        ? 'El producto no se puede eliminar porque está asociado a un plan'
        : 'Error al eliminar el producto';
        
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje
      });
    }
  };

  const handleToggleProductoEstado = async (productoId, estadoActual) => {
    try {
      const { error } = await supabase
        .from('Productos')
        .update({ Estado: !estadoActual })
        .eq('id', productoId);

      if (error) throw error;

      // Actualizar la lista de productos
      await fetchProductos();

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Estado actualizado correctamente',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleOpenEditModal = () => {
    if (cliente) {
      setSelectedClient({
        ...cliente,
        nombreCliente: cliente.nombreCliente || '',
        nombreFantasia: cliente.nombreFantasia || '',
        id_grupo: cliente.id_grupo || null,
        razonSocial: cliente.razonSocial || '',
        id_tipoCliente: cliente.id_tipoCliente || null,
        RUT: cliente.RUT || '',
        id_region: cliente.id_region || null,
        id_comuna: cliente.id_comuna || null,
        estado: cliente.estado || true,
        id_tablaformato: cliente.id_tablaformato || null,
        id_moneda: cliente.id_moneda || null,
        valor: cliente.valor || '',
        giro: cliente.giro || '',
        direccionEmpresa: cliente.direccionEmpresa || '',
        nombreRepresentanteLegal: cliente.nombreRepresentanteLegal || '',
        apellidoRepresentante: cliente.apellidoRepresentante || '',
        RUT_representante: cliente.RUT_representante || '',
        telCelular: cliente.telCelular || '',
        telFijo: cliente.telFijo || '',
        email: cliente.email || '',
        web_cliente: cliente.web_cliente || ''
      });
      setOpenEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedClient(null);
  };

  const validateRutRepresentante = (rut) => {
    if (!rut) return true; // No es obligatorio
    
    // Remover puntos y guión
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    
    // Validar formato
    if (!/^\d{7,8}[0-9Kk]$/.test(rut)) {
      return false;
    }
    
    // Validar dígito verificador
    const rutDigits = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();
    
    let sum = 0;
    let multiplier = 2;
    
    // Calcular suma ponderada
    for (let i = rutDigits.length - 1; i >= 0; i--) {
      sum += parseInt(rutDigits[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    // Calcular dígito verificador esperado
    const expectedDV = 11 - (sum % 11);
    const expectedDVStr = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
    
    return dv === expectedDVStr;
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // No es obligatorio
    // Validar formato de teléfono chileno (puede ser fijo o celular)
    return /^(\+?56|0)?(\s?)(2|9)(\s?)[0-9]{8}$/.test(phone);
  };

  const formatRut = (rut) => {
    if (!rut) return '';
    
    // Remover cualquier caracter que no sea número o K
    rut = rut.replace(/[^\dKk]/g, '');
    
    // Obtener el dígito verificador
    const dv = rut.slice(-1);
    // Obtener el cuerpo del RUT
    const rutBody = rut.slice(0, -1);
    
    // Formatear el cuerpo del RUT con puntos
    let formattedRut = '';
    for (let i = rutBody.length - 1, j = 0; i >= 0; i--, j++) {
      formattedRut = rutBody[i] + formattedRut;
      if (j === 2 && i !== 0) {
        formattedRut = '.' + formattedRut;
      }
      if (j === 5 && i !== 0) {
        formattedRut = '.' + formattedRut;
      }
    }
    
    // Retornar RUT formateado con guión y dígito verificador
    return `${formattedRut}-${dv}`;
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'RUT') {
      const formattedRut = formatRut(value);
      setSelectedClient(prev => ({ ...prev, [name]: formattedRut }));
      
      // Validar RUT del cliente
      if (!validateRutRepresentante(value)) {
        setErrors(prev => ({ ...prev, RUT_edit: 'RUT inválido' }));
      } else {
        setErrors(prev => ({ ...prev, RUT_edit: '' }));
      }
    } else if (name === 'RUT_representante') {
      const formattedRut = formatRut(value);
      setSelectedClient(prev => ({ ...prev, [name]: formattedRut }));
      
      // Validar RUT del representante
      if (!validateRutRepresentante(value)) {
        setErrors(prev => ({ ...prev, RUT_representante_edit: 'RUT del representante inválido' }));
      } else {
        setErrors(prev => ({ ...prev, RUT_representante_edit: '' }));
      }
    } else if (name === 'telCelular') {
      setSelectedClient(prev => ({ ...prev, [name]: value }));
      if (!validatePhoneNumber(value) && value !== '') {
        setErrors(prev => ({ ...prev, telCelular_edit: 'Número de celular inválido' }));
      } else {
        setErrors(prev => ({ ...prev, telCelular_edit: '' }));
      }
    } else if (name === 'telFijo') {
      setSelectedClient(prev => ({ ...prev, [name]: value }));
      if (!validatePhoneNumber(value) && value !== '') {
        setErrors(prev => ({ ...prev, telFijo_edit: 'Número de teléfono fijo inválido' }));
      } else {
        setErrors(prev => ({ ...prev, telFijo_edit: '' }));
      }
    } else {
      setSelectedClient(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async () => {
    // Validar campos antes de enviar
    if (errors.RUT_edit || errors.RUT_representante_edit || errors.telCelular_edit || errors.telFijo_edit) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de Validación',
        text: 'Por favor, corrija los campos inválidos antes de guardar',
      });
      return;
    }
    
    try {
      if (!selectedClient || !selectedClient.id_cliente) {
        throw new Error('No hay cliente seleccionado');
      }

      // Validar campos requeridos
      if (!selectedClient.nombreCliente || !selectedClient.RUT) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Por favor complete los campos obligatorios'
        });
        return;
      }

      // Preparar los datos para la actualización
      const updateData = {
        nombreCliente: selectedClient.nombreCliente,
        nombreFantasia: selectedClient.nombreFantasia || null,
        id_grupo: selectedClient.id_grupo || null,
        razonSocial: selectedClient.razonSocial || null,
        id_tipoCliente: selectedClient.id_tipoCliente || null,
        RUT: selectedClient.RUT,
        id_region: selectedClient.id_region || null,
        id_comuna: selectedClient.id_comuna || null,
        estado: selectedClient.estado,
        id_tablaformato: selectedClient.id_tablaformato || null,
        id_moneda: selectedClient.id_moneda || null,
        valor: selectedClient.valor || '',
        giro: selectedClient.giro || '',
        direccionEmpresa: selectedClient.direccionEmpresa || '',
        nombreRepresentanteLegal: selectedClient.nombreRepresentanteLegal || '',
        apellidoRepresentante: selectedClient.apellidoRepresentante || '',
        RUT_representante: selectedClient.RUT_representante || null,
        telCelular: selectedClient.telCelular || null,
        telFijo: selectedClient.telFijo || null,
        email: selectedClient.email || null,
        web_cliente: selectedClient.web_cliente || null
      };

      // Remover campos con valor vacío
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null || updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      const { error: updateError } = await supabase
        .from('Clientes')
        .update(updateData)
        .eq('id_cliente', selectedClient.id_cliente);

      if (updateError) {
        console.error('Error al actualizar:', updateError);
        throw updateError;
      }

      // Actualizar los datos del cliente
      await fetchClienteData();

      // Primero cerrar el modal
      setOpenEditModal(false);
      setSelectedClient(null);

      // Luego mostrar el mensaje de éxito
      setTimeout(async () => {
        await Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Cliente actualizado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }, 100);

    } catch (error) {
      console.error('Error en handleEditSubmit:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar el cliente'
      });
    }
  };

  // Cargar datos necesarios para el formulario de edición
  useEffect(() => {
    const fetchDatosEdicion = async () => {
      try {
        // Fetch grupos
        const { data: gruposData, error: gruposError } = await supabase
          .from('Grupos')
          .select('*');
        
        if (gruposError) throw gruposError;

        const gruposMap = gruposData.reduce((acc, grupo) => {
          acc[grupo.id_grupo] = grupo.nombre_grupo;
          return acc;
        }, {});

        setGrupos(gruposMap);

        // Fetch regiones
        const { data: regionesData, error: regionesError } = await supabase
          .from('Region')
          .select('*');
        if (regionesError) throw regionesError;
        setRegiones(regionesData);

        // Fetch comunas
        const { data: comunasData, error: comunasError } = await supabase
          .from('Comunas')
          .select('*');
        if (comunasError) throw comunasError;
        setComunas(comunasData);

        // Fetch tipos de cliente
        const { data: tiposClienteData, error: tiposClienteError } = await supabase
          .from('TipoCliente')
          .select('*');
        if (tiposClienteError) throw tiposClienteError;

        const tiposClienteMap = tiposClienteData.reduce((acc, tipo) => {
          acc[tipo.id_tyipoCliente] = tipo;
          return acc;
        }, {});

        setTiposCliente(tiposClienteMap);

        // Fetch formatos
        const { data: formatosData, error: formatosError } = await supabase
          .from('TablaFormato')
          .select('*');
        if (formatosError) throw formatosError;
        setFormatos(formatosData);

      } catch (error) {
        console.error('Error fetching datos edición:', error);
      }
    };

    fetchDatosEdicion();
  }, []);

  // Actualizar comunas filtradas cuando cambia la región
  useEffect(() => {
    if (selectedClient?.id_region) {
      const comunasDeLaRegion = comunas.filter(
        comuna => comuna.id_region === selectedClient.id_region
      );
      setComunasFiltradas(comunasDeLaRegion);
    } else {
      setComunasFiltradas([]);
    }
  }, [selectedClient?.id_region, comunas]);

  useEffect(() => {
    console.log('Estado actual de comisiones:', comisiones);
  }, [comisiones]);

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!cliente) {
    return <div className="not-found">Cliente no encontrado</div>;
  }

  return (
    <Container maxWidth="xl">
      {/* Breadcrumb */}
      <Box sx={{ mb: 3, mt: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link
            to="/clientes"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <GroupIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Clientes
          </Link>
          <Typography
            color="text.primary"
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <PersonIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            {loading ? 'Cargando...' : cliente?.nombreCliente}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
              {cliente?.nombreCliente?.toUpperCase()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registrado el: {new Date(cliente?.created_at).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Representante Legal: {`${cliente?.nombreRepresentanteLegal || ''} ${cliente?.apellidoRepresentante || ''}`}
            </Typography>
          </Paper>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Detalles del Cliente</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<OpenInNewIcon />}
                  onClick={handleOpenEditModal}
                >
                  Editar Cliente
                </Button>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      Nombre Cliente
                    </Typography>
                    <Typography variant="body1">{cliente?.nombreCliente || '-'}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      Nombre de Fantasía
                    </Typography>
                    <Typography variant="body1">{cliente?.nombreFantasia || '-'}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      Razón Social
                    </Typography>
                    <Typography variant="body1">{cliente?.razonSocial || '-'}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      RUT
                    </Typography>
                    <Typography variant="body1">{cliente?.RUT || '-'}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      Giro
                    </Typography>
                    <Typography variant="body1">{cliente?.giro || '-'}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      Grupo
                    </Typography>
                    <Typography variant="body1">{grupos[cliente?.id_grupo] || '-'}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      Representante Legal
                    </Typography>
                    <Typography variant="body1">{`${cliente?.nombreRepresentanteLegal || ''} ${cliente?.apellidoRepresentante || ''}`}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      RUT Representante
                    </Typography>
                    <Typography variant="body1">{cliente?.RUT_representante || '-'}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      Dirección
                    </Typography>
                    <Typography variant="body1">{cliente?.direccionEmpresa || '-'}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{cliente?.email || '-'}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      Teléfono Celular
                    </Typography>
                    <Typography variant="body1">{cliente?.telCelular || '-'}</Typography>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <div className="mb-4">
                    <Typography variant="subtitle2" color="textSecondary">
                      Teléfono Fijo
                    </Typography>
                    <Typography variant="body1">{cliente?.telFijo || '-'}</Typography>
                  </div>
                </Grid>

              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                >
                  <Tab label="Datos Facturación" />
                  <Tab label="Datos de Contacto" />
                  <Tab label="Listado de Comisiones" />
                  <Tab label="Productos" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={3}>
                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Razón Social
                      </Typography>
                      <Typography variant="body1">
                        {cliente?.razonSocial || '-'}
                      </Typography>
                    </div>
                  </Grid>

                  <Grid item xs={3}>
                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        RUT Empresa
                      </Typography>
                      <Typography variant="body1">
                        {cliente?.RUT || '-'}
                      </Typography>
                    </div>
                  </Grid>

                  <Grid item xs={3}>
                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Región
                      </Typography>
                      <Typography variant="body1">
                        {cliente?.Region?.nombreRegion || '-'}
                      </Typography>
                    </div>
                  </Grid>

                  <Grid item xs={3}>
                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Comuna
                      </Typography>
                      <Typography variant="body1">
                        {cliente?.Comuna?.nombreComuna || '-'}
                      </Typography>
                    </div>
                  </Grid>

                  <Grid item xs={3}>
                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Dirección
                      </Typography>
                      <Typography variant="body1">
                        {cliente?.direccionEmpresa || '-'}
                      </Typography>
                    </div>
                  </Grid>

                  <Grid item xs={3}>
                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Facturación
                      </Typography>
                      <Typography variant="body1">
                        {cliente?.TipoCliente?.nombreTipoCliente || 'Directo'}
                      </Typography>
                    </div>
                  </Grid>

                  <Grid item xs={3}>
                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Giro
                      </Typography>
                      <Typography variant="body1">
                        {cliente?.giro || '-'}
                      </Typography>
                    </div>
                  </Grid>

                  <Grid item xs={3}>
                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {cliente?.email || '-'}
                      </Typography>
                    </div>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Listado de Contactos</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenContactoModal}
                    >
                      Agregar Contacto
                    </Button>
                  </Box>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Teléfono</TableCell>
                          <TableCell>Correo</TableCell>
                          <TableCell>Cargo</TableCell>
                          <TableCell>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {contactos.map((contacto) => (
                          <TableRow key={contacto.id}>
                            <TableCell>{contacto.nombre || '-'}</TableCell>
                            <TableCell>{contacto.telefono || '-'}</TableCell>
                            <TableCell>{contacto.correo || '-'}</TableCell>
                            <TableCell>{contacto.cargo || '-'}</TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => handleDeleteContacto(contacto.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                {renderComisionesTable()}
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                {renderProductosTable()}
              </TabPanel>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openComisionModal} onClose={handleCloseComisionModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingComision ? 'Editar Comisión' : 'Agregar Nueva Comisión'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Comisión"
                  name="comision"
                  value={newComision.comision}
                  onChange={handleComisionInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalOfferIcon />
                      </InputAdornment>
                    ),
                  }}
                >
                  {tiposComision.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Tipo Comisión"
                  name="tipomoneda"
                  value={newComision.tipomoneda}
                  onChange={handleComisionInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon />
                      </InputAdornment>
                    ),
                  }}
                >
                  {['UF', 'PESO', 'DOLAR'].map((moneda) => (
                    <MenuItem key={moneda} value={moneda}>
                      {moneda}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Valor"
                  name="valorComision"
                  type="number"
                  value={newComision.valorComision}
                  onChange={handleComisionInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NumbersIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Inicio"
                  name="inicioComision"
                  type="date"
                  value={newComision.inicioComision}
                  onChange={handleComisionInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Término"
                  name="finComision"
                  type="date"
                  value={newComision.finComision}
                  onChange={handleComisionInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseComisionModal}>Cancelar</Button>
          <Button onClick={handleComisionSubmit} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openProductosModal} onClose={handleCloseProductosModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          Agregar Producto
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre del Producto"
              name="NombreDelProducto"
              defaultValue={''}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <InventoryIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductosModal}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              const nombreProducto = document.querySelector('input[name="NombreDelProducto"]').value;
              handleAddProducto({ NombreDelProducto: nombreProducto });
            }}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openContactoModal} onClose={handleCloseContactoModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          Agregar Contacto
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <input
                  type="hidden"
                  name="id_cliente"
                  value={contactoForm.id_cliente}
                />
                <TextField
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={contactoForm.nombre}
                  onChange={(e) => setContactoForm({
                    ...contactoForm,
                    nombre: e.target.value
                  })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={contactoForm.telefono}
                  onChange={(e) => setContactoForm({
                    ...contactoForm,
                    telefono: e.target.value
                  })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Correo"
                  name="correo"
                  type="email"
                  value={contactoForm.correo}
                  onChange={(e) => setContactoForm({
                    ...contactoForm,
                    correo: e.target.value
                  })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cargo"
                  name="cargo"
                  value={contactoForm.cargo}
                  onChange={(e) => setContactoForm({
                    ...contactoForm,
                    cargo: e.target.value
                  })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContactoModal}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddContacto}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditModal} onClose={handleCloseEditModal} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <OpenInNewIcon sx={{ mr: 1 }} />
            Editar Cliente
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate>
            {/* Datos Básicos */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Nombre Cliente"
                    name="nombreCliente"
                    value={selectedClient?.nombreCliente || ''}
                    onChange={handleEditInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Nombre Fantasía"
                    name="nombreFantasia"
                    value={selectedClient?.nombreFantasia || ''}
                    onChange={handleEditInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="vc-grupo-label">Grupo</InputLabel>
                  <Select
                    labelId="vc-grupo-label"
                    label="Grupo"
                    value={selectedClient?.id_grupo || ''}
                    onChange={handleEditInputChange}
                    name="id_grupo"
                    input={
                      <OutlinedInput
                        label="Grupo"
                        startAdornment={
                          <InputAdornment position="start">
                            <GroupIcon />
                          </InputAdornment>
                        }
                      />
                    }
                  >
                    {Object.entries(grupos).map(([id, grupo]) => (
                      <MenuItem key={id} value={id}>
                        {grupo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Razón Social"
                    name="razonSocial"
                    value={selectedClient?.razonSocial || ''}
                    onChange={handleEditInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="vc-tipoCliente-label">Tipo de Cliente</InputLabel>
                  <Select
                    labelId="vc-tipoCliente-label"
                    label="Tipo de Cliente"
                    value={selectedClient?.id_tipoCliente || ''}
                    onChange={handleEditInputChange}
                    name="id_tipoCliente"
                    input={
                      <OutlinedInput
                        label="Tipo de Cliente"
                        startAdornment={
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        }
                      />
                    }
                  >
                    {Object.entries(tiposCliente).map(([id, tipo]) => (
                      <MenuItem key={id} value={id}>
                        {tipo.nombreTipoCliente}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="RUT"
                    name="RUT"
                    value={selectedClient?.RUT || ''}
                    onChange={handleEditInputChange}
                    error={!!errors.RUT_edit}
                    helperText={errors.RUT_edit}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="vc-region-label">Región</InputLabel>
                  <Select
                    labelId="vc-region-label"
                    label="Región"
                    value={selectedClient?.id_region || ''}
                    onChange={handleEditInputChange}
                    name="id_region"
                    input={
                      <OutlinedInput
                        label="Región"
                        startAdornment={
                          <InputAdornment position="start">
                            <LocationOnIcon />
                          </InputAdornment>
                        }
                      />
                    }
                  >
                    {regiones.map((region) => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.nombreRegion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="vc-comuna-label">Comuna</InputLabel>
                  <Select
                    labelId="vc-comuna-label"
                    label="Comuna"
                    value={selectedClient?.id_comuna || ''}
                    onChange={handleEditInputChange}
                    name="id_comuna"
                    input={
                      <OutlinedInput
                        label="Comuna"
                        startAdornment={
                          <InputAdornment position="start">
                            <LocationOnIcon />
                          </InputAdornment>
                        }
                      />
                    }
                  >
                    {comunasFiltradas.map((comuna) => (
                      <MenuItem key={comuna.id_comuna} value={comuna.id_comuna}>
                        {comuna.nombreComuna}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Información de la Empresa */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  Información de la Empresa
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Giro"
                    name="giro"
                    value={selectedClient?.giro || ''}
                    onChange={handleEditInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <StoreIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Dirección de la Empresa"
                    name="direccionEmpresa"
                    value={selectedClient?.direccionEmpresa || ''}
                    onChange={handleEditInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HomeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>

              {/* Información del Representante Legal */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  Información del Representante Legal
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Nombre del Representante Legal"
                    name="nombreRepresentanteLegal"
                    value={selectedClient?.nombreRepresentanteLegal || ''}
                    onChange={handleEditInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Apellido del Representante"
                    name="apellidoRepresentante"
                    value={selectedClient?.apellidoRepresentante || ''}
                    onChange={handleEditInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={12}>
                <FormControl fullWidth>
                  <TextField
                    label="RUT del Representante"
                    name="RUT_representante"
                    value={selectedClient?.RUT_representante || ''}
                    onChange={handleEditInputChange}
                    error={!!errors.RUT_representante_edit}
                    helperText={errors.RUT_representante_edit}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>

              {/* Información de Contacto */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  Información de Contacto
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Teléfono Celular"
                    name="telCelular"
                    value={selectedClient?.telCelular || ''}
                    onChange={handleEditInputChange}
                    error={!!errors.telCelular_edit}
                    helperText={errors.telCelular_edit}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneAndroidIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Teléfono Fijo"
                    name="telFijo"
                    value={selectedClient?.telFijo || ''}
                    onChange={handleEditInputChange}
                    error={!!errors.telFijo_edit}
                    helperText={errors.telFijo_edit}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Email"
                    name="email"
                    value={selectedClient?.email || ''}
                    onChange={handleEditInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Sitio Web"
                    name="web_cliente"
                    value={selectedClient?.web_cliente || ''}
                    onChange={handleEditInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LanguageIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ViewCliente;
