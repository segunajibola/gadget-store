-- =============================================================================
-- 0005 — create_order(): insert an order + its items in ONE transaction.
--
-- A Postgres function runs atomically: if any item insert fails, the whole
-- order is rolled back, so we never end up with an order that has no items.
--
-- Prices are computed by the app server (from the products table) BEFORE
-- calling this; the browser never supplies prices.
-- Callable only with the service-role key (server code), not by anon users.
-- =============================================================================

create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  insert into public.orders (
    customer_name, customer_phone, customer_email,
    delivery_address, delivery_notes,
    zone_id, zone_name,
    subtotal, delivery_fee, rider_cost,
    payment_method
  )
  values (
    p_order->>'customer_name',
    p_order->>'customer_phone',
    nullif(p_order->>'customer_email', ''),
    p_order->>'delivery_address',
    nullif(p_order->>'delivery_notes', ''),
    (p_order->>'zone_id')::uuid,
    p_order->>'zone_name',
    (p_order->>'subtotal')::bigint,
    (p_order->>'delivery_fee')::bigint,
    (p_order->>'rider_cost')::bigint,
    (p_order->>'payment_method')::public.payment_method
  )
  returning * into v_order;

  insert into public.order_items (
    order_id, product_id, product_name, product_slug,
    unit_price, unit_cost, quantity, vendor_id
  )
  select
    v_order.id,
    (item->>'product_id')::uuid,
    item->>'product_name',
    item->>'product_slug',
    (item->>'unit_price')::bigint,
    (item->>'unit_cost')::bigint,
    (item->>'quantity')::int,
    nullif(item->>'vendor_id', '')::uuid
  from jsonb_array_elements(p_items) as item;

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'total', v_order.total
  );
end;
$$;

-- Server-only.
revoke execute on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;
