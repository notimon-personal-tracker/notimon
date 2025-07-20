/**
 * Sends a message to a Telegram user using the Telegram HTTP API
 * @param chatId The Telegram chat ID to send the message to
 * @param text The message text to send
 * @param options Additional options for the message (optional)
 * @returns A promise that resolves with the API response
 */
export async function sendMessage(
  chatId: bigint,
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
        chat_id: chatId.toString(),
        text,
        ...options,
      }),
    });
    console.log("Telegram client response", response, response.status, response.ok, response.json);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

/**
 * Sends a message with reply keyboard markup to a Telegram user
 * @param chatId The Telegram chat ID to send the message to
 * @param text The message text to send
 * @param options Array of button options
 * @returns A promise that resolves with the API response
 */
export async function sendMessageWithKeyboard(
  chatId: bigint,
  text: string,
  options: string[]
): Promise<any> {
  // Create keyboard with options as buttons
  const keyboard = options.map(option => [{ text: option }]);
  
  const replyMarkup = {
    keyboard: keyboard,
    one_time_keyboard: true,
    resize_keyboard: true
  };

  return sendMessage(chatId, text, {
    reply_markup: replyMarkup
  });
}
