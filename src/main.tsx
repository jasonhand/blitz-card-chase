import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

console.log('Initializing Datadog RUM...');

try {
  datadogRum.init({
    applicationId: '3f303b3a-fe48-4df4-89cc-04a5fe2bf3be',
    clientToken: 'pub40fedb2ee10a024a531bc40755bd4d0e',
    site: 'datadoghq.com',
    service: 'blitz-card-game',
    env: 'prod',
    version: '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    defaultPrivacyLevel: 'mask-user-input',
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    plugins: [reactPlugin({ router: true })],
  });
  
  console.log('✓ Datadog RUM initialized successfully');
  
  // Start the RUM session explicitly
  datadogRum.startSessionReplayRecording();
  
} catch (error) {
  console.error('✗ Failed to initialize Datadog RUM:', error);
}

console.log('Datadog RUM initialized:', datadogRum);

// Add a test event to verify RUM is working
datadogRum.addAction('app_loaded', {
    message: 'Blitz Card Chase app loaded successfully'
});

createRoot(document.getElementById("root")!).render(<App />);
