import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, errorMessage } from '../lib/api'
import { currency, dateBR, datetimeBR } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import type { Client, ServiceOrder } from '../types'

export default function PrintOrderPage() {
  const { id } = useParams()
  const { store } = useAuth()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.get<{ data: ServiceOrder }>(`/service-orders/${id}`)
      .then(({ data }) => {
        setOrder(data.data)
        // Wait for the render to complete before printing
        setTimeout(() => window.print(), 500)
      })
      .catch((err) => {
        setError(errorMessage(err))
      })
  }, [id])

  if (error) {
    return <div className="p-10 text-center text-rose-600 font-bold">{error}</div>
  }

  if (!order) {
    return <div className="p-10 text-center text-slate-500">Carregando dados para impressão...</div>
  }

  return (
    <div className="bg-white text-slate-900 p-8 min-h-screen">
      <div className="border-b-2 border-slate-900 pb-4 text-center">
        <h1 className="text-3xl font-bold uppercase tracking-wide">{store?.store_name ?? 'OmniOS'}</h1>
        {store?.cnpj_cpf && <p className="mt-1 font-semibold">CNPJ/CPF: {store.cnpj_cpf}</p>}
        {store?.address && <p className="text-xs">{store.address}</p>}
        <p className="text-xs">
          {store?.phone ? `Tel: ${store.phone}` : ''}
          {store?.email ? `${store.phone ? ' · ' : ''}E-mail: ${store.email}` : ''}
        </p>
      </div>

      <div className="my-4 border border-slate-900 py-2 text-center">
        <h2 className="text-xl font-bold uppercase">Ordem de Serviço</h2>
        <p className="mt-0.5 text-sm font-semibold">
          Nº {order.os_number_formatted ?? `#${order.id}`}
        </p>
      </div>

      <table className="mb-4 w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className="label-cell">Cliente</td>
            <td className="value-cell">{(order.client as Client | null)?.name ?? `#${order.client_id}`}</td>
            <td className="label-cell">CPF/CNPJ</td>
            <td className="value-cell">{(order.client as Client | null)?.cpf_cnpj ?? '—'}</td>
          </tr>
          <tr>
            <td className="label-cell">Telefone</td>
            <td className="value-cell">{(order.client as Client | null)?.phone ?? '—'}</td>
            <td className="label-cell">Data de entrada</td>
            <td className="value-cell">{dateBR(order.entry_date)}</td>
          </tr>
          <tr>
            <td className="label-cell">Aparelho</td>
            <td className="value-cell">
              {order.device_brand} {order.device_model}
              {order.device_imei ? ` · IMEI: ${order.device_imei}` : ''}
            </td>
            <td className="label-cell">Previsão</td>
            <td className="value-cell">
              {order.expected_delivery_at ? datetimeBR(order.expected_delivery_at.replace(' ', 'T')) : '—'}
            </td>
          </tr>
          <tr>
            <td className="label-cell">Técnico</td>
            <td className="value-cell">{order.technician?.name ?? 'Não atribuído'}</td>
            <td className="label-cell">Status</td>
            <td className="value-cell">{order.status_label}</td>
          </tr>
          <tr>
            <td className="label-cell">Defeito relatado</td>
            <td className="value-cell" colSpan={3}>{order.reported_issue}</td>
          </tr>
          <tr>
            <td className="label-cell">Diagnóstico técnico</td>
            <td className="value-cell" colSpan={3}>{order.technical_diagnosis ?? '—'}</td>
          </tr>
        </tbody>
      </table>

      {order.checklist &&
        (order.checklist.items.length > 0 || order.checklist.condition.length > 0) && (
          <div className="mb-4 text-sm">
            <p className="mb-1 font-semibold">Checklist de entrada</p>
            <p>
              {order.checklist.items.length > 0 && <>Itens deixados: {order.checklist.items.join(', ')}</>}
              {order.checklist.items.length > 0 && order.checklist.condition.length > 0 && ' · '}
              {order.checklist.condition.length > 0 && <>Estado: {order.checklist.condition.join(', ')}</>}
            </p>
          </div>
        )}

      <table className="mb-4 w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-900 text-left">
            <th className="py-1.5">Peça</th>
            <th className="py-1.5 text-center">Qtd</th>
            <th className="py-1.5 text-right">Unit.</th>
            <th className="py-1.5 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-slate-300">
              <td className="py-1.5">{item.product_name ?? `#${item.product_id}`}</td>
              <td className="py-1.5 text-center">{item.quantity}</td>
              <td className="py-1.5 text-right">{currency(item.unit_price)}</td>
              <td className="py-1.5 text-right">{currency(item.subtotal)}</td>
            </tr>
          ))}
          {order.items.length === 0 && (
            <tr>
              <td colSpan={4} className="py-1.5 text-slate-500">
                Nenhuma peça vinculada.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mb-8 flex justify-end text-sm">
        <div className="space-y-1 text-right">
          <p>
            Mão de obra: <strong>{currency(order.service_cost)}</strong>
          </p>
          <p>
            Peças: <strong>{currency(order.parts_total)}</strong>
          </p>
          {order.discount > 0 && (
            <p>
              Desconto: <strong>−{currency(order.discount)}</strong>
            </p>
          )}
          <p className="border-t border-slate-900 pt-1 text-base font-bold">
            TOTAL: {currency(order.total_amount)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 text-sm">
        <div className="border-t border-slate-900 pt-1 text-center">
          <span className="text-xs text-slate-600">Assinatura do cliente</span>
        </div>
        <div className="border-t border-slate-900 pt-1 text-center">
          <span className="text-xs text-slate-600">Assinatura do técnico</span>
        </div>
      </div>

      <style>{`
        .label-cell {
          width: 15%;
          border: 1px solid #94a3b8;
          background: #f1f5f9;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .value-cell {
          min-width: 35%;
          border: 1px solid #94a3b8;
          padding: 4px 8px;
        }
        @media print {
          @page { margin: 0.5cm; }
          body { 
            background: white; 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
