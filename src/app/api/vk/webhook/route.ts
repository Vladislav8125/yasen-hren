import { handleVkMessage } from "@/lib/vk/bot";

// VK Callback API — архитектурное ТЗ, раздел 10. В отличие от Telegram,
// VK не держит постоянное соединение и не использует библиотеку — сообщество
// один раз регистрирует этот URL в настройках "Callback API" и присылает
// событие "confirmation" (нужно ответить строкой из настроек VK дословно),
// дальше — событие "message_new" на каждое сообщение.
//
// Блокер: сообщество ещё не создано / VK_GROUP_TOKEN и VK_CONFIRMATION_CODE
// не заданы (см. .env.example). Как только появятся — прописать этот URL
// в разделе "Callback API" настроек сообщества VK.

interface VkCallbackBody {
  type: string;
  secret?: string;
  object?: { message?: { from_id: number; text: string } };
}

export async function POST(request: Request) {
  const body = (await request.json()) as VkCallbackBody;

  if (body.type === "confirmation") {
    const code = process.env.VK_CONFIRMATION_CODE;
    if (!code) {
      return new Response("VK bot not configured (VK_CONFIRMATION_CODE missing)", { status: 503 });
    }
    return new Response(code);
  }

  const callbackSecret = process.env.VK_CALLBACK_SECRET;
  if (callbackSecret && body.secret !== callbackSecret) {
    return new Response("ok");
  }

  if (body.type === "message_new" && process.env.VK_GROUP_TOKEN) {
    const message = body.object?.message;
    if (message?.from_id && typeof message.text === "string") {
      await handleVkMessage(String(message.from_id), message.text);
    }
  }

  return new Response("ok");
}
