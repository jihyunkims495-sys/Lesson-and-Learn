import { requirePaymentUser } from '@/domains/orders/server/paymentDatabase';
import { paymentErrorResponse } from '@/domains/orders/server/paymentRoute';
import { PaymentError } from '@/domains/orders/server/testPaymentValidation';
import { getSupabaseRouteClient } from '@/shared/lib/supabase/server';

export async function GET() {
    try {
        const user = await requirePaymentUser();
        const client = await getSupabaseRouteClient();
        const { data, error } = await client
            .from('orders')
            .select(
                `
            id,order_number,status,total_amount,created_at,
            order_items(product_name,option_text,unit_price,quantity),
            payments(toss_order_id,status,method,total_amount,approved_at,created_at)
        `,
            )
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error)
            throw new PaymentError(
                'HISTORY_UNAVAILABLE',
                '주문 내역을 불러오지 못했습니다.',
                503,
            );
        return Response.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        return paymentErrorResponse(error);
    }
}
