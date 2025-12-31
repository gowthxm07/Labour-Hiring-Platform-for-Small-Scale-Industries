// 1. Open Chat with a Specific Person
export const openWhatsAppChat = (phoneNumber, message) => {
    if (!phoneNumber) {
        alert("Phone number not available");
        return;
    }
    
    // Remove '+' and spaces to get raw digits (e.g., +91 999 -> 91999)
    const cleanNumber = phoneNumber.replace(/\D/g, ''); 
    
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};

// 2. Share a Job to generic WhatsApp Groups/Contacts
export const shareJobOnWhatsApp = (job) => {
    const text = `🔥 *New Job Alert: ${job.jobTitle}*\n\n` +
                 `📍 Location: ${job.location}\n` +
                 `💰 Salary: ₹${job.salary}/month\n` +
                 `🏠 Room: ${job.accommodation}\n\n` +
                 `Apply now on *LabourLink*!`;
                 
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
};