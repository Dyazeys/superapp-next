ALTER TABLE product.product_bom
DROP CONSTRAINT IF EXISTS chk_product_bom_component_group;

ALTER TABLE product.product_bom
ADD CONSTRAINT chk_product_bom_component_group
CHECK (
  component_group IN (
    'MAIN',
    'MATERIAL',
    'PACKING',
    'ACCESSORY',
    'LABOR',
    'BRANDING',
    'OTHER_COST'
  )
);
