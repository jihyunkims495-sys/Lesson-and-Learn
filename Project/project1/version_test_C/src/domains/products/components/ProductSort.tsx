'use client';

import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
    PRODUCT_SORT_OPTIONS,
    type ProductSortOrder,
} from '@/domains/products/utils/sortProducts';

interface ProductSortProps {
    value: ProductSortOrder;
    onValueChange: (value: ProductSortOrder) => void;
}

export default function ProductSort({
    value,
    onValueChange,
}: ProductSortProps) {
    const label = PRODUCT_SORT_OPTIONS.find(
        (option) => option.value === value,
    )!.label;

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger
                aria-label={`Sort: ${label}`}
                className="flex min-h-13 w-48 cursor-pointer items-center justify-between gap-4 rounded-xl bg-white px-4 py-4 text-sm whitespace-nowrap text-black shadow-md outline-offset-4 focus-visible:outline-2 data-popup-open:[&_svg]:rotate-180"
            >
                <span>{label}</span>
                <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-gray-400"
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                aria-label="Sort order"
                className="w-56 rounded-xl bg-white p-1.5 shadow-lg ring-0"
            >
                <DropdownMenuRadioGroup
                    value={value}
                    onValueChange={(nextValue) => {
                        if (
                            PRODUCT_SORT_OPTIONS.some(
                                (option) => option.value === nextValue,
                            )
                        ) {
                            onValueChange(nextValue);
                        }
                    }}
                >
                    {PRODUCT_SORT_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                            closeOnClick
                            className="min-h-11 cursor-pointer rounded-lg py-3 pr-9 pl-3.5 text-gray-400 focus:bg-neutral-100 focus:text-black data-checked:bg-neutral-100 data-checked:text-black"
                        >
                            {option.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
