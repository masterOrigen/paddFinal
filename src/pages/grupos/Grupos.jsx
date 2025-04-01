import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`grupo-tabpanel-${index}`}
      aria-labelledby={`grupo-tab-${index}`}
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

function Grupos() {
  const [value, setValue] = useState(0);
  const [grupos, setGrupos] = useState([]);
  const [usuariosPorGrupo, setUsuariosPorGrupo] = useState({});
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openNewGroupDialog, setOpenNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editedGroupName, setEditedGroupName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Obtener todos los grupos
      const { data: gruposData, error: gruposError } = await supabase
        .from('Grupos')
        .select('id_grupo, nombre_grupo, created_at')
        .order('created_at', { ascending: true });

      if (gruposError) {
        console.error('Error al obtener grupos:', gruposError);
        throw gruposError;
      }

      console.log('Grupos obtenidos:', gruposData);
      setGrupos(gruposData || []);

      // Obtener todos los usuarios
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('Usuarios')
        .select(`
          id_usuario,
          Nombre,
          Apellido,
          Email,
          Estado,
          Avatar,
          id_grupo
        `)
        .order('Nombre');

      if (usuariosError) {
        console.error('Error al obtener usuarios:', usuariosError);
        throw usuariosError;
      }

      console.log('Usuarios obtenidos:', usuariosData);

      // Organizar usuarios por grupo
      const usuariosPorGrupoTemp = {};
      if (gruposData) {
        gruposData.forEach(grupo => {
          usuariosPorGrupoTemp[grupo.id_grupo] = usuariosData ? 
            usuariosData.filter(usuario => usuario.id_grupo === grupo.id_grupo) : 
            [];
        });
      }

      console.log('Usuarios organizados por grupo:', usuariosPorGrupoTemp);
      setUsuariosPorGrupo(usuariosPorGrupoTemp);
      setLoading(false);
    } catch (error) {
      console.error('Error general:', error);
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleOpenMenu = (event, usuario) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(usuario);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleChangeGroup = async (newGroupId) => {
    try {
      const targetGroup = grupos.find(g => g.id_grupo === newGroupId);
      const { error } = await supabase
        .from('Usuarios')
        .update({ id_grupo: newGroupId })
        .eq('id_usuario', selectedUser.id_usuario);

      if (error) throw error;

      await Swal.fire({
        title: '¡Cambio exitoso!',
        text: `${selectedUser.Nombres} ${selectedUser.Apellidos} ha sido movido al grupo ${targetGroup.nombre_grupo}`,
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });

      await fetchData();
      handleCloseMenu();
    } catch (error) {
      console.error('Error al cambiar de grupo:', error);
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo cambiar el grupo del usuario',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleOpenNewGroupDialog = () => {
    setOpenNewGroupDialog(true);
  };

  const handleCloseNewGroupDialog = () => {
    setOpenNewGroupDialog(false);
    setNewGroupName('');
  };

  const handleCreateNewGroup = async () => {
    if (!newGroupName.trim()) {
      await Swal.fire({
        title: 'Error',
        text: 'El nombre del grupo no puede estar vacío',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('Grupos')
        .insert({ nombre_grupo: newGroupName.trim() })
        .select();

      if (error) throw error;

      handleCloseNewGroupDialog();
      await fetchData();

      await Swal.fire({
        title: '¡Grupo creado!',
        text: `El grupo "${newGroupName}" ha sido creado exitosamente`,
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });

    } catch (error) {
      console.error('Error al crear grupo:', error);
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo crear el grupo',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleOpenEditDialog = (grupo) => {
    setEditingGroup(grupo);
    setEditedGroupName(grupo.nombre_grupo);
    setEditGroupDialog(true);
  };

  const handleCloseEditDialog = () => {
    setEditGroupDialog(false);
    setEditingGroup(null);
    setEditedGroupName('');
  };

  const handleEditGroup = async () => {
    if (!editedGroupName.trim()) {
      await Swal.fire({
        title: 'Error',
        text: 'El nombre del grupo no puede estar vacío',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('Grupos')
        .update({ nombre_grupo: editedGroupName.trim() })
        .eq('id_grupo', editingGroup.id_grupo);

      if (error) throw error;

      handleCloseEditDialog();
      await fetchData();

      await Swal.fire({
        title: '¡Grupo actualizado!',
        text: `El grupo ha sido renombrado a "${editedGroupName}" exitosamente`,
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });

    } catch (error) {
      console.error('Error al editar grupo:', error);
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo editar el grupo',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleDeleteGroup = async (grupo) => {
    // Verificar si hay usuarios en el grupo
    const usuariosEnGrupo = usuariosPorGrupo[grupo.id_grupo]?.length || 0;
    
    if (usuariosEnGrupo > 0) {
      await Swal.fire({
        title: 'No se puede eliminar',
        text: `Este grupo tiene ${usuariosEnGrupo} usuario(s). Debe mover los usuarios a otro grupo antes de eliminar este grupo.`,
        icon: 'warning',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Confirmar eliminación
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar el grupo "${grupo.nombre_grupo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('Grupos')
          .delete()
          .eq('id_grupo', grupo.id_grupo);

        if (error) throw error;

        await Swal.fire({
          title: '¡Eliminado!',
          text: `El grupo "${grupo.nombre_grupo}" ha sido eliminado exitosamente`,
          icon: 'success',
          confirmButtonColor: '#3085d6'
        });

        await fetchData();
        // Si el grupo eliminado era el activo, seleccionar el primer grupo
        if (value >= grupos.length - 1) {
          setValue(Math.max(0, grupos.length - 2));
        }
      } catch (error) {
        console.error('Error al eliminar grupo:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el grupo',
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Grupos de Usuarios
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenNewGroupDialog}
            >
              Nuevo Grupo
            </Button>
          </Box>

          {grupos.length > 0 ? (
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Tabs
                  value={value}
                  onChange={handleChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="grupos tabs"
                  sx={{ flex: 1 }}
                >
                  {grupos.map((grupo, index) => (
                    <Tab 
                      key={grupo.id_grupo} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{`${grupo.nombre_grupo} (${usuariosPorGrupo[grupo.id_grupo]?.length || 0})`}</span>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDialog(grupo);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(grupo);
                              }}
                              sx={{ 
                                '&:hover': { 
                                  color: 'error.main' 
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      }
                    />
                  ))}
                </Tabs>
              </Box>

              {grupos.map((grupo, index) => (
                <TabPanel key={grupo.id_grupo} value={value} index={index}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Avatar</TableCell>
                          <TableCell>Nombre Completo</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell align="center">Cambiar Grupo</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {usuariosPorGrupo[grupo.id_grupo]?.map((usuario) => (
                          <TableRow key={usuario.id_usuario}>
                            <TableCell>
                              <Avatar 
                                src={usuario.Avatar} 
                                alt={`${usuario.Nombre} ${usuario.Apellido}`}
                                sx={{ width: 40, height: 40 }}
                              >
                                {usuario.Nombre?.charAt(0)}
                              </Avatar>
                            </TableCell>
                            <TableCell>{`${usuario.Nombre || ''} ${usuario.Apellido || ''}`}</TableCell>
                            <TableCell>{usuario.Email || '-'}</TableCell>
                            <TableCell>
                              <span style={{ 
                                color: usuario.Estado ? '#4caf50' : '#f44336',
                                fontWeight: 500
                              }}>
                                {usuario.Estado ? 'Activo' : 'Inactivo'}
                              </span>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Cambiar grupo">
                                <IconButton 
                                  onClick={(e) => handleOpenMenu(e, usuario)}
                                  color="primary"
                                >
                                  <SwapHorizIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!usuariosPorGrupo[grupo.id_grupo] || usuariosPorGrupo[grupo.id_grupo].length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No hay usuarios en este grupo
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>
              ))}

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
              >
                {grupos.map((grupo) => (
                  <MenuItem
                    key={grupo.id_grupo}
                    onClick={() => handleChangeGroup(grupo.id_grupo)}
                    disabled={selectedUser?.id_grupo === grupo.id_grupo}
                  >
                    {grupo.nombre_grupo}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          ) : (
            <Typography variant="h6" align="center">
              No hay grupos disponibles. Por favor, cree un nuevo grupo.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para crear nuevo grupo */}
      <Dialog 
        open={openNewGroupDialog} 
        onClose={handleCloseNewGroupDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Crear Nuevo Grupo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              label="Nombre del Grupo"
              type="text"
              fullWidth
              variant="outlined"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <GroupsIcon color="action" sx={{ mr: 1 }} />
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  height: '56px',
                  fontSize: '1.1rem'
                }
              }}
              placeholder="Ingrese el nombre del grupo"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseNewGroupDialog}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateNewGroup} 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
          >
            Crear Grupo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar grupo */}
      <Dialog 
        open={editGroupDialog} 
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" sx={{ fontSize: 30 }} />
          Editar Grupo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              label="Nombre del Grupo"
              type="text"
              fullWidth
              variant="outlined"
              value={editedGroupName}
              onChange={(e) => setEditedGroupName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <GroupsIcon color="action" sx={{ mr: 1 }} />
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  height: '56px',
                  fontSize: '1.1rem'
                }
              }}
              placeholder="Ingrese el nuevo nombre del grupo"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseEditDialog}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEditGroup} 
            variant="contained" 
            color="primary"
            startIcon={<EditIcon />}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Grupos;
