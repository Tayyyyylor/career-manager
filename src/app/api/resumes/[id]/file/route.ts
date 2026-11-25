import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/** Sert le PDF d'un CV importé, uniquement à son propriétaire. */
export async function GET(_request: Request, ctx: RouteContext<"/api/resumes/[id]/file">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Non authentifié", { status: 401 });

  const { id } = await ctx.params;
  const resume = await db.resume.findFirst({
    where: { id, userId: user.id },
    select: { fileData: true, fileName: true, mimeType: true },
  });
  if (!resume?.fileData) return new Response("Introuvable", { status: 404 });

  const fileName = (resume.fileName ?? "cv.pdf").replace(/[^\w.\- ]/g, "_");
  return new Response(new Uint8Array(resume.fileData), {
    headers: {
      "Content-Type": resume.mimeType ?? "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
