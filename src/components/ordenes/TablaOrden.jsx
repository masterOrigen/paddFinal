import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Box
} from '@mui/material';

const TablaOrden = ({ ordenData, alternativas, cliente, campana }) => {
  // Función para agrupar alternativas por mes
  const agruparPorMes = (alternativas) => {
    return alternativas.reduce((acc, alt) => {
      const mes = alt.Meses?.Nombre || 'Sin Mes';
      if (!acc[mes]) {
        acc[mes] = [];
      }
      acc[mes].push(alt);
      return acc;
    }, {});
  };

  // Función para calcular totales
  const calcularTotales = (alternativas) => {
    return alternativas.reduce((acc, alt) => {
      acc.totalBruto += alt.total_bruto || 0;
      acc.totalNeto += alt.total_neto || 0;
      return acc;
    }, { totalBruto: 0, totalNeto: 0 });
  };

  const alternativasAgrupadas = agruparPorMes(alternativas);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Encabezado */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6">Cliente: {cliente?.nombreCliente}</Typography>
          <Typography>RUT: {cliente?.rutCliente}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6">Campaña: {campana?.NombreCampania}</Typography>
          <Typography>Producto: {campana?.Productos?.NombreDelProducto}</Typography>
        </Grid>
      </Grid>

      {/* Tablas por mes */}
      {Object.entries(alternativasAgrupadas).map(([mes, alts]) => {
        const totales = calcularTotales(alts);
        
        return (
          <Box key={mes} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Mes: {mes}
            </Typography>
            
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N° Línea</TableCell>
                    <TableCell>N° Orden</TableCell>
                    <TableCell>Soporte</TableCell>
                    <TableCell>Programa</TableCell>
                    <TableCell>Clasificación</TableCell>
                    <TableCell>Tema</TableCell>
                    <TableCell>Tipo Item</TableCell>
                    <TableCell>Detalle</TableCell>
                    <TableCell>Segundos</TableCell>
                    <TableCell align="right">Valor Unit.</TableCell>
                    <TableCell align="right">Desc. %</TableCell>
                    <TableCell align="right">Rec. %</TableCell>
                    <TableCell align="right">Total Bruto</TableCell>
                    <TableCell align="right">Total Neto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alts.map((alt) => (
                    <TableRow key={alt.id}>
                      <TableCell>{alt.nlinea}</TableCell>
                      <TableCell>{alt.numerorden}</TableCell>
                      <TableCell>{alt.Soportes?.nombreIdentficiador}</TableCell>
                      <TableCell>{alt.Programas?.descripcion}</TableCell>
                      <TableCell>{alt.Clasificacion?.NombreClasificacion}</TableCell>
                      <TableCell>{alt.Temas?.NombreTema}</TableCell>
                      <TableCell>{alt.tipo_item}</TableCell>
                      <TableCell>{alt.detalle}</TableCell>
                      <TableCell>{alt.segundos}</TableCell>
                      <TableCell align="right">
                        {alt.valor_unitario?.toLocaleString('es-CL', {
                          style: 'currency',
                          currency: 'CLP'
                        })}
                      </TableCell>
                      <TableCell align="right">{alt.descuento_plan}</TableCell>
                      <TableCell align="right">{alt.recargo_plan}</TableCell>
                      <TableCell align="right">
                        {alt.total_bruto?.toLocaleString('es-CL', {
                          style: 'currency',
                          currency: 'CLP'
                        })}
                      </TableCell>
                      <TableCell align="right">
                        {alt.total_neto?.toLocaleString('es-CL', {
                          style: 'currency',
                          currency: 'CLP'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Fila de totales */}
                  <TableRow>
                    <TableCell colSpan={12} align="right">
                      <strong>Totales:</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>
                        {totales.totalBruto.toLocaleString('es-CL', {
                          style: 'currency',
                          currency: 'CLP'
                        })}
                      </strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>
                        {totales.totalNeto.toLocaleString('es-CL', {
                          style: 'currency',
                          currency: 'CLP'
                        })}
                      </strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      })}
    </Paper>
  );
};

export default TablaOrden;
