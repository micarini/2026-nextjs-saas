import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { logout } from "@/app/dashboard/actions";
import BottomNav from "@/components/nav/BottomNav";
import UsernameForm from "@/components/users/UsernameForm";
import { saveUsername } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile(user);
  const isAdmin = profile?.user_type === "admin";

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 pb-24 pt-8 text-[#20180f]" style={{ colorScheme: "light" }}>
      <h1 className="font-serif text-3xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-[#a89a7f]">{user.email}</p>

      <UsernameForm action={saveUsername} currentUsername={profile?.username} />

      {profile?.username ? (
        <p className="mt-3 text-sm text-[#a89a7f]">
          Public profile: <span className="text-[#c96a1f]">/u/{profile.username}</span>
        </p>
      ) : null}

      {isAdmin ? (
        <a
          href="/dashboard/users"
          className="mt-8 block rounded-md border border-[#e7dfcf] bg-white p-4 text-sm font-semibold text-[#20180f]"
        >
          Admin: manage users →
        </a>
      ) : null}

      <form action={logout} className={isAdmin ? "mt-4" : "mt-8"}>
        <button
          type="submit"
          className="h-11 w-full rounded-md border border-[#e7dfcf] bg-white text-sm font-semibold text-[#20180f]"
        >
          Log out
        </button>
      </form>

      <BottomNav active="profile" />
    </main>
  );
}
