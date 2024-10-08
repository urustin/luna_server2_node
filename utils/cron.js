// cron.js
import cron from 'node-cron';
import { sendEmail } from './mail.js';
import { addNewWeekToAllUsers } from '../routes/weeklyChecker.js';



const updateEmail = async () => {
  try {
    await sendEmail('urustin@naver.com', 'weeks are updated!', 'weeklychecker update!');
    console.log('email sent successfully');
  } catch (error) {
    console.error('Failed to send email: ', error);
  }
};



export const initCronJobs = () => {
  cron.schedule('0 0 * * 1', async () => {
    console.log('Running weekly task to add new week');
    await updateEmail();
    await addNewWeekToAllUsers();
  }, {
    timezone: "Asia/Seoul"
  });
};