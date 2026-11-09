ALTER TABLE cafe.documents ADD CONSTRAINT cafe_required_shape CHECK (
  state ?& ARRAY['menu','orders','shifts','movements','activeShiftId','nextOrder']
  AND jsonb_typeof(state->'menu')='array' AND jsonb_typeof(state->'orders')='array'
  AND jsonb_typeof(state->'shifts')='array' AND jsonb_typeof(state->'movements')='array'
  AND jsonb_typeof(state->'nextOrder')='number'
);
