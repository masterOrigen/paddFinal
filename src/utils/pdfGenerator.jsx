import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontSize: 8,
    fontFamily: 'Helvetica',
    backgroundColor: '#fff',
    width: '100%',
    height: '100%'
  },

dayName: {
	fontSize:6,
	marginBottom: 4, // Espacio entre el nombre y el número
	textAlign: 'center'
},
dayNumber: {
	fontSize:6,
	textAlign: 'center'
},

header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottom: '1pt solid #ccc',
    paddingBottom: 6
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    width: '25%',  // Set fixed width for the RUT container
    textAlign: 'left'
  },
  titleContainer: {
    width: '50%',  // Set fixed width for the title container
    alignItems: 'center'
  },
  yearContainer: {
    width: '25%',  // Set fixed width for the year container
    alignItems: 'flex-end',
	color:'#0000fc',
	fontWeight:'bold'
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4
  },
  infoColumn2:{width:'75%'},
  infoColumn: {
    width: '25%'
  },

  table: {
    marginTop: 10,
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#333',
    borderLeftWidth: 1,
    borderLeftColor: '#333'
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#ffffff'
  },
  tableCell: {
    padding: 4,
    fontSize: 7,
    textAlign: 'left',
    flex: 1,
    color: '#333333',
    borderRightWidth: 1,
    borderRightColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold'
  },
  tableCellContainer: {
    width: 17,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  cellText: {
    textAlign: 'center',
    fontSize: 7,
    color: '#333333'
  },
  centerColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  themeTitle: {
    color: '#2196f3',
    fontWeight: 'bold',
    marginBottom: 3,
    fontSize: 8
  },
  rowex:{display:'flex',flexDirection:'row',width:'100%', marginBottom:4},
  infoText: {
    fontSize: 7,
    marginBottom: 4,
    lineHeight: 1.2,
    flexDirection: 'row',
    display: 'flex'
  },
  infoText3: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.2,
    flexDirection: 'row',
    display: 'flex'
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 80,  // Ancho fijo para todas las etiquetas
    marginRight: 8  // Espacio consistente entre etiqueta y valor
  },
  infoLabel3: {
    fontWeight: 'bold',
	fontSize:10,
    width: 80,  // Ancho fijo para todas las etiquetas
    marginRight: 8  // Espacio consistente entre etiqueta y valor
  },
  infoValue: {
    flex: 1  // Toma el espacio restante
  },
  replacementText: {
    fontSize: 8,
    color: '#666',
    marginTop: 2
  },
  replacementText2: {
    marginTop:5,
    fontSize: 12,
    color: 'red'
  },




  yearText: {
    fontSize: 10,
	fontWeight:'900',
    color: '#0000fc'
  },
