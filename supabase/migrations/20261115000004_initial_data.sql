-- =============================================================================
-- 0004 — Initial data (settings row + starter delivery zones)
-- Kept as a migration (not seed.sql) so it also runs on the hosted project
-- with `supabase db push`. Fees are PLACEHOLDERS — edit them in admin.
-- Distances are rough, measured from Computer Village, Ikeja.
-- =============================================================================

insert into public.settings (id, store_name, whatsapp_number, hub_address, pod_max_order_value)
values (true, 'Gadget Store', '2348105729893', 'Computer Village, Ikeja, Lagos', 30000000)
on conflict (id) do nothing;

insert into public.zones (name, areas, approx_distance_km, delivery_fee, default_rider_cost, sort_order)
values
  ('Ikeja',              'Computer Village, Allen, Alausa, Oregun, Opebi, Ikeja GRA',        3,   200000, 150000, 1),
  ('Ikeja Environs',     'Maryland, Ogba, Agege, Ojodu, Berger, Magodo, Ketu',               8,   300000, 220000, 2),
  ('Central Mainland',   'Yaba, Surulere, Gbagada, Ebute Metta, Mushin, Oshodi, Isolo',     12,   400000, 300000, 3),
  ('Lagos Island',       'Lagos Island, Ikoyi, Victoria Island, Obalende',                  20,   600000, 450000, 4),
  ('Lekki',              'Lekki Phase 1, Chevron, Ikota, VGC, Ajah',                         30,   800000, 600000, 5),
  ('Outer Lagos',        'Ikorodu, Festac, Ojo, Alaba, Badagry Rd, Epe, Ibeju-Lekki',        35,  1000000, 750000, 6)
on conflict (name) do nothing;
