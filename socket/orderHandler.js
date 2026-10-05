import { getCollection } from "../config/database";
import { calculateTotals, createOrderDocument, generateOrderId } from "../utils/helper.js";

export const orderHandler = (io, socket) => {
    console.log(`User connected: ${socket.id}`)

    //Customer Events

    //Place Order
    socket.on('placeOrder', async (data, callback) => {
        try{
            console.log(`Place order from: ${socket.id}`);
            const validation = validateOrderData(data);
            if (!validation.data) {
                return callback({success: false, message: validation.message})
            }

            const totals = calculateTotals(data.items);
            const orderId = generateOrderId();
            const order = createOrderDocument(data, orderId, totals);

            const ordersCollection = getCollection('orders');
            await ordersCollection.insertOne(order);

            socket.join(`order_${orderId}`);
            socket.join('customers');

            io.to('admins').emit('newOrder', { order });

            callback({ success: true, order });
            console.log(`✅ Order created: ${orderId}`);
        }
        catch (err) {
            
        }
    })
}