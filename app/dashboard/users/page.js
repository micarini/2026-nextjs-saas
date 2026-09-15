import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import UserForm from "@/components/users/UserForm";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile, listUserProfiles } from "@/lib/users/users";
import { createUser, deleteUser } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const profile = await getCurrentUserProfile(user);

  if (profile?.user_type !== "admin") {
    redirect("/dashboard");
  }

  const users = await listUserProfiles();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar user={user} profile={profile} />
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-5 border-b border-zinc-800 px-4 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
            Administracion
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-50 sm:text-5xl lg:text-6xl">
            Usuarios
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
            Gestion de perfiles almacenados en Firestore.
          </p>
        </div>
      </header>

      <section className="mx-auto mt-7 grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(280px,360px)_1fr]">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">
            Crear usuario
          </h2>
          <UserForm
            action={createUser}
            showCredentials
            submitLabel="Crear usuario"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">
              Usuarios registrados
            </h2>
            <span className="text-sm text-zinc-500">{users.length} total</span>
          </div>

          {users.length === 0 ? (
            <div className="border border-zinc-800 p-6 text-sm leading-6 text-zinc-400">
              No hay perfiles de usuario registrados.
            </div>
          ) : (
            <div className="grid gap-px overflow-hidden border border-zinc-800 bg-zinc-800">
              {users.map((managedUser) => (
                <article
                  className="grid min-w-0 gap-4 bg-zinc-950 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto]"
                  key={managedUser.uid}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="overflow-wrap-anywhere text-base font-semibold text-zinc-100">
                        {managedUser.email || managedUser.uid}
                      </h3>
                      <span className="border border-zinc-800 px-2 py-1 text-xs uppercase tracking-[0.12em] text-zinc-400">
                        {managedUser.user_type}
                      </span>
                    </div>
                    {managedUser.displayName ? (
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {managedUser.displayName}
                      </p>
                    ) : null}
                    <p className="mt-3 overflow-wrap-anywhere font-mono text-xs text-zinc-600">
                      {managedUser.uid}
                    </p>
                    <p className="mt-2 text-xs text-zinc-600">
                      Ultimo acceso: {formatDate(managedUser.lastLoginAt)}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-start lg:justify-end">
                    <Link
                      className="inline-flex h-9 w-full items-center justify-center border border-zinc-700 px-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
                      href={`/dashboard/users/${managedUser.uid}/edit`}
                    >
                      Editar
                    </Link>
                    {managedUser.uid !== user.uid ? (
                      <form action={deleteUser.bind(null, managedUser.uid)}>
                        <button
                          className="h-9 w-full border border-red-900/80 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-950/50 sm:w-auto"
                          type="submit"
                        >
                          Eliminar
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
