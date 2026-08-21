// Next.js instrumentation hook — запускается один раз при старте сервера.
// Регистрирует cron-задачи:
// - 10:00 МСК — проверка автопродлений и напоминание за 3 дня до списания
// - 12:00 МСК — ежедневное напоминание открыть карту (LLM-текст)
//
// Работает только в Node.js-рантайме (не на Edge).

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = (await import("node-cron")).default;

    // 10:00 МСК = 7:00 UTC — списания и напоминания по подпискам.
    cron.schedule("0 7 * * *", async () => {
      try {
        const { processDueRobokassaRenewals } = await import("@/lib/robokassa");
        const { sendAutoRenewalReminder } = await import("@/lib/notifications");
        const billing = await processDueRobokassaRenewals();
        const reminder = await sendAutoRenewalReminder();
        console.log(`[cron] billing: ${billing.created}/${billing.total} renewal attempts; reminders: ${reminder.sent}/${reminder.total} ok, ${reminder.failed} failed`);
      } catch (err) {
        console.error("[cron] tariff-expiry error:", err);
      }
    });

    // 12:00 МСК = 9:00 UTC — напоминание о карте дня
    cron.schedule("0 9 * * *", async () => {
      try {
        const { sendDailyReminder } = await import("@/lib/notifications");
        const result = await sendDailyReminder();
        console.log(`[cron] daily-reminder: ${result.sent}/${result.total} ok, ${result.failed} failed`);
      } catch (err) {
        console.error("[cron] daily-reminder error:", err);
      }
    });

    console.log("[cron] registered: billing (10:00 МСК) + daily-reminder (12:00 МСК, LLM)");
  }
}
