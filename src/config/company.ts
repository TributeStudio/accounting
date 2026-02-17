export const COMPANY_CONFIG = {
    id: 'tribute_studio', // detailed_id
    name: 'Tribute® Studio',
    logoInitials: 'T',
    invoicePrefix: 'T', // Used for ID generation: T-CLIENT-2405-01
    address: [
        '52655 Double View Drive',
        'Idyllwild, CA 92549'
    ],
    contact: {
        email: 'billing@tribute.studio',
        phone: '+1 (310) 717-9946'
    },
    bank: {
        name: 'Wells Fargo Bank',
        address: '333 Market Street, San Francisco, CA 94105',
        routing: '121042882',
        account: '3782655249',
        beneficiary: 'Tribute Studio' // Or implied by company name
    },
    // Future proofing for UI colors if needed, though Tailwind classes are currently hardcoded
    theme: {
        color: 'slate'
    }
};
