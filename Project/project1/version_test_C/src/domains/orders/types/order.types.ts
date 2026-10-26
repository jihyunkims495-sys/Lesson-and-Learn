export interface ShippingDetails {
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    addressLine1: string;
    addressLine2: string;
    shippingMessage: string;
}

export interface CheckoutItem {
    productVariantId: number;
    quantity: number;
}

export interface TestPaymentItem extends CheckoutItem {
    name: string;
    option: string | null;
    unitPrice: number;
}

export interface PreparedTestPayment {
    orderId: string;
    orderName: string;
    amount: number;
    customerKey: string;
    customerName: string;
    clientKey: string;
    integration: 'window' | 'legacy';
    successUrl: string;
    failUrl: string;
}

export interface TestPaymentReceipt {
    orderId: string;
    orderNumber: string;
    orderName: string;
    amount: number;
    method: string;
    approvedAt: string;
    items: TestPaymentItem[];
    testMode: true;
}

export interface OrderHistoryEntry {
    id: string;
    order_number: string;
    status: 'submitted' | 'cancelled';
    total_amount: number;
    created_at: string;
    order_items: {
        product_name: string;
        option_text: string | null;
        quantity: number;
        unit_price: number;
    }[];
    payments: {
        toss_order_id: string;
        status: string;
        method: string | null;
        total_amount: number;
        approved_at: string | null;
        created_at: string;
    }[];
}
