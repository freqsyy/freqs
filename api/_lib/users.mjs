import crypto from "node:crypto";
import { kv, KEYS } from "./kv.mjs";
import { uid } from "./util.mjs";

export const ROLES = ["owner", "admin", "editor"];
export const MAX_OWNERS = 2;

// --- Хэширование паролей (PBKDF2, без сторонних библиотек) ---
// Вынесено сюда, чтобы не было циклического импорта с auth.mjs.
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await pbkdf2(password, salt);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

async function pbkdf2(password, saltBuf) {
  return crypto.pbkdf2Sync(Buffer.from(password, "utf8"), saltBuf, 100_000, 32, "sha256");
}

export async function verifyUserPassword(password, record) {
  const salt = Buffer.from(record.salt, "hex");
  const hash = await pbkdf2(password, salt);
  const a = Buffer.from(record.hash, "hex");
  if (a.length !== hash.length) return false;
  return crypto.timingSafeEqual(a, hash);
}

// --- чтение/запись списка юзеров (массив) ---
export async function listUsers() {
  return (await kv.get(KEYS.users)) || [];
}

export async function saveUsers(users) {
  await kv.set(KEYS.users, users);
}

export async function getUserById(id) {
  const users = await listUsers();
  return users.find((u) => u.id === id) || null;
}

export async function getUserByLogin(login) {
  const users = await listUsers();
  return users.find((u) => u.login === login) || null;
}

export async function needsSetup() {
  const users = await listUsers();
  return users.length === 0;
}

// Создать первого владельца (только если список пуст)
export async function createFirstOwner(login, password) {
  const { salt, hash } = await hashPassword(password);
  const owner = {
    id: uid(),
    login,
    role: "owner",
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };
  await saveUsers([owner]);
  return owner;
}

// Создать админа/редактора (только owner)
export async function createUser({ login, password, role }) {
  if (!ROLES.includes(role)) throw new Error("Неизвестная роль");
  const users = await listUsers();
  if (users.find((u) => u.login === login)) {
    throw new Error("Логин уже занят");
  }
  const { salt, hash } = await hashPassword(password);
  const user = {
    id: uid(),
    login,
    role,
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await saveUsers(users);
  return user;
}

// Сменить роль (owner <-> admin, editor <-> admin). Трогать владельца нельзя.
export async function changeRole(targetId, newRole) {
  if (!ROLES.includes(newRole)) throw new Error("Неизвестная роль");
  const users = await listUsers();
  const target = users.find((u) => u.id === targetId);
  if (!target) throw new Error("Пользователь не найден");
  if (target.role === "owner") throw new Error("Нельзя менять роль владельца");
  target.role = newRole;
  await saveUsers(users);
  return target;
}

// Сделать совладельцем (назначить owner), если владельцев < MAX_OWNERS
export async function makeOwner(targetId) {
  const users = await listUsers();
  const owners = users.filter((u) => u.role === "owner");
  if (owners.length >= MAX_OWNERS) {
    throw new Error(`Владельцев уже ${MAX_OWNERS} (максимум)`);
  }
  const target = users.find((u) => u.id === targetId);
  if (!target) throw new Error("Пользователь не найден");
  if (target.role === "owner") throw new Error("Уже владелец");
  target.role = "owner";
  await saveUsers(users);
  return target;
}

// Передать владение: текущий owner -> admin, цель -> owner (при соблюдении лимита)
export async function transferOwnership(fromId, targetId) {
  const users = await listUsers();
  const from = users.find((u) => u.id === fromId);
  const target = users.find((u) => u.id === targetId);
  if (!from || from.role !== "owner") throw new Error("У вас нет прав владельца");
  if (!target) throw new Error("Пользователь не найден");
  if (target.role === "owner") throw new Error("Цель уже владелец");
  const owners = users.filter((u) => u.role === "owner");
  if (owners.length >= MAX_OWNERS) {
    throw new Error(`Владельцев уже ${MAX_OWNERS} (максимум)`);
  }
  from.role = "admin";
  target.role = "owner";
  await saveUsers(users);
  return { from, target };
}

// Удалить юзера. Нельзя удалить последнего владельца.
export async function deleteUser(targetId, actor) {
  const users = await listUsers();
  const target = users.find((u) => u.id === targetId);
  if (!target) throw new Error("Пользователь не найден");
  if (target.role === "owner") {
    const owners = users.filter((u) => u.role === "owner");
    if (owners.length <= 1) throw new Error("Нельзя удалить последнего владельца");
  }
  if (actor && actor.id === targetId) throw new Error("Нельзя удалить себя");
  const next = users.filter((u) => u.id !== targetId);
  await saveUsers(next);
  return target;
}

// Сменить пароль текущего юзера (после проверки старого)
export async function changePassword(userId, oldPassword, newPassword) {
  if (newPassword.length < 6) throw new Error("Новый пароль минимум 6 символов");
  const users = await listUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) throw new Error("Пользователь не найден");
  const ok = await verifyUserPassword(oldPassword, target);
  if (!ok) throw new Error("Старый пароль неверен");
  const { salt, hash } = await hashPassword(newPassword);
  target.salt = salt;
  target.hash = hash;
  await saveUsers(users);
  return target;
}
