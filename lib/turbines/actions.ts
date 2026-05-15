"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { turbineSchema, type TurbineInput } from "@/lib/schemas/turbine";

type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

export async function createTurbine(
  siteId: string,
  input: TurbineInput,
): Promise<ActionResult> {
  await requireSession();

  const parsed = turbineSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const turbine = await prisma.turbine.create({
      data: { ...parsed.data, siteId },
      select: { id: true },
    });
    revalidatePath(`/sites/${siteId}`);
    return { ok: true, id: turbine.id };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        ok: false,
        error: "A turbine with this number already exists on this site.",
      };
    }
    console.error("[turbines] create failed:", err);
    return { ok: false, error: "Could not create turbine." };
  }
}

export async function deleteTurbine(
  turbineId: string,
  siteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();

  try {
    await prisma.turbine.delete({ where: { id: turbineId } });
    revalidatePath(`/sites/${siteId}`);
    revalidatePath("/turbines");
    return { ok: true };
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "P2025"
    ) {
      return { ok: false, error: "Turbine not found." };
    }
    console.error("[turbines] delete failed:", err);
    return { ok: false, error: "Could not delete turbine." };
  }
}

export async function updateTurbine(
  turbineId: string,
  siteId: string,
  input: TurbineInput,
): Promise<ActionResult> {
  await requireSession();

  const parsed = turbineSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    await prisma.turbine.update({
      where: { id: turbineId },
      data: parsed.data,
    });
    revalidatePath(`/sites/${siteId}`);
    return { ok: true, id: turbineId };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        ok: false,
        error: "A turbine with this number already exists on this site.",
      };
    }
    console.error("[turbines] update failed:", err);
    return { ok: false, error: "Could not update turbine." };
  }
}
