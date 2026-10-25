import type {
    PreparedTestPayment,
    ShippingDetails,
    TestPaymentReceipt,
} from '@/domains/orders/types/order.types';
import type { CartItem } from '@/domains/cart/types/cart.types';

export async function paymentApi<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok)
        throw new Error(
            data.message ||
                '결제 요청을 처리하지 못했습니다. 다시 시도해 주세요.',
        );
    return data as T;
}

export function preparePayment(
    items: CartItem[],
    shipping: ShippingDetails,
    idempotencyKey: string,
) {
    return paymentApi<PreparedTestPayment>('/api/payments/toss/prepare', {
        idempotencyKey,
        items: items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
        })),
        expectedAmount: items.reduce(
            (sum, item) => sum + item.unitPriceAtAdded * item.quantity,
            0,
        ),
        shipping,
    });
}

const confirmations = new Map<string, Promise<TestPaymentReceipt>>();
export function confirmPayment(input: {
    orderId: string;
    paymentKey: string;
    amount: number;
}) {
    const key = JSON.stringify(input);
    const current = confirmations.get(key);
    if (current) return current;
    const pending = paymentApi<TestPaymentReceipt>(
        '/api/payments/toss/confirm',
        input,
    ).finally(() => confirmations.delete(key));
    confirmations.set(key, pending);
    return pending;
}

interface PaymentWindow {
    on(
        event: 'paymentRequest',
        callback: (event: { paymentMethod: { method: string } }) => void,
    ): void;
    on(event: 'cancel', callback: () => void): void;
    destroy(): Promise<void>;
}

interface Widgets {
    setAmount(amount: { value: number; currency: 'KRW' }): Promise<void>;
    renderPaymentWindow(options: { orderName: string }): Promise<PaymentWindow>;
    requestPayment(options: {
        orderId: string;
        orderName: string;
        customerName: string;
        successUrl: string;
        failUrl: string;
    }): Promise<void>;
}

type TossWindow = Window & {
    TossPayments?: (clientKey: string) => {
        widgets(options: { customerKey: string }): Widgets;
        payment(options: { customerKey: string }): {
            requestPayment(options: {
                method: 'CARD';
                amount: { value: number; currency: 'KRW' };
                orderId: string;
                orderName: string;
                customerName: string;
                successUrl: string;
                failUrl: string;
                card: { flowMode: 'DEFAULT' };
            }): Promise<void>;
        };
    };
};

export async function openTestPayment(order: PreparedTestPayment) {
    const factory = (window as TossWindow).TossPayments;
    if (!factory)
        throw new Error(
            '결제창을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.',
        );
    const toss = factory(order.clientKey);
    const { orderId, orderName, customerName, successUrl, failUrl } = order;
    const options = { orderId, orderName, customerName, successUrl, failUrl };
    if (order.integration === 'legacy') {
        await toss.payment({ customerKey: order.customerKey }).requestPayment({
            ...options,
            method: 'CARD',
            amount: { value: order.amount, currency: 'KRW' },
            card: { flowMode: 'DEFAULT' },
        });
        return;
    }
    const widgets = toss.widgets({ customerKey: order.customerKey });
    await widgets.setAmount({ value: order.amount, currency: 'KRW' });
    const paymentWindow = await widgets.renderPaymentWindow({ orderName });
    return new Promise<void>((resolve, reject) => {
        let requesting = false;
        paymentWindow.on('cancel', () => {
            void paymentWindow.destroy().then(resolve, resolve);
        });
        paymentWindow.on('paymentRequest', ({ paymentMethod }) => {
            if (requesting) return;
            if (paymentMethod.method !== 'CARD') {
                void paymentWindow
                    .destroy()
                    .catch(() => {})
                    .then(() =>
                        reject(
                            new Error(
                                '현재 테스트는 카드와 간편결제를 지원합니다. 해당 결제수단을 선택해 주세요.',
                            ),
                        ),
                    );
                return;
            }
            requesting = true;
            void widgets
                .requestPayment(options)
                .then(resolve)
                .catch((error: unknown) => {
                    void paymentWindow
                        .destroy()
                        .catch(() => {})
                        .then(() => reject(error));
                });
        });
    });
}
