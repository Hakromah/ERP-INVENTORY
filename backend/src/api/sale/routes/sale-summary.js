module.exports = {
   routes: [
      {
         method: 'GET',
         path: '/sales/summary/:period',
         handler: 'sale-summary.getSummary',
         config: {
            policies: [],
            middlewares: [],
         },
      },
      {
         method: 'GET',
         path: '/sales/summary/',
         handler: 'sale-summary.getAllSummaries',
         config: {
            policies: [],
            middlewares: [],
         },
      },

      {
         method: 'GET',
         path: '/sales/chartData/',
         handler: 'sale-summary.getChartData',
         config: {
            policies: [],
            middlewares: [],
         },
      }
   ],
}
