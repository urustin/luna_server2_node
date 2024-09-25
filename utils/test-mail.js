import { sendEmail } from './mail.js';

const testEmail = async () => {
  try {
    await sendEmail('urustin@naver.com', 'Test Subject', 'This is a test email from Node.js');
    console.log('Test email sent successfully');
  } catch (error) {
    console.error('Failed to send test email: ', error);
  }
};

testEmail();