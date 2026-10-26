import { useRef, useState, type FormEvent } from 'react';

import AddressSearch from '@/domains/orders/components/AddressSearch';
import type { ShippingDetails } from '@/domains/orders/types/order.types';

interface CheckoutFormProps {
    formId: string;
    onSubmit: (shipping: ShippingDetails) => void;
    onChange: () => void;
    busy: boolean;
}

const fieldClassName =
    'min-h-11 w-full min-w-0 rounded-none border-0 border-b border-gray-200 bg-transparent py-2.5 text-[13px] tracking-normal text-black outline-none placeholder:text-gray-400 focus:border-black';
const labelClassName = 'flex min-w-0 flex-col gap-1 text-[11px] text-gray-500';

export default function CheckoutForm({
    formId,
    onSubmit,
    onChange,
    busy,
}: CheckoutFormProps) {
    const [postalCode, setPostalCode] = useState('');
    const [address, setAddress] = useState('');
    const [deliveryMessage, setDeliveryMessage] = useState('');
    const detailsRef = useRef<HTMLInputElement>(null);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const read = (name: string) => String(data.get(name) ?? '').trim();

        onSubmit({
            recipientName: read('recipientName'),
            recipientPhone: read('recipientPhone'),
            postalCode: read('postalCode'),
            addressLine1: read('addressLine1'),
            addressLine2: read('addressLine2'),
            shippingMessage:
                deliveryMessage === 'custom'
                    ? read('customMessage')
                    : deliveryMessage,
        });
    }

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            onChange={onChange}
            className="min-w-0"
            aria-busy={busy}
        >
            <fieldset disabled={busy} className="mb-10 min-w-0">
                <legend className="mb-6 flex items-center gap-4 text-xs tracking-widest">
                    <span className="text-gray-400">01</span> 배송지 정보
                </legend>
                <div className="grid min-w-0 gap-x-5 gap-y-5 sm:grid-cols-2">
                    <label className={labelClassName}>
                        받는 분
                        <input
                            name="recipientName"
                            autoComplete="shipping name"
                            placeholder="받는 분의 이름을 입력해 주세요"
                            required
                            pattern=".*\S.*"
                            maxLength={100}
                            className={fieldClassName}
                        />
                    </label>
                    <label className={labelClassName}>
                        연락처
                        <input
                            name="recipientPhone"
                            type="tel"
                            autoComplete="shipping tel"
                            placeholder="010-0000-0000"
                            required
                            pattern={String.raw`\+?[0-9][0-9\s\-]{8,19}`}
                            maxLength={20}
                            title="숫자, 공백, 하이픈으로 연락처를 9~20자 입력해 주세요. 국가번호 앞에는 +를 사용할 수 있습니다."
                            className={fieldClassName}
                        />
                    </label>
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:col-span-2">
                        <label className={labelClassName}>
                            우편번호
                            <input
                                name="postalCode"
                                autoComplete="shipping postal-code"
                                inputMode="numeric"
                                placeholder="우편번호 5자리"
                                required
                                pattern="[0-9]{5}"
                                maxLength={5}
                                title="우편번호 5자리를 입력해 주세요."
                                value={postalCode}
                                onChange={(event) =>
                                    setPostalCode(event.target.value)
                                }
                                className={fieldClassName}
                            />
                        </label>
                        <AddressSearch
                            finalFocus={detailsRef}
                            onSelect={(selection) => {
                                setPostalCode(selection.postalCode);
                                setAddress(selection.address);
                                onChange();
                            }}
                        />
                    </div>
                    <label className={`${labelClassName} sm:col-span-2`}>
                        주소
                        <input
                            name="addressLine1"
                            autoComplete="shipping address-line1"
                            placeholder="기본 주소를 입력해 주세요"
                            required
                            pattern=".*\S.*"
                            maxLength={200}
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            className={fieldClassName}
                        />
                    </label>
                    <label className={`${labelClassName} sm:col-span-2`}>
                        상세 주소 <span className="sr-only">(선택)</span>
                        <input
                            ref={detailsRef}
                            name="addressLine2"
                            autoComplete="shipping address-line2"
                            placeholder="동, 호수 등 상세 주소 (선택)"
                            maxLength={200}
                            className={fieldClassName}
                        />
                    </label>
                    <label className={`${labelClassName} sm:col-span-2`}>
                        배송 요청사항
                        <select
                            name="deliveryInstructions"
                            value={deliveryMessage}
                            onChange={(event) =>
                                setDeliveryMessage(event.target.value)
                            }
                            className={fieldClassName}
                        >
                            <option value="">
                                배송 요청사항을 선택해 주세요 (선택)
                            </option>
                            <option value="문 앞에 놓아 주세요">
                                문 앞에 놓아 주세요
                            </option>
                            <option value="배송 전에 연락해 주세요">
                                배송 전에 연락해 주세요
                            </option>
                            <option value="경비실에 맡겨 주세요">
                                경비실에 맡겨 주세요
                            </option>
                            <option value="custom">직접 입력</option>
                        </select>
                    </label>
                    {deliveryMessage === 'custom' && (
                        <label className={`${labelClassName} sm:col-span-2`}>
                            요청사항 직접 입력
                            <textarea
                                name="customMessage"
                                placeholder="배송 기사님께 전달할 내용을 입력해 주세요"
                                rows={2}
                                maxLength={200}
                                className={fieldClassName}
                            />
                        </label>
                    )}
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
                    현재 국내 배송만 가능합니다.
                </p>
            </fieldset>

            <fieldset disabled={busy} className="mb-10 min-w-0">
                <legend className="mb-6 flex items-center gap-4 text-xs tracking-widest">
                    <span className="text-gray-400">02</span> 배송 안내
                </legend>
                <div className="flex items-center justify-between gap-4 border-y border-gray-200 py-5 text-xs">
                    <span>일반 배송</span>
                    <span>무료</span>
                </div>
            </fieldset>

            <fieldset disabled={busy} className="min-w-0">
                <legend className="mb-6 flex items-center gap-4 text-xs tracking-widest">
                    <span className="text-gray-400">03</span> 주문 확인
                </legend>
                <p className="text-xs leading-6 text-gray-500">
                    결제 전 주문 상품과 배송지, 결제 금액을 확인해 주세요.
                </p>
                <label className="mt-5 flex cursor-pointer items-start gap-3 text-[11px] leading-relaxed text-gray-600">
                    <input
                        name="orderReviewed"
                        type="checkbox"
                        required
                        className="mt-0.5 size-3.5 shrink-0 accent-black"
                    />
                    주문 내용과 배송지 정보를 확인했습니다. (필수)
                </label>
            </fieldset>
        </form>
    );
}
