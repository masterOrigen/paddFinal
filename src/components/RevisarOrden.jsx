import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RevisarOrden = () => {
	const [orders, setOrders] = useState([]);
	const [plans, setPlans] = useState({});

	useEffect(() => {
		// Fetch orders data
		const fetchOrders = async () => {
			try {
				const response = await axios.get('http://localhost:5000/api/ordenes');
				setOrders(response.data);
			} catch (error) {
				console.error('Error fetching orders:', error);
			}
		};

		// Fetch plans data
		const fetchPlans = async () => {
			try {
				const response = await axios.get('http://localhost:5000/api/planes');
				const planMap = response.data.reduce((acc, plan) => {
					acc[plan.id_plan] = plan.nombre_plan;
					return acc;
				}, {});
				setPlans(planMap);
			} catch (error) {
				console.error('Error fetching plans:', error);
			}
		};

		fetchOrders();
		fetchPlans();
	}, []);

	return (
		<div className="container mt-4">
			<h2 className="mb-4">Revisar Órdenes</h2>
			<table className="table table-striped">
				<thead>
					<tr>
						<th>ID Orden</th>
						<th>Plan</th>
						<th>Fecha Creación</th>
						<th>Estado</th>
					</tr>
				</thead>
				<tbody>
					{orders.map((order) => (
						<tr key={order.id_ordenes_de_comprar}>
							<td>{order.id_ordenes_de_comprar}</td>
							<td>{plans[order.id_plan] || 'No especificado'}</td>
							<td>{new Date(order.fechaCreacion).toLocaleDateString()}</td>
							<td>{order.estado}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default RevisarOrden;