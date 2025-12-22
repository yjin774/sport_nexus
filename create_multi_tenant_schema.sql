-- ============================================
-- MULTI-TENANT SCHEMA MIGRATION
-- This script sets up multi-tenancy for scalable POS system
-- Each organization/tenant gets isolated data
-- ============================================

-- Step 1: Create organizations table (tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_name text NOT NULL,
  business_email text NOT NULL UNIQUE,
  business_contact text,
  business_ssm_reg_num text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Step 2: Add tenant_id (organization_id) to all relevant tables
-- Add to staff table
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to supplier table
ALTER TABLE public.supplier 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to member table (if exists)
ALTER TABLE public.member 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to product_variants table
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to purchase_orders table
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to purchase_order_items table
ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to transaction_items table
ALTER TABLE public.transaction_items 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to stock_take_requests table
ALTER TABLE public.stock_take_requests 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to stock_take_items table
ALTER TABLE public.stock_take_items 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to return_goods table
ALTER TABLE public.return_goods 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add to activity_logs table
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_staff_organization_id ON public.staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_organization_id ON public.supplier(organization_id);
CREATE INDEX IF NOT EXISTS idx_member_organization_id ON public.member(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_organization_id ON public.product_variants(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization_id ON public.purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON public.transactions(organization_id);

-- Step 4: Enable Row Level Security (RLS) on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for organizations
-- Policy: Users can read their own organization
CREATE POLICY "Users can read their own organization"
ON public.organizations
FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM public.staff WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.supplier WHERE user_id = auth.uid()
  )
);

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role can manage organizations"
ON public.organizations
FOR ALL
USING (auth.role() = 'service_role');

-- Step 6: Create function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create trigger for organizations table
CREATE TRIGGER update_organizations_updated_at 
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.organizations TO anon, authenticated;
