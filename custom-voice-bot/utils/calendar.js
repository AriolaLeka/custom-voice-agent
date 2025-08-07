const { google } = require('googleapis');
const path = require('path');

// Initialize Google Calendar API
let calendar = null;

async function initCalendar() {
  if (!calendar) {
    try {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log('⚠️  Google Calendar credentials not found, calendar features disabled');
        return null;
      }
      
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/calendar']
      });

      calendar = google.calendar({ version: 'v3', auth });
      console.log('✅ Google Calendar API initialized');
    } catch (error) {
      console.error('❌ Error initializing Google Calendar:', error);
      calendar = null;
    }
  }
  return calendar;
}

// Create calendar event
async function createCalendarEvent(appointmentData) {
  try {
    const { clientName, service, date, time, email, phone } = appointmentData;
    
    if (!calendar) {
      await initCalendar();
    }
    
    if (!calendar) {
      return {
        success: false,
        error: 'Google Calendar not configured'
      };
    }
    
    // Format date and time
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const event = {
      summary: `${service} - ${clientName}`,
      description: `Appointment for ${service}\nClient: ${clientName}\nPhone: ${phone}\nEmail: ${email}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Madrid'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Madrid'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 } // 30 minutes before
        ]
      }
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });
    
    console.log('✅ Calendar event created:', response.data.id);
    
    return {
      success: true,
      eventId: response.data.id,
      eventUrl: response.data.htmlLink
    };
    
  } catch (error) {
    console.error('❌ Error creating calendar event:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get available times for a date
async function getAvailableTimes(date) {
  try {
    if (!calendar) {
      await initCalendar();
    }
    
    if (!calendar) {
      // Return default business hours if calendar not configured
      return [
        '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30'
      ];
    }
    
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    // Business hours: 10:00 AM - 6:00 PM
    const businessHours = [];
    for (let hour = 10; hour < 18; hour++) {
      businessHours.push(`${hour.toString().padStart(2, '0')}:00`);
      businessHours.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    // Remove booked times
    const bookedTimes = response.data.items.map(event => {
      const start = new Date(event.start.dateTime);
      return start.toTimeString().slice(0, 5);
    });
    
    const availableTimes = businessHours.filter(time => !bookedTimes.includes(time));
    
    return availableTimes;
    
  } catch (error) {
    console.error('Error getting available times:', error);
    return [];
  }
}

// Check if a time is available
async function isTimeAvailable(date, time) {
  try {
    const availableTimes = await getAvailableTimes(date);
    return availableTimes.includes(time);
  } catch (error) {
    console.error('Error checking time availability:', error);
    return false;
  }
}

// Cancel an appointment
async function cancelAppointment(eventId) {
  try {
    if (!calendar) {
      await initCalendar();
    }
    
    if (!calendar) {
      return {
        success: false,
        error: 'Google Calendar not configured'
      };
    }
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });
    
    console.log('✅ Calendar event cancelled:', eventId);
    
    return {
      success: true,
      eventId: eventId
    };
    
  } catch (error) {
    console.error('❌ Error cancelling calendar event:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get appointment details
async function getAppointmentDetails(eventId) {
  try {
    if (!calendar) {
      await initCalendar();
    }
    
    if (!calendar) {
      return {
        success: false,
        error: 'Google Calendar not configured'
      };
    }
    
    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId
    });
    
    return {
      success: true,
      event: response.data
    };
    
  } catch (error) {
    console.error('❌ Error getting appointment details:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  createCalendarEvent,
  getAvailableTimes,
  isTimeAvailable,
  cancelAppointment,
  getAppointmentDetails,
  initCalendar
}; 