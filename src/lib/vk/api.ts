import { readFile } from "fs/promises";

// Тонкая обёртка над VK Bots API — без SDK, тем же стилем, что и yookassa.ts
// (raw fetch, никаких лишних зависимостей). Требует VK_GROUP_TOKEN
// (токен сообщества с правом messages) — архитектурное ТЗ, раздел 10.

const VK_API_VERSION = "5.199";

function groupToken(): string {
  const token = process.env.VK_GROUP_TOKEN;
  if (!token) {
    throw new Error("VK_GROUP_TOKEN не задан — VK-бот пока недоступен (см. .env.example).");
  }
  return token;
}

async function vkApi<T>(method: string, params: Record<string, string>): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: groupToken(), v: VK_API_VERSION });
  const response = await fetch(`https://api.vk.com/method/${method}`, { method: "POST", body });
  const data = (await response.json()) as { response?: T; error?: { error_msg: string } };
  if (data.error) {
    throw new Error(`VK API ${method} failed: ${data.error.error_msg}`);
  }
  return data.response as T;
}

export async function vkSendMessage(
  userId: string,
  message: string,
  options?: { attachment?: string; keyboard?: string },
) {
  await vkApi("messages.send", {
    user_id: userId,
    message,
    random_id: String(Math.floor(Math.random() * 2 ** 31)),
    ...(options?.attachment ? { attachment: options.attachment } : {}),
    ...(options?.keyboard ? { keyboard: options.keyboard } : {}),
  });
}

/** Загружает фото карты в VK и возвращает attachment-строку для messages.send. */
export async function vkUploadPhoto(userId: string, filePath: string): Promise<string> {
  const { upload_url } = await vkApi<{ upload_url: string }>("photos.getMessagesUploadServer", {
    peer_id: userId,
  });

  const fileBuffer = await readFile(filePath);
  const form = new FormData();
  form.append("photo", new Blob([fileBuffer]), "card.jpg");

  const uploadResponse = await fetch(upload_url, { method: "POST", body: form });
  const uploadResult = (await uploadResponse.json()) as { server: string; photo: string; hash: string };

  const [saved] = await vkApi<Array<{ owner_id: number; id: number }>>("photos.saveMessagesPhoto", {
    server: uploadResult.server,
    photo: uploadResult.photo,
    hash: uploadResult.hash,
  });

  return `photo${saved.owner_id}_${saved.id}`;
}
