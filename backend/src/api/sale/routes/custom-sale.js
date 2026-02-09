module.exports = {
   routes: [
      {
         method: 'GET',
         path: '/sales/next-invoice-number',
         handler: 'sale.getNextInvoiceNumber',
         config: {
            policies: [],
            middlewares: [],
         },
      },
   ],
};
