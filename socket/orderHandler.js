import { getCollection } from "../config/database.js";
import { calculateTotals, createOrderDocument, generateOrderId, validateOrderData } from "../utils/helper.js";

export const orderHandler = (io, socket) => {
    console.log(`User connected: ${socket.id}`)

    //Customer Events

    //Place Order
    socket.on('placeOrder', async (data, callback) => {
        try {
            console.log(`Place order from: ${socket.id}`);
            const validation = validateOrderData(data);
            if (!validation.valid) {
                if (typeof callback === 'function') {
                    callback({ success: false, message: validation.message });
                }
                return;
            }

            const totals = calculateTotals(data.items);
            const orderId = generateOrderId();
            const order = createOrderDocument(data, orderId, totals);

            const ordersCollection = getCollection('orders');
            await ordersCollection.insertOne(order);

            socket.join(`order_${orderId}`);
            socket.join('customers');

            io.to('admins').emit('newOrder', { order });

            if (typeof callback === 'function') {
                callback({ success: true, order });
            }
            console.log(`✅ Order created: ${orderId}`);
        }
        catch (err) {
            console.error('Error placing order:', err);
            if (typeof callback === 'function') {
                callback({ success: false, message: err.message });
            }
        }
    })
}