totalsContainer: {
    width: 200,
    alignSelf: 'flex-end',
    marginTop: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    borderRadius: 4,
    overflow: 'hidden'
  },
  totalsContainer2: {
    width: 200,
    alignSelf: 'flex-end',
    marginTop: 20,
    marginRight: 10,

    backgroundColor: '#fff',

    overflow: 'hidden'
  },
 
  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 8,
    backgroundColor: '#ffffff'
  },
  totalLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    width: '50%',
    color: '#333333'
  },
  totalValue: {
    fontSize: 8,
    width: '50%',
    textAlign: 'right',
    color: '#333333'
  }
});
const OrderDocument = ({ order, alternatives, cliente, campana, plan }) => {
  const upper = (s) => (typeof s === 'string' ? s.toUpperCase() : s);
  // Determinar si es bruto o neto basado en el TipoGeneracionDeOrden del contrato
  const tipoOrdenData = alternatives[0]?.Contratos?.TipoGeneracionDeOrden;
  // Fallback: usar el ID directo del contrato si el objeto TipoGeneracionDeOrden no está cargado
  const idTipoOrden = alternatives[0]?.Contratos?.id_GeneraracionOrdenTipo;
  
  const esBruto = tipoOrdenData?.NombreTipoOrden === 'Bruto' || tipoOrdenData?.id === 2 || idTipoOrden === 2;
  const isCanceled = order?.estado === 'anulada';
  const isReplaced = order?.estado === 'anulada y remplazada';
  const medioNombre =
    (alternatives.find(a => a?.Contratos?.medio?.NombredelMedio)?.Contratos?.medio?.NombredelMedio) ||
    (alternatives.find(a => a?.Contratos?.Medios?.NombredelMedio)?.Contratos?.Medios?.NombredelMedio) ||
    (alternatives.find(a => a?.Medios?.NombredelMedio)?.Medios?.NombredelMedio) ||
    null;

    // Calculate total days for the month
    const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
    const year = alternatives[0]?.Anios?.years || new Date().getFullYear();
    const month = alternatives[0]?.Meses?.Id || new Date().getMonth() + 1;
    const totalDays = daysInMonth(year, month);
  
  return (
	<Document>
		<Page size={{ width: 800, height:1000  }} orientation="landscape" style={styles.page}>
			<View style={styles.header}>
				<Text style={styles.headerText}></Text>
        <View style={styles.titleContainer}>
    <Text style={[styles.title, (isCanceled || isReplaced) ? { color: 'red' } : null]}>
        {isCanceled ? 'ORDEN ANULADA' : (isReplaced ? 'ORDEN ANULADA Y REMPLAZADA' : 'ORDEN DE PUBLICIDAD')} {order?.numero_correlativo}
        {order?.copia ? ` - ${order?.copia}` : ''}
    </Text>
    {order?.orden_remplaza && (
        <Text style={styles.replacementText2}>
            ANULA Y REMPLAZA ORDEN N° {order?.numero_correlativo}
            {(Number(order?.copia) - 1) > 0 ? ` / ${Number(order?.copia) - 1}` : ''}
        </Text>
    )}
</View>
                <View style={styles.yearContainer}>
                    <Text style={styles.infoText3}>
                        {upper(medioNombre || '')}
                    </Text>
                    <Text style={styles.yearText}>
                        {upper(alternatives[0]?.Meses?.Nombre)} / {(alternatives[0]?.Anios?.years) ?? new Date().getFullYear()}
                    </Text>
                </View>
			</View>

			<View style={styles.infoContainer}>
					<View style={styles.infoColumn}>
							<View style={styles.rowex}>
								<Text style={styles.infoLabel}>CLIENTE:</Text>
                                <Text style={styles.infoValue}>{upper(cliente?.nombreCliente)}</Text>
							</View>
							<View style={styles.rowex}>
								<Text style={styles.infoLabel}>RUT:</Text>
								<Text style={styles.infoValue}>{cliente?.RUT}</Text>
							</View>
							<View style={styles.rowex}>
								<Text style={styles.infoLabel}>DIRECCIÓN:</Text>
                                <Text style={styles.infoValue}>{upper(cliente?.direccionEmpresa)}</Text>
							</View>
							<View style={styles.rowex}>
                <Text style={styles.infoLabel}>COMUNA:</Text>
                <Text style={styles.infoValue}>{upper(cliente?.Comunas?.nombreComuna || 'No especificado')}</Text>
              </View>
							<View style={styles.rowex}>
								<Text style={styles.infoLabel}>PRODUCTO:</Text>
                                <Text style={styles.infoValue}>{upper(campana?.Productos?.NombreDelProducto)}</Text>
							</View>
							<View style={styles.rowex}>
								<Text style={styles.infoLabel}>AÑO:</Text>
								<Text style={styles.infoValue}>{new Date().getFullYear()}</Text>
							</View>
							<View style={styles.rowex}>
								<Text style={styles.infoLabel}>MES:</Text>
                                <Text style={styles.infoValue}>{upper(alternatives[0]?.Meses?.Nombre)}</Text>
							</View>
                            <View style={styles.rowex}>
                                <Text style={styles.infoLabel}>N° CONTRATO:</Text>
                                <Text style={styles.infoValue}>{upper(alternatives[0]?.Contratos?.NombreContrato)}</Text>
                            </View>
							<View style={styles.rowex}>
								<Text style={styles.infoLabel}>FORMA DE PAGO:</Text>
                                <Text style={styles.infoValue}>{upper(alternatives[0]?.Contratos?.FormaDePago?.NombreFormadePago)}</Text>
							</View>
							<View style={styles.rowex}>
								<Text style={styles.infoLabel}>TIPO ITEM:</Text>
                                <Text style={styles.infoValue}>{upper(alternatives[0]?.tipo_item)}</Text>
							</View>
					</View>

				<View style={[styles.centerColumn, { borderWidth: 1, borderColor: '#333', paddingVertical: 4, paddingHorizontal: 50 }]}>
                    <Text style={styles.infoText3}><Text style={styles.infoLabel3}>CAMPAÑA:</Text> {upper(campana?.NombreCampania)}</Text>
                    <Text style={styles.infoText3}><Text style={styles.infoLabel3}>PLAN DE MEDIOS:</Text> {upper(plan?.nombre_plan || campana?.NombreCampania)}</Text>
					{order?.Descuento1 > 0 && (
						<Text style={styles.infoText}>
							<Text style={styles.infoLabel3}>DESCUENTO:</Text> ${order?.Descuento1?.toLocaleString('es-CL')}
						</Text>
					)}
				</View>

				<View style={styles.infoColumn}>
				<View style={styles.rowex}>
    <Text style={styles.infoLabel}>PROVEEDOR:</Text>
    <Text style={styles.infoValue}>{upper(alternatives[0]?.Contratos?.Proveedores?.nombreProveedor)}</Text>
  </View>

  <View style={styles.rowex}>
    <Text style={styles.infoLabel}>RUT:</Text>
    <Text style={styles.infoValue}>{alternatives[0]?.Contratos?.Proveedores?.rutProveedor}</Text>
  </View>

  <View style={styles.rowex}>
    <Text style={styles.infoLabel}>SOPORTE:</Text>
    <Text style={styles.infoValue}>{upper(alternatives[0]?.Soportes?.nombreIdentficiador)}</Text>
  </View>

  <View style={styles.rowex}>
    <Text style={styles.infoLabel}>DIRECCIÓN:</Text>
    <Text style={styles.infoValue}>{upper(alternatives[0]?.Contratos?.Proveedores?.direccionFacturacion)}</Text>
  </View>

  <View style={styles.rowex}>
    <Text style={styles.infoLabel}>COMUNA:</Text>
    <Text style={styles.infoValue}>{upper(alternatives[0]?.Contratos?.Proveedores?.Comunas?.nombreComuna || alternatives[0]?.Contratos?.Proveedores?.id_comuna)}</Text>
  </View>

  <View style={styles.rowex}>
    <Text style={styles.infoLabel}>AGENCIA CREATIVA:</Text>
    <Text style={styles.infoValue}>{upper(campana?.Agencias?.NombreIdentificador || 'No especificada')}</Text>
  </View>
</View>
			</View>

			<View style={styles.table}>
    <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={{ padding:4, width: 100, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>Programas</Text>
        <Text style={{ padding:4, width: 50, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>Hora</Text>
        <Text style={{ padding:4, width: 45, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>Cod.{'\n'}Megatime</Text>
        <Text style={{ padding:4, width: 35, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>Seg/Clas</Text>
        
        {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const date = new Date(year, month - 1, day);
            const dayName = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'][date.getDay()];
            return (
				<View key={i} style={[styles.tableCellContainer, { backgroundColor: '#f8f9fa' }]}>
				<Text style={styles.dayName}>{dayName}</Text>
				<Text style={styles.dayNumber}>{day}</Text>
			</View>
            );
        })}
        {/* Rellenar celdas vacías si el mes tiene menos de 31 días para mantener la alineación si es necesario, o simplemente ajustar el ancho */}
        {totalDays < 31 && Array.from({ length: 31 - totalDays }, (_, i) => (
             <View key={`empty-${i}`} style={[styles.tableCellContainer, { backgroundColor: '#f0f0f0' }]}>
                 <Text style={styles.dayName}>-</Text>
             </View>
        ))}
        <Text style={{ padding:4, width: 35, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>Total días</Text>
        <Text style={{ padding:4, width: 45, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>Tarifa Bruta</Text>
        <Text style={{ padding:4, width: 30, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>Dto</Text>
        <Text style={{ padding:4, width: 45, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>Tarifa Nego.</Text>
        <Text style={{ padding:4, width: 50, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>{esBruto ? 'Total Gral' : 'Total Neto'}</Text>
    </View>

    {alternatives.map((alt, index) => {
        const totalDias = (Array.isArray(alt.calendar) ? alt.calendar : [])
            .filter(item => parseInt(item.dia) <= totalDays)
            .reduce((sum, item) => sum + (parseInt(item.cantidad) || 0), 0);
        return (
            <View key={index} style={styles.tableRow}>
                <Text style={{ padding:4, width: 100, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>
                        <Text style={styles.themeTitle}>
                            TEMA: {alt.Temas?.NombreTema}{'\n'}
                        </Text>
                    {upper(alt.Programas?.descripcion)}
                    {alt.detalle && (
                        <Text>
                            {'\n'}
                            <Text style={styles.themeTitle}>DETALLE: </Text>
                            {upper(alt.detalle)}
                        </Text>
                    )}
                </Text>
                <Text style={{ padding:4, width: 50, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>
                    {`${upper(alt.Programas?.hora_inicio)} - ${upper(alt.Programas?.hora_fin)}`}
                </Text>
                <Text style={{ padding:4, width: 45, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>
                    {upper(alt.Temas?.CodigoMegatime || alt.Temas?.codigo_megatime)}
                </Text>
                <Text style={{ padding:4, width: 35, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>
                    {upper(alt.Temas?.Duracion)}
                </Text>
                {/* Calendar cells */}
                {(() => {
                    return (
                        <>
                            {Array.from({ length: totalDays }, (_, i) => {
                                const day = (i + 1).toString().padStart(2, '0');
                                const calendarArray = Array.isArray(alt.calendar) ? alt.calendar : [];
                                const calendarItem = calendarArray.find(c => c.dia === day);
                                return (
                                    <View key={i} style={styles.tableCellContainer}>
                                        <Text style={styles.cellText}>
                                            {calendarItem?.cantidad || ''}
                                        </Text>
                                    </View>
                                );
                            })}
                            {/* Celdas vacías para completar hasta 31 días si es necesario */}
                            {totalDays < 31 && Array.from({ length: 31 - totalDays }, (_, i) => (
                                <View key={`empty-cell-${i}`} style={[styles.tableCellContainer, { backgroundColor: '#f0f0f0' }]}>
                                    <Text style={styles.cellText}>-</Text>
                                </View>
                            ))}
                        </>
                    );
                })()}
                <Text style={{ padding:4, width: 35, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>
                    {totalDias}
                </Text>
                <Text style={{ padding:4, width: 45, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>
                    ${((isCanceled ? 0 : alt.total_bruto) || 0).toLocaleString('es-CL')}
                </Text>
                <Text style={{ padding:4, width: 30, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>
                    {isCanceled ? 0 : (alt.descuento_pl || 0)}
                </Text>
                <Text style={{ padding:4, width: 45, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>
                    ${((isCanceled ? 0 : (alt.valor_unitario / (totalDias || 1))) || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={{ padding:4, width: 50, fontSize:7, borderRightWidth: 1, borderRightColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>
                    ${((isCanceled ? 0 : (esBruto ? ((alt.total_bruto || 0) - (alt.descuento_pl || 0)) : (alt.total_neto || 0))) || 0).toLocaleString('es-CL')}
                </Text>
            </View>
        );
    })}
</View>

<View style={styles.totalsContainer}>
  {(() => {
    const isCanceled = order?.estado === 'anulada';
    const sumBase = isCanceled ? 0 : Math.round(alternatives.reduce((sum, alt) => {
        const val = esBruto ? ((alt.total_bruto || 0) - (alt.descuento_pl || 0)) : (alt.total_neto || 0);
        return sum + val;
    }, 0));
    const iva = Math.round(sumBase * 0.19);
    const totalOrden = sumBase + iva;
    return (
      <>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{esBruto ? 'TOTAL GRAL:' : 'TOTAL NETO:'}</Text>
          <Text style={styles.totalValue}>
            ${sumBase.toLocaleString('es-CL').split(',')[0]}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA 19%:</Text>
          <Text style={styles.totalValue}>
            ${iva.toLocaleString('es-CL').split(',')[0]}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL ORDEN($):</Text>
          <Text style={styles.totalValue}>
            ${totalOrden.toLocaleString('es-CL').split(',')[0]}
          </Text>
        </View>
      </>
    );
  })()}
</View>
<View style={styles.totalsContainer2}>
<View style={{ marginTop: 20, alignItems: 'center' }}>
    <Text style={{ fontSize: 10, marginBottom: 4, fontWeight: 'bold', color: '#0000fc', textTransform: 'uppercase' }}>
        {(order?.usuario_registro?.nombre || order?.usuario?.nombre || 'No registrado').toUpperCase()}
    </Text>
    <Text style={{ fontSize: 8, color: '#666' }}>
        {order?.usuario_registro?.email || order?.usuario?.email || 'Sin email'}
    </Text>
    <Text style={{ fontSize: 8, color: '#666', marginTop: 5, alignItems: 'center', textAlign: 'center' }}>
        {(() => {
            const dateObj = order?.fecha_creacion2 ? new Date(order.fecha_creacion2) : (order?.created_at ? new Date(order.created_at) : new Date());
            const dateStr = dateObj.toLocaleDateString('es-CL');
            const timeStr = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
            return `FECHA DE EMISIÓN: ${dateStr}\nHORA: ${timeStr}`;
        })()}
    </Text>
</View>
</View>
        </Page>
    </Document>
);
};
export const generateOrderPDF = async (order, alternatives, cliente, campana, plan) => {
	try {
		console.log('Debugging PDF Generation Data:');
		console.log('Order:', order);
		console.log('Alternatives:', alternatives);
		console.log('Cliente:', cliente);
		console.log('Campaña:', campana);
		console.log('Plan:', plan);
		
		const blob = await pdf(
			<OrderDocument 
				order={order} 
				alternatives={alternatives}
				cliente={cliente}
				campana={campana}
				plan={plan}
			/>
		).toBlob();
		
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileNumber = order?.numero_correlativo ?? order?.id_ordenes_de_comprar ?? 'orden';
        // Usar el número de copia de la orden, por defecto 0 si no existe
        const copia = order?.copia ? `-${order.copia}` : '';
        const isCanceled = order?.estado === 'anulada';
        const isReplaced = order?.estado === 'anulada y remplazada';
        const prefix = isCanceled ? 'Orden-Anulada' : (isReplaced ? 'Orden-Anulada-Remplazada' : 'orden');
        link.setAttribute('download', `${prefix}-${fileNumber}${copia}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
		console.error('Error al generar el PDF:', error);
		throw error;
	}
};
