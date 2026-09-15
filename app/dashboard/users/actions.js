"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import {
  createManagedUser,
  deleteManagedUser,
  getCurrentUserProfile,
  updateManagedUser,
  USER_TYPES,
} from "@/lib/users/users";

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const profile = await getCurrentUserProfile(user);

  if (profile?.user_type !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

function parseUserForm(formData, { requirePassword = false } = {}) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim();
  const userType = String(formData.get("user_type") || "user");

  if (!email && requirePassword) {
    throw new Error("El email es obligatorio.");
  }

  if (requirePassword && password.length < 6) {
    throw new Error("La contrasena debe tener al menos 6 caracteres.");
  }

  if (!USER_TYPES.includes(userType)) {
    throw new Error("Tipo de usuario invalido.");
  }

  return {
    email,
    password,
    displayName,
    user_type: userType,
  };
}

export async function createUser(formData) {
  await requireAdmin();
  await createManagedUser(parseUserForm(formData, { requirePassword: true }));
  revalidatePath("/dashboard/users");
}

export async function updateUser(uid, formData) {
  await requireAdmin();
  await updateManagedUser(uid, parseUserForm(formData));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}

export async function deleteUser(uid) {
  const admin = await requireAdmin();

  if (admin.uid === uid) {
    throw new Error("No se puede eliminar el usuario administrador actual.");
  }

  await deleteManagedUser(uid);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");
}
