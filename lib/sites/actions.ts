"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SiteUncheckedCreateInput } from "@/app/generated/prisma/models/Site";
import { siteSchema, type SiteInput } from "@/lib/schemas/site";

type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const locationSchema = z.object({
  latitude: z.coerce
    .number()
    .min(-90, { message: "Latitude must be between -90 and 90." })
    .max(90, { message: "Latitude must be between -90 and 90." }),
  longitude: z.coerce
    .number()
    .min(-180, { message: "Longitude must be between -180 and 180." })
    .max(180, { message: "Longitude must be between -180 and 180." }),
});

export type LocationInput = z.input<typeof locationSchema>;

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function createSite(input: SiteInput): Promise<ActionResult> {
  const session = await requireSession();

  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const data: SiteUncheckedCreateInput = {
      ...parsed.data,
      createdById: session.user.id,
    };
    const site = await prisma.site.create({
      data,
      select: { id: true },
    });
    revalidatePath("/sites");
    return { ok: true, id: site.id };
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return { ok: false, error: "A site with this name already exists." };
    }
    console.error("[sites] create failed:", err);
    return { ok: false, error: "Could not create site." };
  }
}

export async function updateSite(
  id: string,
  input: SiteInput,
): Promise<ActionResult> {
  await requireSession();

  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await prisma.site.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/sites");
    revalidatePath(`/sites/${id}`);
    return { ok: true, id };
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return { ok: false, error: "A site with this name already exists." };
    }
    console.error("[sites] update failed:", err);
    return { ok: false, error: "Could not update site." };
  }
}

export async function deleteSite(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();

  try {
    await prisma.site.delete({ where: { id } });
    revalidatePath("/sites");
    revalidatePath("/turbines");
    return { ok: true };
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "P2025"
    ) {
      return { ok: false, error: "Site not found." };
    }
    console.error("[sites] delete failed:", err);
    return { ok: false, error: "Could not delete site." };
  }
}

export async function updateSiteLocation(
  id: string,
  input: LocationInput,
): Promise<ActionResult> {
  await requireSession();

  const parsed = locationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid coordinates.",
    };
  }

  try {
    await prisma.site.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath(`/sites/${id}`);
    return { ok: true, id };
  } catch (err) {
    console.error("[sites] update location failed:", err);
    return { ok: false, error: "Could not update location." };
  }
}
