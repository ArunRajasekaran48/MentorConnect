import fetch from 'node-fetch';

export const createVideoRoom = async (roomName) => {
  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: Math.round(Date.now() / 1000) + 86400, // Expires in 24 hours
          enable_screenshare: true,
          enable_chat: true,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.info || 'Failed to create room');
    }

    return data.url; // This is the meeting link URL (e.g. https://yourdomain.daily.co/roomName)
  } catch (error) {
    console.error('Daily.co API Error:', error);
    return null;
  }
};
