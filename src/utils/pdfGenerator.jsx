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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    borderRadius: 4,
    overflow: 'hidden'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  tableCell: {
    padding: 4,
    fontSize: 7,
    textAlign: 'left',
    flex: 1,
    color: '#333333',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6'
  },
  tableCellContainer: {
    width: '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    borderStyle: 'solid'
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
  const tipoOrden = alternatives[0]?.Contratos?.TipoGeneracionDeOrden?.id || 1;
  const esBruto = tipoOrden === 2; // Asumiendo que id=2 es Bruto y id=1 es Neto
  const isCanceled = order?.estado === 'anulada';
  const medioNombre =
    (alternatives.find(a => a?.Contratos?.medio?.NombredelMedio)?.Contratos?.medio?.NombredelMedio) ||
    (alternatives.find(a => a?.Contratos?.Medios?.NombredelMedio)?.Contratos?.Medios?.NombredelMedio) ||
    (alternatives.find(a => a?.Medios?.NombredelMedio)?.Medios?.NombredelMedio) ||
    null;
  
  return (
	<Document>
		<Page size={{ width: 800, height:1000  }} orientation="landscape" style={styles.page}>
			<View style={styles.header}>
				<Text style={styles.headerText}></Text>
        <View style={styles.titleContainer}>
    <Text style={[styles.title, isCanceled ? { color: 'red' } : null]}>
        {isCanceled ? 'ORDEN ANULADA' : 'ORDEN DE PUBLICIDAD'} {order?.numero_correlativo}
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

				<View style={[styles.infoColumn2, styles.centerColumn]}>
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
    <Text style={styles.infoValue}>AGENCIA DE PRUEBAS</Text>
  </View>
</View>
			</View>

			<View style={styles.table}>
    <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={{ padding:4,width: 100, fontSize:7, borderRightWidth: 1, borderRightColor: '#e0e0e0' }}>Programas</Text>
        <Text style={[styles.tableCell, { width: '2%' }]}>Hora</Text>
        <Text style={[styles.tableCell, { width: '2%' }]}>Cod.{'\n'}Megatime</Text>
        <Text style={[styles.tableCell, { width: '2%' }]}>Seg/Clas</Text>
        {Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const date = new Date(alternatives[0]?.Anios?.years, alternatives[0]?.Meses?.Id - 1, day);
            const dayName = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'][date.getDay()];
            return (
				<View key={i} style={styles.tableCellContainer}>
				<Text style={styles.dayName}>{dayName}</Text>
				<Text style={styles.dayNumber}>{day}</Text>
			</View>
            );
        })}
        <Text style={[styles.tableCell, { width: '1%' }]}>Total días</Text>
        <Text style={[styles.tableCell, { width: '1%' }]}>Tarifa Bruta</Text>
        <Text style={{ padding:4,width: 50,fontSize:7 }}>Dto</Text>
        <Text style={[styles.tableCell, { width: '1%' }]}>Tarifa Negociada</Text>
        <Text style={[styles.tableCell, { width: '1%' }]}>TOTAL NETO</Text>
    </View>

    {/* Group alternatives by theme */}
    {Object.entries(alternatives.reduce((acc, alt) => {
        const themeId = alt.Temas?.id_tema;
        if (!acc[themeId]) {
            acc[themeId] = {
                theme: alt.Temas,
                alternatives: []
            };
        }
        acc[themeId].alternatives.push(alt);
        return acc;
    }, {})).map(([themeId, group]) => (
        group.alternatives.map((alt, index) => (
            <View key={`${themeId}-${index}`} style={styles.tableRow}>
                <Text style={{ padding:4, width: 100, borderRightWidth: 1, borderRightColor: '#e0e0e0' }}>
                    {index === 0 && (
                        <Text style={styles.themeTitle}>
                            TEMA: {group.theme?.NombreTema}{'\n'}
                        </Text>
                    )}
                    {upper(alt.Programas?.descripcion)}
                </Text>
                <Text style={[styles.tableCell, { width: '6%' }]}>
                    {`${upper(alt.Programas?.hora_inicio)} - ${upper(alt.Programas?.hora_fin)}`}
                </Text>
                <Text style={[styles.tableCell, { width: '6%' }]}>
                    {upper(alt.Programas?.codigo_programa)}
                </Text>
                <Text style={[styles.tableCell, { width: '3%' }]}>
                    {upper(alt.Temas?.Duracion)}
                </Text>
                {/* Calendar cells */}
				{Array.from({ length: 31 }, (_, i) => {
					const day = (i + 1).toString().padStart(2, '0');
					const calendarItem = alt.calendar?.find(c => c.dia === day);
					return (
						<View key={i} style={styles.tableCellContainer}>
					<Text style={styles.cellText}>
						{calendarItem?.cantidad || ''}
            </Text>
        </View>
    );
})}
                <Text style={[styles.tableCell, { width: '1%' }]}>
                    {alt.calendar?.reduce((sum, item) => sum + (parseInt(item.cantidad) || 0), 0)}
                </Text>
                <Text style={[styles.tableCell, { width: '1%' }]}>
                    ${((isCanceled ? 0 : alt.total_bruto) || 0).toLocaleString('es-CL')}
                </Text>
                <Text style={[styles.tableCell, { width: '1%' }]}>
                    {isCanceled ? 0 : (alt.descuento_pl || 0)}
                </Text>
                <Text style={[styles.tableCell, { width: '1%' }]}>
                    ${((isCanceled ? 0 : alt.valor_unitario) || 0).toLocaleString('es-CL')}
                </Text>
                <Text style={[styles.tableCell, { width: '1%' }]}>
                    ${((isCanceled ? 0 : alt.total_neto) || 0).toLocaleString('es-CL')}
                </Text>
            </View>
        ))
    ))}
</View>

<View style={styles.totalsContainer}>
  {(() => {
    const isCanceled = order?.estado === 'anulada';
    const sumNeto = isCanceled ? 0 : Math.round(alternatives.reduce((sum, alt) => sum + (alt.total_neto || 0), 0));
    const iva = Math.round(sumNeto * 0.19);
    const totalOrden = sumNeto + iva;
    return (
      <>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{esBruto ? 'TOTAL BRUTO:' : 'TOTAL NETO:'}</Text>
          <Text style={styles.totalValue}>
            ${sumNeto.toLocaleString('es-CL').split(',')[0]}
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
    <Text style={{ fontSize: 10, marginBottom: 4 }}>
        {order?.usuario_registro?.nombre || order?.usuario?.nombre || 'No registrado'}
    </Text>
    <Text style={{ fontSize: 8, color: '#666' }}>
        {order?.usuario_registro?.email || order?.usuario?.email || 'Sin email'}
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
        const isCanceled = order?.estado === 'anulada';
        const prefix = isCanceled ? 'Orden-Anulada' : 'orden';
        link.setAttribute('download', `${prefix}_${fileNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
	} catch (error) {
		console.error('Error al generar el PDF:', error);
		throw error;
	}
};
