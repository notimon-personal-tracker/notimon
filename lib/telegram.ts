/**
 * Sends a message to a Telegram user using the Telegram HTTP API
 * @param chatId The Telegram chat ID to send the message to
 * @param text The message text to send
 * @param options Additional options for the message (optional)
 * @returns A promise that resolves with the API response
 */
export async function sendMessage(
  chatId: number,
  text: string,
  options: Record<string, any> = {}
): Promise<any> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set');
  }
  
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options,
      }),
    });
    console.log("Telegram client response", response, response.status, response.ok, response.json);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}
