
module.exports = {
   async beforeDelete(event) {
      const { where } = event.params;

      // 1. Fetch the sale data BEFORE it gets deleted.
      // We must populate 'products' and the nested 'product' relation
      // to know which items to restock and how many.
      const sale = await strapi.entityService.findOne('api::sale.sale', where.id, {
         populate: {
            products: {
               populate: ['product'],
            },
         },
      });

      // If the sale wasn't found, stop here.
      if (!sale) return;

      // 2. Loop through every product item in this sale
      // @ts-ignore: "products" exists because we populated it, but TS doesn't know.
      for (const item of sale.products) {
         // Check if the item has a valid product relation and a quantity
         if (item.product && item.quantity) {
            try {
               // 3. Find the current product to get its latest stock level
               const product = await strapi.entityService.findOne(
                  'api::product.product',
                  item.product.id
               );

               if (product) {
                  // 4. Update the product stock (Current Stock + Sold Quantity)
                  await strapi.entityService.update('api::product.product', item.product.id, {
                     data: {
                        stock: product.stock + item.quantity,
                     },
                  });

                  console.log(`Restored ${item.quantity} stock for product ID: ${item.product.id}`);
               }
            } catch (err) {
               console.error(`Failed to restore stock for product ID ${item.product.id}`, err);
               // Optional: Throw an error here if you want to prevent the deletion
               // in case the stock restoration fails.
            }
         }
      }
   },
};
