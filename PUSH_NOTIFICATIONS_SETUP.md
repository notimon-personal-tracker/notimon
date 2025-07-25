# Push Notifications Setup Guide

This guide explains how to set up web push notifications

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
# VAPID Keys for Web Push (generate using web-push library)
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here

# Email for VAPID (replace with your email)
VAPID_CONTACT=your-email@example.com
```

## Generating VAPID Keys

1. Install the web-push library globally:
```bash
npm install -g web-push
```

2. Generate VAPID keys:
```bash
web-push generate-vapid-keys
```

3. Copy the generated public and private keys to your environment variables.

## Features Implemented

✅ **Web Push for Chrome/Firefox:** Using VAPID keys and service worker
✅ **Database Storage:** Push subscriptions stored in PostgreSQL
✅ **User Management:** Subscribe/unsubscribe functionality
✅ **Daily Notifications:** Integrated with `send-questions` command
✅ **Service Worker:** Handles push events and notification clicks
✅ **PWA Support:** Manifest and offline functionality

## How It Works

1. **User subscribes to push notifications:**
   - Browser requests permission
   - Service worker creates push subscription
   - Subscription saved to database with user association

2. **Daily questions command runs:**
   - Finds users with question subscriptions AND push subscriptions
   - Sends "Time to fill in your answers!" message

3. **User receives notification:**
   - Notification shows with app icon
   - Clicking opens the app to /questions page
   - Service worker handles offline caching

## Testing Push Notifications

1. **Development Testing:**
```bash
# Test the send-questions command
npm run send-questions
```

2. **Browser Testing:**
   - Go to Account page
   - Enable push notifications
   - Check browser developer tools for service worker registration
   - Test notification permission flow

## Troubleshooting

### Common Issues:

1. **VAPID keys not working:**
   - Ensure keys are properly base64 encoded
   - Check that public key matches in client and server

3. **Service worker not registering:**
   - Ensure HTTPS in production
   - Check browser console for errors
   - Verify service worker file is accessible at `/sw.js`

4. **Notifications not appearing:**
   - Check browser notification permissions
   - Verify user has both question subscriptions AND push subscriptions
   - Check server logs for push sending errors

## Production Deployment

1. **HTTPS Required:** Push notifications require HTTPS in production
2. **Service Worker:** Ensure `/sw.js` is served correctly
3. **Icons:** All icon files are generated from `public/logo.png`
4. **Manifest:** PWA manifest configured for better mobile experience

## Cron Job Setup

Set up the daily notifications to run automatically:

```bash
# Example: Run daily at 9 AM
0 9 * * * cd /path/to/notimon && /usr/local/bin/npm run send-questions
```

## Security Considerations

- VAPID keys should be kept secure and not committed to version control
- Push subscriptions are tied to user accounts for privacy
- Service worker caches are versioned to prevent stale data 