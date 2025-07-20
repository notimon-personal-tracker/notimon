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
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!accessToken) {
    throw new Error('WHATSAPP_ACCESS_TOKEN environment variable is not set');
  }
  
  if (!phoneNumberId) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID environment variable is not set');
  }

  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "text",
    text: {
      body: text
    },
    ...options
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log(`[WhatsApp] Sent message to ${to}:`, result);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
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
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!accessToken) {
    throw new Error('WHATSAPP_ACCESS_TOKEN environment variable is not set');
  }
  
  if (!phoneNumberId) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID environment variable is not set');
  }

  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "en_US"
      },
      components: templateParameters.length > 0 ? [
        {
          type: "body",
          parameters: templateParameters.map(param => ({
            type: "text",
            text: param
          }))
        }
      ] : []
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log(`[WhatsApp] Sent template "${templateName}" to ${to}:`, result);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp template:', error);
    throw error;
  }
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
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!accessToken) {
    throw new Error('WHATSAPP_ACCESS_TOKEN environment variable is not set');
  }
  
  if (!phoneNumberId) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID environment variable is not set');
  }

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

  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log(`[WhatsApp] Sent interactive list to ${to}:`, result);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp interactive message:', error);
    throw error;
  }
} 