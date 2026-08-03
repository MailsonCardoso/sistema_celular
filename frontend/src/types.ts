export type Role = 'super_admin' | 'admin' | 'tecnico' | 'atendente'

export type SubscriptionStatus = 'trial_active' | 'full_access' | 'expired'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  role_label: string
  is_active: boolean
  store_id: number | null
  created_at: string
}

export interface Store {
  id: number
  store_name: string
  owner_name: string
  cnpj_cpf: string | null
  email: string
  phone: string | null
  address: string | null
  subscription_status: SubscriptionStatus | null
  subscription_label: string | null
  is_trial: boolean
  is_expired: boolean
  trial_limit_at: string | null
  counts?: {
    users: number | null
    clients: number | null
    products: number | null
    service_orders: number | null
  }
  created_at?: string
}

export interface TrialLimits {
  is_trial: boolean
  subscription_status: SubscriptionStatus | null
  os_used: number
  os_limit: number
  clients_used: number
  clients_limit: number
  can_create_os: boolean
  can_create_client: boolean
  can_create_product: boolean
  can_see_history: boolean
  can_export: boolean
  can_see_financial: boolean
  trial_limit_at: string | null
}

export interface Client {
  id: number
  name: string
  cpf_cnpj: string | null
  email: string | null
  phone: string | null
  address: string | null
  status: 'active' | 'inactive' | null
  status_label?: string | null
  service_orders_count?: number
  created_at?: string
}

export interface Product {
  id: number
  name: string
  description: string | null
  category: 'peca' | 'acessorio'
  category_label: string
  brand: string | null
  cost_price: number
  selling_price: number
  stock_quantity: number
  min_stock_quantity: number
  status: 'active' | 'inactive'
  status_label: string
  image_url: string | null
  is_low_stock: boolean
}

export type ServiceOrderStatusValue =
  | 'opened'
  | 'awaiting_parts'
  | 'in_progress'
  | 'awaiting_approval'
  | 'completed'
  | 'delivered'
  | 'cancelled'

export interface ServiceOrderItem {
  id: number
  product_id: number
  product_name: string | null
  quantity: number
  unit_price: number
  subtotal: number
}

export interface ServiceHistory {
  id: number
  user_id: number | null
  user_name: string | null
  action_type: 'status_change' | 'comment' | 'part_added' | 'cost_update'
  action_label: string
  description: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

export interface ServiceOrderChecklist {
  items: string[]
  condition: string[]
}

export interface ServiceOrder {
  id: number
  client_id: number
  client: Client | null
  technician_id: number | null
  technician: User | null
  device_brand: string
  device_model: string
  device_imei: string | null
  device_password: string | null
  reported_issue: string
  technical_diagnosis: string | null
  status: ServiceOrderStatusValue
  status_label: string
  service_cost: number
  discount: number
  parts_total: number
  total_amount: number
  entry_date: string
  expected_delivery_at: string | null
  delivery_date: string | null
  notes: string | null
  checklist: ServiceOrderChecklist | null
  items: ServiceOrderItem[]
  history?: ServiceHistory[]
  created_at?: string
}

export interface FinancialTransaction {
  id: number
  client_id: number | null
  client: Client | null
  service_order_id: number | null
  description: string
  type: 'income' | 'expense'
  type_label: string
  category: 'service_payment' | 'parts_payment' | 'expense' | 'other'
  category_label: string
  amount: number
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | null
  payment_method_label: string | null
  status: 'pending' | 'paid' | 'cancelled'
  status_label: string
  due_date: string
  paid_date: string | null
  created_at?: string
}

export interface DashboardData {
  open_orders: number
  completed_this_month: number
  is_trial: boolean
  monthly_income?: number
  monthly_expense?: number
  monthly_balance?: number
  previous_balance?: number
  accrued_balance?: number
  pending_receivables?: number
  low_stock_count?: number
  active_clients: number
  status_counts: Record<string, number>
  recent_orders: {
    id: number
    client_name: string | null
    device: string
    status: ServiceOrderStatusValue
    status_label: string
    total_amount: number
  }[]
}

export interface Paginated<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
  links: unknown[]
}
