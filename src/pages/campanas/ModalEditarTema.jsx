import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    IconButton,
    FormControl,
    Box,
    Typography,
    Paper,
    Checkbox,
    FormControlLabel,
    Chip,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';

const CustomCheckboxList = ({ medios, selectedMedios, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const handleToggle = () => setIsOpen(!isOpen);
    
    const handleCheckboxChange = (medioId) => {
        const newSelection = selectedMedios.includes(medioId)
            ? selectedMedios.filter(id => id !== medioId)
            : [...selectedMedios, medioId];
        onChange(newSelection);
    };

    return (
        <FormControl fullWidth>
            <Box sx={{ position: 'relative' }}>
                <Box
                    onClick={handleToggle}
                    sx={{
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        p: 1,
                        minHeight: '40px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5
                    }}
                >
                    {selectedMedios.length > 0 ? (
                        selectedMedios.map(medioId => {
                            const medio = medios.find(m => m.id_medio === medioId);
                            return medio ? (
                                <Chip
                                    key={medio.id_medio}
                                    label={medio.NombredelMedio}
                                    onDelete={() => handleCheckboxChange(medio.id_medio)}
                                    size="small"
                                />
                            ) : null;
                        })
                    ) : (
                        <Typography color="text.secondary">Seleccionar medios</Typography>
                    )}
                </Box>
                {isOpen && (
                    <Paper
                        sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            mt: 1,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            boxShadow: 3
                        }}
                    >
                        <Box sx={{ p: 1 }}>
                            {medios.map((medio) => (
                                <FormControlLabel
                                    key={medio.id_medio}
                                    control={
                                        <Checkbox
                                            checked={selectedMedios.includes(medio.id_medio)}
                                            onChange={() => handleCheckboxChange(medio.id_medio)}
                                        />
                                    }
                                    label={medio.NombredelMedio}
                                />
                            ))}
                        </Box>
                    </Paper>
                )}
            </Box>
        </FormControl>
    );
};

