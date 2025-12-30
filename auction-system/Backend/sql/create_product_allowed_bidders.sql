-- Create table for tracking bidder permissions
CREATE TABLE IF NOT EXISTS public.product_allowed_bidders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  bidder_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_allowed_bidders_pkey PRIMARY KEY (id),
  CONSTRAINT product_allowed_bidders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_allowed_bidders_bidder_id_fkey FOREIGN KEY (bidder_id) REFERENCES public.profiles(id),
  -- Ensure one request per bidder per product
  CONSTRAINT product_allowed_bidders_unique_request UNIQUE (product_id, bidder_id)
);

-- Enable RLS (Optional, depending on your setup, but good practice)
ALTER TABLE public.product_allowed_bidders ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now)
-- Seller can view requests for their products
CREATE POLICY "Sellers can view requests for their products" 
ON public.product_allowed_bidders FOR SELECT 
USING (
  exists (
    select 1 from public.products
    where products.id = product_allowed_bidders.product_id
    and products.seller_id = auth.uid()
  )
);

-- Seller can update requests (approve/reject)
CREATE POLICY "Sellers can update requests for their products" 
ON public.product_allowed_bidders FOR UPDATE
USING (
  exists (
    select 1 from public.products
    where products.id = product_allowed_bidders.product_id
    and products.seller_id = auth.uid()
  )
);

-- Bidders can view their own requests
CREATE POLICY "Bidders can view their own requests" 
ON public.product_allowed_bidders FOR SELECT 
USING (bidder_id = auth.uid());

-- Bidders can insert requests
CREATE POLICY "Bidders can create requests" 
ON public.product_allowed_bidders FOR INSERT 
WITH CHECK (bidder_id = auth.uid());
