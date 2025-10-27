import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Button, 
  Container,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem, 
  InputAdornment,
  Breadcrumbs,
  Link,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Switch
 } from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import BadgeIcon from '@mui/icons-material/Badge';
import CategoryIcon from '@mui/icons-material/Category';
import NumbersIcon from '@mui/icons-material/Numbers';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ApartmentIcon from '@mui/icons-material/Apartment';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PhoneIcon from '@mui/icons-material/Phone';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { supabase } from '../../config/supabase';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import './Clientes.css';

const Clientes = () => {
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tiposCliente, setTiposCliente] = useState({});
  const [regiones, setRegiones] = useState({});
  const [comunas, setComunas] = useState({});
  const [grupos, setGrupos] = useState({});
  const [comunasFiltradas, setComunasFiltradas] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClient, setNewClient] = useState({
    nombreCliente: '',
    nombreFantasia: '',
    grupo: '',
    razonSocial: '',
    id_tipoCliente: '',
    RUT: '',
    id_region: '',
    id_comuna: '',
    estado: true,
    giro: '',
    direccionEmpresa: '',
    nombreRepresentanteLegal: '',
    apellidoRepresentante: '',
    RUT_representante: '',
    telCelular: '',
    telFijo: '',
    email: '',
    web_cliente: ''
  });

  const [errors, setErrors] = useState({
    RUT_representante: '',
    telCelular: '',
    telFijo: '',
    RUT_representante_edit: '',
    telCelular_edit: '',
    telFijo_edit: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, startDate, endDate, rows]);

  useEffect(() => {
    if (selectedClient?.id_region) {
      const comunasDeRegion = Object.entries(comunas)
        .filter(([_, comuna]) => comuna.id_region === parseInt(selectedClient.id_region))
        .reduce((acc, [id, comuna]) => {
          acc[id] = comuna.nombreComuna;
          return acc;
        }, {});
      
      setComunasFiltradas(comunasDeRegion);
      
      // Si la comuna actual no pertenece a la región seleccionada, la limpiamos
      if (selectedClient.id_comuna && !comunasDeRegion[selectedClient.id_comuna]) {
        setSelectedClient(prev => ({ ...prev, id_comuna: '' }));
      }
    } else {
      setComunasFiltradas({});
    }
  }, [selectedClient?.id_region, comunas]);

  useEffect(() => {
    const cargarComunas = async () => {
      if (selectedClient?.id_region) {
        try {
          const { data: comunasData, error: comunasError } = await supabase
            .from('Comunas')
            .select('*')
            .eq('id_region', selectedClient.id_region);

          if (comunasError) throw comunasError;

          if (comunasData && comunasData.length > 0) {
            const comunasObj = comunasData.reduce((acc, comuna) => {
              acc[comuna.id_comuna] = comuna;
              return acc;
            }, {});
            
            setComunasFiltradas(comunasObj);
          }
        } catch (error) {
          console.error('Error al cargar comunas:', error);
        }
      }
    };

    cargarComunas();
  }, [selectedClient?.id_region]);

  const filterData = () => {
    let filtered = [...rows];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(row => 
        row.nombreCliente?.toLowerCase().includes(searchTermLower) ||
        row.nombreFantasia?.toLowerCase().includes(searchTermLower) ||
        row.razonSocial?.toLowerCase().includes(searchTermLower) ||
        row.rutEmpresa?.toLowerCase().includes(searchTermLower) ||
        row.grupo?.toLowerCase().includes(searchTermLower)
      );
    }

    // Filtrar por rango de fechas
    if (startDate || endDate) {
      filtered = filtered.filter(row => {
        const clientDate = new Date(row._created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && !end) {
          return clientDate >= start;
        }
        if (!start && end) {
          return clientDate <= end;
        }
        if (start && end) {
          return clientDate >= start && clientDate <= end;
        }
        return true;
      });
    }

    setFilteredRows(filtered);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const exportToExcel = () => {
    const dataToExport = filteredRows.map(row => ({

      'ID': row.id,
      'Fecha de Ingreso': row.fechaIngreso,
      'Nombre Cliente': row.nombreCliente,
      'Nombre de Fantasía': row.nombreFantasia,
      'Grupo': row.grupo,
      'Razón Social': row.razonSocial,
      'Tipo de Cliente': row.tipoCliente,
      'RUT': row.rutEmpresa,
      'Región': row.region,
      'Comuna': row.comuna,
      'Estado': row.estado ? 'Activo' : 'Inactivo'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    const colWidths = [
      { wch: 10 }, // ID
      { wch: 15 }, // Fecha
      { wch: 30 }, // Nombre
      { wch: 30 }, // Fantasía
      { wch: 20 }, // Grupo
      { wch: 30 }, // Razón Social
      { wch: 20 }, // Tipo
      { wch: 15 }, // RUT
      { wch: 25 }, // Región
      { wch: 20 }, // Comuna
      { wch: 10 }  // Estado
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    
    const fileName = searchTerm || startDate || endDate ? 
      'Clientes_Filtrados.xlsx' : 
      'Todos_Los_Clientes.xlsx';
    
    XLSX.writeFile(wb, fileName);
  };

  const fetchData = async () => {
    try {
      const [
        { data: clientesData, error: clientesError },
        { data: tiposClienteData, error: tiposClienteError },
        { data: regionesData, error: regionesError },
        { data: comunasData, error: comunasError },
        { data: gruposData, error: gruposError }
      ] = await Promise.all([
        supabase.from('Clientes').select('*'),
        supabase.from('TipoCliente').select('*'),
        supabase.from('Region').select('*'),
        supabase.from('Comunas').select('*'),
        supabase.from('Grupos').select('*')
      ]);

      if (clientesError) throw clientesError;
      if (tiposClienteError) throw tiposClienteError;
      if (regionesError) throw regionesError;
      if (comunasError) throw comunasError;
      if (gruposError) throw gruposError;

      const tiposClienteMap = tiposClienteData.reduce((acc, tipo) => {
        acc[tipo.id_tyipoCliente] = tipo;
        return acc;
      }, {});

      const regionesMap = regionesData.reduce((acc, region) => {
        acc[region.id] = region.nombreRegion;
        return acc;
      }, {});

      const gruposMap = gruposData.reduce((acc, grupo) => {
        acc[grupo.id_grupo] = grupo.nombre_grupo;
        return acc;
      }, {});

      const comunasMap = comunasData.reduce((acc, comuna) => {
        acc[comuna.id_comuna] = {
          nombreComuna: comuna.nombreComuna,
          id_region: comuna.id_region
        };
        return acc;
      }, {});

      const transformedData = clientesData.map(cliente => ({
        id: cliente.id_cliente,
        id_cliente: cliente.id_cliente,
        _created_at: cliente.created_at,
        fechaIngreso: new Date(cliente.created_at).toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        nombreCliente: cliente.nombreCliente,
        nombreFantasia: cliente.nombreFantasia,
        grupo: gruposMap[cliente.id_grupo] || 'No especificado',
        id_grupo: cliente.id_grupo,
        razonSocial: cliente.razonSocial,
        tipoCliente: tiposClienteMap[cliente.id_tipoCliente]?.nombreTipoCliente || 'No especificado',
        rutEmpresa: cliente.RUT,
        region: regionesMap[cliente.id_region] || 'No especificada',
        comuna: comunasMap[cliente.id_comuna]?.nombreComuna || 'No especificada',
        estado: cliente.estado
      }));

      setRows(transformedData);
      setFilteredRows(transformedData);
      setTiposCliente(tiposClienteMap);
      setRegiones(regionesMap);
      setComunas(comunasMap);
      setGrupos(gruposMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewClient({
      nombreCliente: '',
      nombreFantasia: '',
      grupo: '',
      razonSocial: '',
      id_tipoCliente: '',
      RUT: '',
      id_region: '',
      id_comuna: '',
      estado: true,
      giro: '',
      direccionEmpresa: '',
      nombreRepresentanteLegal: '',
      apellidoRepresentante: '',
      RUT_representante: '',
      telCelular: '',
      telFijo: '',
      email: '',
      web_cliente: ''
    });
  };

  const handleOpenEditModal = async (client) => {
    try {
      console.log('Client data recibida:', client);

      // Obtener los datos completos del cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('Clientes')
        .select('*')
        .eq('id_cliente', client.id_cliente)
        .single();

      if (clienteError) throw clienteError;

      console.log('Cliente data completa:', clienteData);

      // Establecer los datos del cliente
      const clienteToSet = {
        ...clienteData,
        id_cliente: clienteData.id_cliente,
        nombreCliente: clienteData.nombreCliente || '',
        nombreFantasia: clienteData.nombreFantasia || '',
        grupo: clienteData.grupo || '',
        id_grupo: clienteData.id_grupo || '',
        razonSocial: clienteData.razonSocial || '',
        id_tipoCliente: clienteData.id_tipoCliente || '',
        RUT: clienteData.RUT || '',
        id_region: clienteData.id_region || '',
        id_comuna: clienteData.id_comuna || '',
        estado: clienteData.estado,
        giro: clienteData.giro || '',
        direccionEmpresa: clienteData.direccionEmpresa || '',
        nombreRepresentanteLegal: clienteData.nombreRepresentanteLegal || '',
        apellidoRepresentante: clienteData.apellidoRepresentante || '',
        RUT_representante: clienteData.RUT_representante || '',
        telCelular: clienteData.telCelular || '',
        telFijo: clienteData.telFijo || '',
        email: clienteData.email || '',
        web_cliente: clienteData.web_cliente || ''
      };

      console.log('Cliente a establecer:', clienteToSet);
      setSelectedClient(clienteToSet);
      setOpenEditModal(true);

    } catch (error) {
      console.error('Error al cargar datos para edición:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los datos para edición'
      });
    }
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedClient(null);
  };

  const handleEditInputChange = async (event) => {
    const { name, value } = event.target;
    setSelectedClient(prev => ({ ...prev, [name]: value }));
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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    
    if (name === 'RUT_representante') {
      const formattedRut = formatRut(value);
      setNewClient(prev => ({ ...prev, [name]: formattedRut }));
      
      // Validar RUT del representante
      if (!validateRutRepresentante(value)) {
        setErrors(prev => ({ ...prev, RUT_representante: 'RUT del representante inválido' }));
      } else {
        setErrors(prev => ({ ...prev, RUT_representante: '' }));
      }
    } else if (name === 'telCelular') {
      setNewClient(prev => ({ ...prev, [name]: value }));
      if (!validatePhoneNumber(value) && value !== '') {
        setErrors(prev => ({ ...prev, telCelular: 'Número de celular inválido' }));
      } else {
        setErrors(prev => ({ ...prev, telCelular: '' }));
      }
    } else if (name === 'telFijo') {
      setNewClient(prev => ({ ...prev, [name]: value }));
      if (!validatePhoneNumber(value) && value !== '') {
        setErrors(prev => ({ ...prev, telFijo: 'Número de teléfono fijo inválido' }));
      } else {
        setErrors(prev => ({ ...prev, telFijo: '' }));
      }
    } else {
      setNewClient(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (errors.RUT_representante || errors.telCelular || errors.telFijo) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de Validación',
        text: 'Por favor, ingrese información válida',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('Clientes')
        .insert([{
          nombreCliente: newClient.nombreCliente,
          nombreFantasia: newClient.nombreFantasia,
          grupo: newClient.grupo,
          razonSocial: newClient.razonSocial,
          id_tipoCliente: newClient.id_tipoCliente,
          RUT: newClient.RUT,
          id_region: newClient.id_region,
          id_comuna: newClient.id_comuna,
          estado: newClient.estado,
          giro: newClient.giro,
          direccionEmpresa: newClient.direccionEmpresa,
          nombreRepresentanteLegal: newClient.nombreRepresentanteLegal,
          apellidoRepresentante: newClient.apellidoRepresentante,
          RUT_representante: newClient.RUT_representante,
          telCelular: newClient.telCelular,
          telFijo: newClient.telFijo,
          email: newClient.email,
          web_cliente: newClient.web_cliente
        }]);

      if (error) throw error;

      fetchData(); // Refresh the data
      handleCloseModal();
      
      await Swal.fire({
        icon: 'success',
        title: '¡Cliente Agregado!',
        text: 'El cliente ha sido agregado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error adding client:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agregar el cliente'
      });
    }
  };

  const handleEditSubmit = async () => {
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
        giro: selectedClient.giro || null,
        direccionEmpresa: selectedClient.direccionEmpresa || null,
        nombreRepresentanteLegal: selectedClient.nombreRepresentanteLegal || null,
        apellidoRepresentante: selectedClient.apellidoRepresentante || null,
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

      // Actualizar la tabla
      const { data: updatedClient, error: fetchError } = await supabase
        .from('Clientes')
        .select('*')
        .eq('id_cliente', selectedClient.id_cliente)
        .single();

      if (fetchError) throw fetchError;

      // Actualizar el estado local
      setRows(prevRows => 
        prevRows.map(row => 
          row.id_cliente === selectedClient.id_cliente 
            ? {
                ...row,
                ...updatedClient,
                grupo: grupos[updatedClient.id_grupo] || 'No especificado',
                region: regiones[updatedClient.id_region] || 'No especificada',
                comuna: comunas[updatedClient.id_comuna]?.nombreComuna || 'No especificada'
              }
            : row
        )
      );

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
        text: 'No se pudo actualizar el cliente'
      });
    }
  };

  const handleEstadoChange = async (clienteId, newValue) => {
    try {
      const { error } = await supabase
        .from('Clientes')
        .update({ estado: newValue })
        .eq('id_cliente', clienteId);

      if (error) throw error;

      // Actualizar el estado local
      setRows(rows.map(cliente => 
        cliente.id_cliente === clienteId ? { ...cliente, estado: newValue } : cliente
      ));

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: 'Estado Actualizado',
        text: `El estado ha sido ${newValue ? 'activado' : 'desactivado'} exitosamente`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al actualizar estado:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado'
      });
    }
  };

  const columns = [
    {
      field: 'fechaIngreso',
      headerName: 'Fecha de Ingreso',
      width: 110,
      headerClassName: 'data-grid-header',
    },
    { 
      field: 'nombreCliente', 
      headerName: 'Nombre Cliente', 
      width: 130,
      headerClassName: 'data-grid-header',
      flex: 1,
    },
    { 
      field: 'nombreFantasia', 
      headerName: 'Nombre de Fantasía', 
      width: 130,
      headerClassName: 'data-grid-header',
      flex: 1,
    },
    { 
      field: 'grupo', 
      headerName: 'Grupo', 
      width: 100,
      headerClassName: 'data-grid-header',
    },
    { 
      field: 'razonSocial', 
      headerName: 'Razón Social', 
      width: 130,
      headerClassName: 'data-grid-header',
      flex: 1,
    },
    { 
      field: 'tipoCliente', 
      headerName: 'Tipo de Cliente', 
      width: 110,
      headerClassName: 'data-grid-header',
    },
    { 
      field: 'rutEmpresa', 
      headerName: 'Rut Empresa', 
      width: 100,
      headerClassName: 'data-grid-header',
    },
    { 
      field: 'region', 
      headerName: 'Región', 
      width: 150,
      headerClassName: 'data-grid-header',
      flex: 1,
    },
    { 
      field: 'comuna', 
      headerName: 'Comuna', 
      width: 100,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 80,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => handleEstadoChange(params.row.id_cliente, e.target.checked)}
          size="small"
          color="primary"
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#6777ef',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#6777ef',
            },
          }}
        />
      ),
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      renderCell: (params) => {
        console.log('Row data:', params.row); // Para debug
        return (
          <div className="action-buttons">
            <IconButton 
              size="small" 
              className="view-button"
              component={RouterLink}
              to={`/clientes/view/${params.row.id_cliente}`}
            >
              <i className="fas fa-eye"></i>
            </IconButton>
            <IconButton 
              size="small" 
              className="edit-button"
              onClick={() => handleOpenEditModal(params.row)}
            >
              <i className="fas fa-edit"></i>
            </IconButton>
          </div>
        );
      },
    },
  ];

  return (
    <div className="clientes-container">
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ 
          my: 2,
          '& .MuiBreadcrumbs-separator': {
            mx: 1
          },
          '& .MuiLink-root': {
            color: 'text.secondary',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }
        }}
      >
        <Link component={RouterLink} to="/dashboard">
          Home
        </Link>
        <Typography color="text.primary">Clientes</Typography>
      </Breadcrumbs>

      <div className="header">
        <div className="header-content">
          <h2 ClassName="titleone">Listado de Clientes</h2>
          <Button 
            variant="contained" 
            className="btn-agregar"
            startIcon={<i className="fas fa-plus"></i>}
            onClick={handleOpenModal}
          >
            Agregar Cliente
          </Button>
        </div>
      </div>

        <Grid container spacing={3} style={{ marginBottom: '20px' }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#6777ef' }}/>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#6777ef',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6777ef',
                  },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="date"
              variant="outlined"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
                sx: { color: '#666' }
              }}
              InputProps={{
                sx: {
                  paddingLeft: '12px'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#6777ef',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6777ef',
                  },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="date"
              variant="outlined"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
                sx: { color: '#666' }
              }}
              InputProps={{
                sx: {
                  paddingLeft: '12px'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#6777ef',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6777ef',
                  },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              onClick={exportToExcel}
              startIcon={<FileDownloadIcon />}
              sx={{
              backgroundColor: '#206e43',
              color: '#fff',
              height: '40px',
              width: '70%',
              '&:hover': {
                backgroundColor: '#185735',
              },
              }}
            >
              Exportar Clientes
            </Button>
          </Grid>
        </Grid>

      <div className="data-grid-container">
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSize={pageSize}
          loading={loading}
          disableSelectionOnClick
          autoHeight
          localeText={{
            noRowsLabel: 'No hay datos para mostrar',
            footerRowSelected: count => `${count} fila${count !== 1 ? 's' : ''} seleccionada${count !== 1 ? 's' : ''}`,
            footerTotalRows: 'Filas totales:',
            footerTotalVisibleRows: (visibleCount, totalCount) => 
              `${visibleCount.toLocaleString()} de ${totalCount.toLocaleString()}`,
            footerPaginationRowsPerPage: 'Filas por página:',
            columnMenuLabel: 'Menú',
            columnMenuShowColumns: 'Mostrar columnas',
            columnMenuFilter: 'Filtrar',
            columnMenuHideColumn: 'Ocultar',
            columnMenuUnsort: 'Desordenar',
            columnMenuSortAsc: 'Ordenar ASC',
            columnMenuSortDesc: 'Ordenar DESC',
            columnHeaderSortIconLabel: 'Ordenar',
            MuiTablePagination: {
              labelRowsPerPage: 'Filas por página:',
              labelDisplayedRows: ({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`,
            },
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 }
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        />
      </div>

      {/* Modal para agregar cliente */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="nombreCliente"
                label="Nombre Cliente"
                value={newClient.nombreCliente}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="nombreFantasia"
                label="Nombre Fantasía"
                value={newClient.nombreFantasia}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="add-grupo-label">Grupo</InputLabel>
                <Select
                  labelId="add-grupo-label"
                  label="Grupo"
                  name="id_grupo"
                  value={newClient.id_grupo}
                  onChange={handleInputChange}
                  input={
                    <OutlinedInput
                      label="Grupo"
                      startAdornment={
                        <InputAdornment position="start">
                          <GroupsIcon />
                        </InputAdornment>
                      }
                    />
                  }
                >
                  {Object.entries(grupos).map(([id, nombre]) => (
                    <MenuItem key={id} value={id}>{nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="razonSocial"
                label="Razón Social"
                value={newClient.razonSocial}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="add-tipoCliente-label">Tipo de Cliente</InputLabel>
                <Select
                  labelId="add-tipoCliente-label"
                  label="Tipo de Cliente"
                  name="id_tipoCliente"
                  value={newClient.id_tipoCliente}
                  onChange={handleInputChange}
                  input={
                    <OutlinedInput
                      label="Tipo de Cliente"
                      startAdornment={
                        <InputAdornment position="start">
                          <CategoryIcon />
                        </InputAdornment>
                      }
                    />
                  }
                >
                  {Object.entries(tiposCliente).map(([id, tipo]) => (
                    <MenuItem key={id} value={id}>{tipo.nombreTipoCliente}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="RUT"
                label="RUT"
                value={newClient.RUT}
                onChange={handleInputChange}
                fullWidth
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
              <FormControl fullWidth variant="outlined">
                <InputLabel id="add-region-label">Región</InputLabel>
                <Select
                  labelId="add-region-label"
                  label="Región"
                  name="id_region"
                  value={newClient.id_region}
                  onChange={handleInputChange}
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
                  {Object.entries(regiones).map(([id, nombre]) => (
                    <MenuItem key={id} value={id}>{nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="add-comuna-label">Comuna</InputLabel>
                <Select
                  labelId="add-comuna-label"
                  label="Comuna"
                  name="id_comuna"
                  value={newClient.id_comuna}
                  onChange={handleInputChange}
                  input={
                    <OutlinedInput
                      label="Comuna"
                      startAdornment={
                        <InputAdornment position="start">
                          <ApartmentIcon />
                        </InputAdornment>
                      }
                    />
                  }
                >
                  {newClient.id_region
                    ? Object.entries(comunas)
                        .filter(([_, comuna]) => comuna.id_region === parseInt(newClient.id_region))
                        .map(([id, comuna]) => (
                          <MenuItem key={id} value={id}>{comuna.nombreComuna}</MenuItem>
                        ))
                    : <MenuItem disabled>Seleccione una región primero</MenuItem>
                  }
                </Select>
              </FormControl>
            </Grid>
          

            {/* Información de la Empresa */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Información de la Empresa
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="giro"
                label="Giro"
                value={newClient.giro}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <StorefrontIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="direccionEmpresa"
                label="Dirección de la Empresa"
                value={newClient.direccionEmpresa}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeWorkIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Información del Representante Legal */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Información del Representante Legal
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="nombreRepresentanteLegal"
                label="Nombre del Representante Legal"
                value={newClient.nombreRepresentanteLegal}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="apellidoRepresentante"
                label="Apellido del Representante"
                value={newClient.apellidoRepresentante}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="RUT_representante"
                label="RUT del Representante"
                value={newClient.RUT_representante}
                onChange={handleInputChange}
                error={!!errors.RUT_representante}
                helperText={errors.RUT_representante}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Información de Contacto */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Información de Contacto
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="telCelular"
                label="Teléfono Celular"
                value={newClient.telCelular}
                onChange={handleInputChange}
                error={!!errors.telCelular}
                helperText={errors.telCelular}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneAndroidIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="telFijo"
                label="Teléfono Fijo"
                value={newClient.telFijo}
                onChange={handleInputChange}
                error={!!errors.telFijo}
                helperText={errors.telFijo}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="email"
                label="Email"
                type="email"
                value={newClient.email}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="web_cliente"
                label="Sitio Web"
                value={newClient.web_cliente}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LanguageIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

           
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para editar cliente */}
      <Dialog open={openEditModal} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
        <DialogTitle>Editar Cliente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
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
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
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
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="edit-grupo-label">Grupo</InputLabel>
                <Select
                  labelId="edit-grupo-label"
                  label="Grupo"
                  name="id_grupo"
                  value={selectedClient?.id_grupo || ''}
                  onChange={handleEditInputChange}
                  input={
                    <OutlinedInput
                      label="Grupo"
                      startAdornment={
                        <InputAdornment position="start">
                          <GroupsIcon />
                        </InputAdornment>
                      }
                    />
                  }
                >
                  {Object.entries(grupos).map(([id, nombre]) => (
                    <MenuItem key={id} value={id}>
                      {nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Razón Social"
                name="razonSocial"
                value={selectedClient?.razonSocial || ''}
                onChange={handleEditInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="edit-tipoCliente-label">Tipo de Cliente</InputLabel>
                <Select
                  labelId="edit-tipoCliente-label"
                  label="Tipo de Cliente"
                  name="id_tipoCliente"
                  value={selectedClient?.id_tipoCliente || ''}
                  onChange={handleEditInputChange}
                  input={
                    <OutlinedInput
                      label="Tipo de Cliente"
                      startAdornment={
                        <InputAdornment position="start">
                          <CategoryIcon />
                        </InputAdornment>
                      }
                    />
                  }
                >
                  {Object.entries(tiposCliente).map(([id, tipo]) => (
                    <MenuItem key={id} value={id}>{tipo.nombreTipoCliente}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="RUT"
                name="RUT"
                value={selectedClient?.RUT || ''}
                onChange={handleEditInputChange}
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
              <FormControl fullWidth variant="outlined">
                <InputLabel id="edit-region-label">Región</InputLabel>
                <Select
                  labelId="edit-region-label"
                  label="Región"
                  name="id_region"
                  value={selectedClient?.id_region || ''}
                  onChange={handleEditInputChange}
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
                  {Object.entries(regiones).map(([id, nombre]) => (
                    <MenuItem key={id} value={id}>{nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="edit-comuna-label">Comuna</InputLabel>
                <Select
                  labelId="edit-comuna-label"
                  label="Comuna"
                  name="id_comuna"
                  value={selectedClient?.id_comuna || ''}
                  onChange={handleEditInputChange}
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
                  {Object.entries(comunasFiltradas).map(([id, comuna]) => (
                    <MenuItem key={id} value={id}>
                      {comuna.nombreComuna}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Información de la Empresa - Edit Form */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Información de la Empresa
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="giro"
                label="Giro"
                value={selectedClient?.giro || ''}
                onChange={handleEditInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <StorefrontIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="direccionEmpresa"
                label="Dirección de la Empresa"
                value={selectedClient?.direccionEmpresa || ''}
                onChange={handleEditInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeWorkIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Información del Representante Legal - Edit Form */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Información del Representante Legal
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="nombreRepresentanteLegal"
                label="Nombre del Representante Legal"
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
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="apellidoRepresentante"
                label="Apellido del Representante"
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
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="RUT_representante"
                label="RUT del Representante"
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
            </Grid>

            {/* Información de Contacto - Edit Form */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Información de Contacto
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="telCelular"
                label="Teléfono Celular"
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
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="telFijo"
                label="Teléfono Fijo"
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
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="email"
                label="Email"
                type="email"
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
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="web_cliente"
                label="Sitio Web"
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
            </Grid>

            
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleEditSubmit} color="primary" variant="contained">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Clientes;