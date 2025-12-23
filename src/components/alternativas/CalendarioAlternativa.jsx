import React from 'react';
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';

const CalendarioAlternativa = ({ anio, mes, cantidades = [], onChange }) => {
  const getDiasDelMes = (anio, mes) => {
    if (!anio || !mes) return [];
    
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    const dias = [];
    
    for (let i = 1; i <= diasEnMes; i++) {
      const fecha = new Date(anio, mes - 1, i);
      const nombreDia = diasSemana[fecha.getDay()];
      dias.push({
        dia: i.toString().padStart(2, '0'),
        nombreDia,
        fecha: fecha.toISOString().split('T')[0]
      });
    }
    
    return dias;
  };

  const dias = getDiasDelMes(anio, mes);
  
  const getCantidad = (dia) => {
    const item = cantidades?.find(c => c.dia === dia);
    return item ? item.cantidad : '';
  };

  const calcularTotal = () => {
    if (!cantidades || !Array.isArray(cantidades)) return 0;
    return cantidades.reduce((sum, item) => {
      const cantidad = parseInt(item.cantidad) || 0;
      return sum + cantidad;
    }, 0);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, color: '#666' }}>
        Calendario de Cantidades
      </Typography>
      <TableContainer sx={{ 
        maxWidth: '100%',
        overflowX: 'auto',
        '& .MuiTable-root': {
          tableLayout: 'fixed',
          minWidth: 'max-content'
        }
      }}>
        <Table size="small" sx={{
          '& .MuiTableCell-root': {
            padding: '4px',
            border: '1px solid #e0e0e0',
            minWidth: '32px',
            maxWidth: '32px'
          }
        }}>
          <TableHead>
            <TableRow>
              {dias.map(({ dia, nombreDia }) => (
                <TableCell key={dia} align="center" sx={{ backgroundColor: '#f5f5f5' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5, color: '#666' }}>
                    {nombreDia}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#333' }}>
                    {dia}
                  </Typography>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ backgroundColor: '#f5f5f5', minWidth: '40px' }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#333', fontWeight: 'bold' }}>
                  Tot
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {dias.map(({ dia }) => (
                <TableCell key={dia} align="center" padding="none">
                  <input
                    type="number"
                    value={getCantidad(dia)}
                    onChange={(e) => onChange(dia, e.target.value)}
                    style={{ 
                      width: '28px',
                      height: '24px',
                      padding: '2px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '2px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      backgroundColor: '#fff'
                    }}
                    min="0"
                  />
                </TableCell>
              ))}
              <TableCell align="center" sx={{ backgroundColor: '#f8f9fa' }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#333' }}>
                  {calcularTotal()}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CalendarioAlternativa;
