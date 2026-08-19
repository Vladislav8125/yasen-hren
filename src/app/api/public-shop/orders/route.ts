import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PUBLIC_SHOP_PRODUCTS } from "@/lib/public-shop";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const product = PUBLIC_SHOP_PRODUCTS.find((item) => item.id === productId);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 160) : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 40) : "";
  const deliveryAddress = typeof body?.deliveryAddress === "string" ? body.deliveryAddress.trim().slice(0, 500) : "";
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 1000) : "";
  const promoCode = typeof body?.promoCode === "string" ? body.promoCode.trim().toUpperCase().slice(0, 32) : "";
  const quantity = Math.max(1, Math.min(10, Number(body?.quantity) || 1));

  if (!product || !name || !EMAIL.test(email) || !phone) {
    return NextResponse.json({ error: "Заполните товар, имя, корректный email и телефон" }, { status: 400 });
  }
  if (product.requiresDelivery && !deliveryAddress) {
    return NextResponse.json({ error: "Укажите адрес доставки" }, { status: 400 });
  }

  // Стоимость намеренно рассчитывается на сервере: браузер не может изменить сумму заказа.
  const order = await prisma.publicShopOrder.create({
    data: {
      product: product.id,
      amount: product.priceRub * 100 * quantity,
      quantity,
      name,
      email,
      phone,
      deliveryAddress: deliveryAddress || null,
      comment: comment || null,
      promoCode: promoCode || null,
    },
  });

  return NextResponse.json({ ok: true, orderId: order.id });
}
