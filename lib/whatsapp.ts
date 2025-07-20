/**
 * Sends a message to a WhatsApp user using the WhatsApp HTTP API
 * @param to The WhatsApp user ID (phone number)
 * @param text The message text to send
 * @param options Additional options for the message (optional)
 * @returns A promise that resolves with the API response
 */
export async function sendWhatsappMessage(
  to: string,
  text: string,
  options: Record<string, any> = {}
): Promise<any> {
  // TODO: Implement WhatsApp API integration
  console.log(`[WhatsApp] Would send to ${to}: ${text}`);
  return { ok: true };
}

/**
 * Sends a WhatsApp template message
 * @param to The WhatsApp user ID (phone number)
 * @param templateName The name of the template to send
 * @param templateParameters Optional template parameters
 * @returns A promise that resolves with the API response
 */
export async function sendWhatsappTemplate(
  to: string,
  templateName: string,
  templateParameters: any[] = []
): Promise<any> {
  // TODO: Implement WhatsApp template API integration
  console.log(`[WhatsApp] Would send template "${templateName}" to ${to} with params:`, templateParameters);
  return { ok: true };
}

/**
 * Sends a WhatsApp interactive list message with options
 * @param to The WhatsApp user ID (phone number)
 * @param text The message text
 * @param options Array of option strings (up to 10)
 * @returns A promise that resolves with the API response
 */
export async function sendWhatsappInteractiveMessage(
  to: string,
  text: string,
  options: string[]
): Promise<any> {
  // Limit to 10 options as per WhatsApp API restrictions
  const limitedOptions = options.slice(0, 10);
  
  // Create rows for the list
  const rows = limitedOptions.map((option, index) => ({
    id: `option_${index}`,
    title: option.substring(0, 24), // Max 24 characters for row title
    description: option.length > 24 ? option.substring(24, 96) : undefined // Optional description for longer options
  }));

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "interactive",
    interactive: {
      type: "list",
      body: {
        text: text
      },
      action: {
        button: "Choose option", // Button text to reveal the list
        sections: [
          {
            title: "Options",
            rows: rows
          }
        ]
      }
    }
  };

  // TODO: Implement actual WhatsApp API call
  console.log(`[WhatsApp] Would send interactive list to ${to}:`, JSON.stringify(payload, null, 2));
  return { ok: true };
} 