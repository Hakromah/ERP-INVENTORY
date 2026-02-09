'use strict';

/**
 * sale controller
 */


// module.exports = createCoreController('api::sale.sale');
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::sale.sale', ({ strapi }) => ({

   // Custom method to generate the next invoice number
   async getNextInvoiceNumber(ctx) {
      try {
         const date = new Date();
         const year = date.getFullYear();
         const prefix = `INV${year}`;

         // 1. Find the last created invoice that starts with "INV{CurrentYear}"
         // We sort by invoice_number descending to get the highest one.
         const [lastInvoice] = await strapi.entityService.findMany('api::sale.sale', {
            filters: {
               invoice_number: {
                  $startsWith: prefix,
               },
            },
            sort: { invoice_number: 'desc' },
            limit: 1,
            fields: ['invoice_number'],
         });

         let nextSequence = 1;

         // 2. If an invoice exists for this year, extract the number and increment
         if (lastInvoice && lastInvoice.invoice_number) {
            // Remove "INV2026" from "INV202600000001" -> "00000001"
            const sequencePart = lastInvoice.invoice_number.replace(prefix, '');
            const lastSequence = parseInt(sequencePart, 10);

            if (!isNaN(lastSequence)) {
               nextSequence = lastSequence + 1;
            }
         }

         // 3. Format with 8-digit padding: 1 -> "00000001"
         const paddedSequence = String(nextSequence).padStart(8, '0');
         const nextInvoiceNumber = `${prefix}${paddedSequence}`;

         return ctx.send({ nextInvoiceNumber });
      } catch (err) {
         ctx.body = err;
      }
   },
}));
