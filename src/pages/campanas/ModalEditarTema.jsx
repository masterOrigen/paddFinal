import React, { useState, useEffect } from 'react';
import CategoryIcon from '@mui/icons-material/Category';
import TopicIcon from '@mui/icons-material/Topic';
import TimerIcon from '@mui/icons-material/Timer';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import CodeIcon from '@mui/icons-material/Code';
import VerifiedIcon from '@mui/icons-material/Verified';
import InputAdornment from '@mui/material/InputAdornment';
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


const ModalEditarTema = ({ open, onClose, onTemaUpdated, temaData, medioId, medioNombre }) => {
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
            
            // Prioritize medioId from props over temaData
            const id_medio = medioId || (temaData.Medios ? temaData.Medios.id_medio : temaData.id_medio);
            const id_Calidad = temaData.Calidad ? temaData.Calidad.id_calidad : temaData.id_Calidad;
            
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

            // Update visible fields based on the media
            if (id_medio) {
                supabase
                    .from('Medios')
                    .select('*')
                    .eq('id', id_medio)
                    .single()
                    .then(({ data: selectedMedio, error }) => {
                        if (!error && selectedMedio) {
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
        } else if (medioId) {
            // Update for new tema creation with predefined medio
            setFormData(prev => ({
                ...prev,
                id_medio: medioId
            }));
            
            // Fetch media details to set visible fields
            supabase
            .from('Medios')
            .select('*')
            .eq('id', medioId)
            .single()
            .then(({ data: selectedMedio, error }) => {
                if (!error && selectedMedio) {
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
}, [temaData, medioId]);

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
            {temaData ? 'Editar Tema' : 'Agregar Tema'}
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
                            {medioId ? (
                                <TextField
                                    fullWidth
                                    label="Medio"
                                    value={medioNombre || ''}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CategoryIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            ) : (
                                <TextField
                                    select
                                    fullWidth
                                    label="Medio"
                                    value={formData.id_medio}
                                    onChange={handleMedioChange}
                                    name="id_medio"
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CategoryIcon sx={{ mr: 1 }} />
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
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre de Tema"
                                name="NombreTema"
                                value={formData.NombreTema}
                                onChange={handleChange}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <TopicIcon sx={{ mr: 1 }} />
                                        </InputAdornment>
                                    ),
                                }}
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
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <TimerIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
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
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ColorLensIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
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
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CodeIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        )}

                        {visibleFields.calidad && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Calidad"
                                    name="id_Calidad"
                                    value={formData.id_Calidad || ''}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <VerifiedIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Ninguna</em>
                                    </MenuItem>
                                    {calidades.map((calidad) => (
                                        <MenuItem key={calidad.id} value={calidad.id}>
                                            {calidad.NombreCalidad}
                                        </MenuItem>
                                    ))}
                                </TextField>
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
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CategoryIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
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
