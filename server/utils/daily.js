import crypto from 'crypto';

export const createVideoRoom = async (roomName) => {
  try {
    // Adding a random suffix ensures privacy and prevents room collisions.
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const sanitizedBase = roomName.toString().replace(/[^a-zA-Z0-9]/g, '');
    
    // meet.jit.si is the primary, most robust public Jitsi instance
    const meetingUrl = `https://meet.jit.si/MentorConnect-V3-${sanitizedBase}-${randomSuffix}`;
    
    return meetingUrl;
  } catch (error) {
    console.error('Error generating Jitsi room URL:', error);
    return null;
  }
};
