import cron from 'node-cron';
import { processPendingTrades } from './function';      

// Schedule task to run at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running pending trades cleanup',new Date().toISOString());
    await processPendingTrades();
    console.log('Successfully ran pending trades cleanup');
  } catch (error) {
    console.error('Failed to run pending trades cleanup:', error);
  }
}); 