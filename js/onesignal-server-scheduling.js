// OneSignal Server-Side Scheduling Integration
// This allows notifications to be visible and manageable from OneSignal dashboard

class OneSignalServerScheduler {
    constructor(appId, restApiKey) {
        this.appId = appId;
        this.restApiKey = restApiKey;
        this.baseUrl = 'https://onesignal.com/api/v1';
        this.scheduledNotifications = [];
    }

    // Schedule a notification via OneSignal REST API (visible on dashboard)
    async scheduleServerNotification(title, message, scheduledTime, data = {}) {
        try {
            const notificationData = {
                app_id: this.appId,
                headings: { en: title },
                contents: { en: message },
                send_after: scheduledTime.toISOString(),
                included_segments: ["Subscribed Users"], // Send to all subscribed users
                data: {
                    ...data,
                    scheduled_by: 'prayer_times_app',
                    type: 'prayer_notification'
                },
                chrome_web_icon: window.location.origin + '/images/icon.png',
                chrome_web_badge: window.location.origin + '/images/badge.png'
            };

            const response = await fetch(`${this.baseUrl}/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${this.restApiKey}`
                },
                body: JSON.stringify(notificationData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Server-scheduled notification created:', result.id);
                
                this.scheduledNotifications.push({
                    id: result.id,
                    title,
                    message,
                    scheduledTime,
                    data
                });
                
                return result.id;
            } else {
                const error = await response.text();
                console.error('❌ Failed to schedule server notification:', error);
                return null;
            }
        } catch (error) {
            console.error('❌ Error scheduling server notification:', error);
            return null;
        }
    }

    // Schedule all prayer notifications for a day (visible on OneSignal dashboard)
    async schedulePrayerNotificationsForDay(prayerTimes, notificationMode) {
        console.log('📅 Scheduling prayer notifications via OneSignal server API...');
        
        // Clear any existing scheduled notifications first
        await this.cancelAllScheduledNotifications();
        
        const scheduledIds = [];
        
        for (const prayer of prayerTimes) {
            let shouldSchedule = false;
            
            // Check notification mode
            if (notificationMode === 1 && prayer.type === 'prayer') {
                shouldSchedule = true; // Only obligatory prayers
            } else if (notificationMode === 2 && (prayer.type === 'prayer' || prayer.type === 'optional')) {
                shouldSchedule = true; // All prayers including optional
            }
            
            if (shouldSchedule) {
                const startTime = new Date(prayer.startParsed);
                const endTime = new Date(prayer.endParsed);
                const now = new Date();
                
                // Schedule 1 minute before start
                const oneMinuteBefore = new Date(startTime.getTime() - 60000);
                if (oneMinuteBefore > now) {
                    const id1 = await this.scheduleServerNotification(
                        `${prayer.name} Time Soon`,
                        `${prayer.name} prayer will start in 1 minute.`,
                        oneMinuteBefore,
                        { prayer: prayer.name, type: 'start_reminder' }
                    );
                    if (id1) scheduledIds.push(id1);
                }
                
                // Schedule 15 minutes before end
                const fifteenMinutesBefore = new Date(endTime.getTime() - 900000);
                if (fifteenMinutesBefore > now) {
                    const id2 = await this.scheduleServerNotification(
                        `${prayer.name} Time Ending`,
                        `${prayer.name} prayer time will end in 15 minutes.`,
                        fifteenMinutesBefore,
                        { prayer: prayer.name, type: 'end_warning' }
                    );
                    if (id2) scheduledIds.push(id2);
                }
                
                // Note: Missed prayer notifications would need to be handled differently
                // as they depend on user interaction (marking prayer as complete)
            }
        }
        
        console.log(`✅ Scheduled ${scheduledIds.length} notifications on OneSignal server`);
        return scheduledIds;
    }

    // Cancel all scheduled notifications
    async cancelAllScheduledNotifications() {
        console.log('🗑️ Canceling existing scheduled notifications...');
        
        for (const notification of this.scheduledNotifications) {
            try {
                const response = await fetch(`${this.baseUrl}/notifications/${notification.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Basic ${this.restApiKey}`
                    }
                });
                
                if (response.ok) {
                    console.log('✅ Canceled notification:', notification.id);
                } else {
                    console.warn('⚠️ Failed to cancel notification:', notification.id);
                }
            } catch (error) {
                console.error('❌ Error canceling notification:', notification.id, error);
            }
        }
        
        this.scheduledNotifications = [];
    }

    // Get all scheduled notifications from OneSignal
    async getScheduledNotifications() {
        try {
            const response = await fetch(`${this.baseUrl}/notifications?app_id=${this.appId}&kind=1`, {
                headers: {
                    'Authorization': `Basic ${this.restApiKey}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.notifications.filter(n => 
                    n.data && n.data.scheduled_by === 'prayer_times_app'
                );
            } else {
                console.error('Failed to fetch scheduled notifications');
                return [];
            }
        } catch (error) {
            console.error('Error fetching scheduled notifications:', error);
            return [];
        }
    }
}

// Example usage (you would need to add your REST API key)
window.OneSignalServerScheduler = OneSignalServerScheduler;

// To enable server scheduling, you would use:
/*
const scheduler = new OneSignalServerScheduler(
    '8126963e-3e5f-4095-8515-5f23fad6be55', // Your app ID
    'YOUR_REST_API_KEY' // You need to get this from OneSignal dashboard
);

// Schedule prayers for the day (these will be visible on OneSignal dashboard)
scheduler.schedulePrayerNotificationsForDay(prayerTimes, notificationMode);
*/
