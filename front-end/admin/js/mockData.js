/**
 * Mock Data Helpers — generate IDs and random data
 */
const MockData = {
    generateOrderId() {
        return 'ORD-' + (1000 + Math.floor(Math.random() * 9000));
    },

    generateTransferId() {
        return 'TRF-' + (2000 + Math.floor(Math.random() * 8000));
    },

    generateShipmentId() {
        return 'SHP-' + (5000 + Math.floor(Math.random() * 5000));
    },

    generateComplaintId() {
        return 'CMP-' + (3000 + Math.floor(Math.random() * 7000));
    },

    hubs: ['Hub Central', 'Hub North', 'Hub South', 'Hub East', 'Hub West'],
    
    priorities: ['Low', 'Medium', 'High', 'Critical'],
    
    cargoTypes: ['Electronics', 'Perishables', 'Documents', 'Fragile Goods', 'Textiles', 'Medical Supplies', 'Machinery Parts', 'Food Packages', 'Chemicals', 'Furniture'],

    complaintTypes: ['Late Delivery', 'Damaged Package', 'Wrong Item', 'Missing Item', 'Rude Behaviour', 'Overcharged', 'Non-Delivery', 'Refund Issue'],

    todayDate() {
        return new Date().toISOString().split('T')[0];
    }
};
