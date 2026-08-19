// Совместимость с прежней страницей выбора психолога: сам кабинетный
// каталог переехал в /profile/orders, но его дочерний маршрут ещё
// использует этот импорт.
export { bookPsychologist, orderProduct } from "../profile/orders/actions";
