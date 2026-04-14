import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isStudio = createRouteMatcher(["/studio(.*)", "/api/modules(.*)", "/api/ocr(.*)"]);
const isPublic = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return;
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) return redirectToSignIn();

  if (isStudio(req)) {
    const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
    if (role !== "creator") {
      return Response.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
