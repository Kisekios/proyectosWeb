import './config/env.js';
import { initPortfolioCluster } from './clusters/portfolioCluster.js'
import { createAllIndexes } from './utils/indicesMongodb.js';

let portfolio, destinos;

export async function initDatabasesClusterOne() {
  try {
    const dbs = await initPortfolioCluster();
    portfolio = dbs.db1;
    destinos = dbs.db2;
    await createAllIndexes();
  } catch (error) {
    console.error('Error al inicializar las bases de datos:', error.message);
  }
}

export { portfolio, destinos };