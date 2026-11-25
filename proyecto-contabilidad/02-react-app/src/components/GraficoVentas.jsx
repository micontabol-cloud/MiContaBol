import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// Gráfico de ventas de Inicio. Vive aparte para que la librería de gráficos no frene
// la primera pantalla: se descarga mientras ya se ven los números.
export default function GraficoVentas({ data }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6ECF3" />
        <XAxis dataKey="mes" stroke="#64748B" fontSize={12} />
        <YAxis stroke="#64748B" fontSize={12} />
        <Tooltip formatter={(value) => `Bs ${Number(value).toFixed(2)}`} />
        <Bar dataKey="ventas" fill="#F2555A" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
