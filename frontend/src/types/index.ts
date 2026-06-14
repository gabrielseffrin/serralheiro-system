export interface Company {
  id: string;
  name: string;
  trade_name: string | null;
  document: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo: string | null;
  default_notes: string | null;
  default_payment_method: string | null;
  default_delivery_term: string | null;
  default_warranty_term: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductLine {
  id: string;
  company_id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductColor {
  id: string;
  company_id: string;
  name: string;
  hex: string | null;
  type: 'profile' | 'accessory';
  created_at: string;
  updated_at: string;
}

export interface GlassType {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  default_line_id: string | null;
  default_line?: ProductLine;
  pricing_type: 'fixed' | 'per_m2' | 'per_meter' | 'per_kg';
  base_price: string; // Decimal returned as string from API
  requires_dimensions: boolean;
  min_width: number | null;
  min_height: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  product_id: string | null;
  product?: Product;
  tag: string | null;
  location: string | null;
  quantity: number;
  width: number | null;
  height: number | null;
  calculated_area: string | null;
  line_id: string | null;
  line?: ProductLine;
  profile_color_id: string | null;
  profile_color?: ProductColor;
  glass_type_id: string | null;
  glass_type?: GlassType;
  accessory_color_id: string | null;
  accessory_color?: ProductColor;
  unit_price: string;
  total: string;
  delivery_date: string | null;
  notes: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetStatusHistory {
  id: string;
  budget_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  company_id: string;
  customer_id: string;
  customer?: Customer;
  company?: Company;
  number: number;
  number_formatted: string;
  version: number;
  parent_budget_id: string | null;
  parent_budget?: Budget;
  status: 'draft' | 'sent' | 'viewed' | 'negotiating' | 'approved' | 'rejected' | 'expired';
  subtotal: string;
  discount: string;
  total: string;
  expiration_date: string | null;
  payment_method: string | null;
  delivery_term: string | null;
  warranty_term: string | null;
  notes: string | null;
  public_token: string;
  items?: BudgetItem[];
  status_histories?: BudgetStatusHistory[];
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_count: number;
  total_value: number;
  approved_count: number;
  approved_value: number;
  pending_count: number;
  pending_value: number;
  conversion_rate: number;
  by_status: Record<string, { count: number; value: number }>;
  recent: Array<{
    id: string;
    number_formatted: string;
    version: number;
    customer_name: string | null;
    status: Budget['status'];
    total: string;
    created_at: string;
  }>;
}
