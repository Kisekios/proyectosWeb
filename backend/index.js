import './config/env.js';
import {initPortfolioCluster} from './clusters/portfolioCluster.js'

try {
  initPortfolioCluster();
} catch (error) {
  console.error(error.message); // Mostramos solo el mensaje de error limpio
}