const ModalEditarTema = ({ open, onClose, onTemaUpdated, temaData }) => {
    const [formData, setFormData] = useState({
        NombreTema: '',
        Duracion: '',
        color: '',
        CodigoMegatime: '',
        id_Calidad: '',
        cooperado: 'No',
        rubro: '',
        id_medio: ''
    });

    const [visibleFields, setVisibleFields] = useState({
        duracion: false,
        color: false,
        codigo_megatime: false,
        calidad: false,
        cooperado: false,
        rubro: false
    });

    const [loading, setLoading] = useState(false);
    const [medios, setMedios] = useState([]);
    const [calidades, setCalidades] = useState([]);

    useEffect(() => {
        fetchMedios();
        fetchCalidades();
        if (temaData) {
            console.log('Cargando datos del tema:', temaData);
            
            // Extraer el id_medio del objeto Medios anidado si existe
            const id_medio = temaData.Medios ? temaData.Medios.id_medio : temaData.id_medio;
            
            // Extraer el id_Calidad del objeto Calidad anidado si existe
            const id_Calidad = temaData.Calidad ? temaData.Calidad.id_calidad : temaData.id_Calidad;
            
            console.log('id_Calidad extraído:', id_Calidad);
            
            setFormData({
                NombreTema: temaData.NombreTema || '',
                Duracion: temaData.Duracion || '',
                color: temaData.color || '',
                CodigoMegatime: temaData.CodigoMegatime || '',
                id_Calidad: id_Calidad || '',
                cooperado: temaData.cooperado || 'No',
                rubro: temaData.rubro || '',
                id_medio: id_medio || ''
            });

            // Buscar el medio seleccionado y actualizar los campos visibles
            if (id_medio) {
                console.log('Buscando medio con id:', id_medio);
                supabase
                    .from('Medios')
                    .select('*')
                    .eq('id', id_medio)
                    .single()
                    .then(({ data: selectedMedio, error }) => {
                        if (error) {
                            console.error('Error al cargar medio:', error);
                            return;
                        }
                        if (selectedMedio) {
                            console.log('Medio encontrado:', selectedMedio);
                            setVisibleFields({
                                duracion: Boolean(selectedMedio.duracion),
                                color: Boolean(selectedMedio.color),
                                codigo_megatime: Boolean(selectedMedio.codigo_megatime),
                                calidad: Boolean(selectedMedio.calidad),
                                cooperado: Boolean(selectedMedio.cooperado),
                                rubro: Boolean(selectedMedio.rubro)
                            });
                        }
                    });
            }
        }
    }, [temaData]);

    const handleMedioChange = (event) => {
        const medioId = Number(event.target.value);
        console.log('Medio seleccionado ID:', medioId);
        
        const selectedMedio = medios.find(m => m.id === medioId);
        console.log('Medio encontrado:', selectedMedio);

        setFormData(prev => ({
            ...prev,
            id_medio: medioId
        }));

        if (selectedMedio) {
            console.log('Campos booleanos del medio:', {
                duracion: selectedMedio.duracion,
                color: selectedMedio.color,
                codigo_megatime: selectedMedio.codigo_megatime,
                calidad: selectedMedio.calidad,
                cooperado: selectedMedio.cooperado,
                rubro: selectedMedio.rubro
            });

            setVisibleFields({
                duracion: Boolean(selectedMedio.duracion),
                color: Boolean(selectedMedio.color),
                codigo_megatime: Boolean(selectedMedio.codigo_megatime),
                calidad: Boolean(selectedMedio.calidad),
                cooperado: Boolean(selectedMedio.cooperado),
                rubro: Boolean(selectedMedio.rubro)
            });

            // Limpiar campos que no corresponden al medio seleccionado
            setFormData(prev => ({
                ...prev,
                color: selectedMedio.color ? prev.color : '',
                CodigoMegatime: selectedMedio.codigo_megatime ? prev.CodigoMegatime : '',
                rubro: selectedMedio.rubro ? prev.rubro : '',
                id_Calidad: selectedMedio.calidad ? prev.id_Calidad : '',
                Duracion: selectedMedio.duracion ? prev.Duracion : '',
                cooperado: selectedMedio.cooperado ? prev.cooperado : 'No'
            }));
        } else {
            setVisibleFields({
                duracion: false,
                color: false,
                codigo_megatime: false,
                calidad: false,
                cooperado: false,
                rubro: false
            });
            // Limpiar todos los campos relacionados
            setFormData(prev => ({
                ...prev,
                color: '',
                CodigoMegatime: '',
                rubro: '',
                id_Calidad: '',
                Duracion: '',
                cooperado: 'No'
            }));
        }
    };

    const fetchMedios = async () => {
        try {
            const { data, error } = await supabase
                .from('Medios')
                .select('*')
                .order('NombredelMedio');

            if (error) throw error;
            setMedios(data || []);
        } catch (error) {
            console.error('Error al cargar medios:', error);
        }
    };

    const fetchCalidades = async () => {
        try {
            const { data, error } = await supabase
                .from('Calidad')
                .select('id, NombreCalidad')
                .order('NombreCalidad');

            if (error) throw error;
            console.log('Calidades cargadas:', data);
            setCalidades(data || []);
        } catch (error) {
            console.error('Error al cargar calidades:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            // Validar que los campos numéricos sean números válidos o null
            const dataToUpdate = {
                ...formData,
                Duracion: formData.Duracion ? parseInt(formData.Duracion) : null,
                id_Calidad: formData.id_Calidad ? parseInt(formData.id_Calidad) : null,
                id_medio: formData.id_medio ? parseInt(formData.id_medio) : null
            };

            console.log('Datos a actualizar:', dataToUpdate);

            const { error: temaError } = await supabase
                .from('Temas')
                .update(dataToUpdate)
                .eq('id_tema', temaData.id_tema);

            if (temaError) {
                console.error('Error al actualizar tema:', temaError);
                throw temaError;
            }

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Tema actualizado correctamente'
            });

            if (typeof onTemaUpdated === 'function') {
                await onTemaUpdated();
            }
            onClose();

        } catch (error) {
            console.error('Error completo:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar el tema: ' + (error.message || 'Error desconocido')
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Editar Tema
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
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <TextField
                                    select
                                    label="Medio"
                                    name="id_medio"
                                    value={formData.id_medio}
                                    onChange={handleMedioChange}
                                    required
                                    SelectProps={{
                                        native: true,
                                    }}
                                >
                                    <option value=""></option>
                                    {medios.map((medio) => (
                                        <option key={medio.id} value={medio.id}>
                                            {medio.NombredelMedio}
                                        </option>
                                    ))}
                                </TextField>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre de Tema"
                                name="NombreTema"
                                value={formData.NombreTema}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        {visibleFields.duracion && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Duración"
                                    name="Duracion"
                                    value={formData.Duracion}
                                    onChange={handleChange}
                                />
                            </Grid>
                        )}

                        {visibleFields.color && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Color"
                                    name="color"
                                    value={formData.color || ''}
                                    onChange={handleChange}
                                />
                            </Grid>
                        )}

                        {visibleFields.codigo_megatime && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Código Megatime"
                                    name="CodigoMegatime"
                                    value={formData.CodigoMegatime}
                                    onChange={handleChange}
                                />
                            </Grid>
                        )}

                        {visibleFields.calidad && (
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Calidad</InputLabel>
                                    <Select
                                        value={formData.id_Calidad || ''}
                                        onChange={handleChange}
                                        name="id_Calidad"
                                        label="Calidad"
                                    >
                                        <MenuItem value="">
                                        </MenuItem>
                                        {calidades.map((calidad) => (
                                            <MenuItem key={calidad.id} value={calidad.id}>
                                                {calidad.NombreCalidad}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {visibleFields.cooperado && (
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Cooperado</InputLabel>
                                    <Select
                                        value={formData.cooperado}
                                        onChange={handleChange}
                                        name="cooperado"
                                        label="Cooperado"
                                    >
                                        <MenuItem value="No">No</MenuItem>
                                        <MenuItem value="Sí">Sí</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {visibleFields.rubro && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Rubro"
                                    name="rubro"
                                    value={formData.rubro || ''}
                                    onChange={handleChange}
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
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

export default ModalEditarTema;
