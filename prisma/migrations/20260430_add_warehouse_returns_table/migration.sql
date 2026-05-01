-- Create warehouse_returns table
CREATE TABLE warehouse.warehouse_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_no VARCHAR(100) NOT NULL UNIQUE,
    return_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_by VARCHAR(100) NOT NULL,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_warehouse_returns_ref_no FOREIGN KEY (ref_no) REFERENCES sales.t_order(ref_no) ON DELETE RESTRICT
);

CREATE INDEX idx_warehouse_returns_ref_no ON warehouse.warehouse_returns(ref_no);
CREATE INDEX idx_warehouse_returns_status ON warehouse.warehouse_returns(status);

-- Create warehouse_return_items table
CREATE TABLE warehouse.warehouse_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL,
    sku VARCHAR(100) NOT NULL,
    inv_code VARCHAR(100) NOT NULL,
    qty_returned INT NOT NULL,
    qty_good INT,
    qty_damaged INT,
    unit_cost DECIMAL(18, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_warehouse_return_items_return_id FOREIGN KEY (return_id) REFERENCES warehouse.warehouse_returns(id) ON DELETE CASCADE,
    CONSTRAINT fk_warehouse_return_items_sku FOREIGN KEY (sku) REFERENCES product.master_product(sku) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouse_return_items_inv_code FOREIGN KEY (inv_code) REFERENCES product.master_inventory(inv_code) ON DELETE RESTRICT,
    CONSTRAINT uq_warehouse_return_items_return_sku UNIQUE (return_id, sku)
);

CREATE INDEX idx_warehouse_return_items_return_id ON warehouse.warehouse_return_items(return_id);
CREATE INDEX idx_warehouse_return_items_inv_code ON warehouse.warehouse_return_items(inv_code);