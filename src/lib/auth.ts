import { auth, currentUser } from "@clerk/nextjs/server";

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function isCreator() {
  const user = await currentUser();
  return user?.publicMetadata?.role === "creator";
}
