"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  slugifyTurbineModel,
  turbineModelSchema,
  type TurbineModelInput,
} from "@/lib/schemas/turbine-model";

type ActionResult<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

export type TurbineModelOption = {
  id: string;
  name: string;
  slug: string;
};

export async function listTurbineModels(): Promise<TurbineModelOption[]> {
  await requireSession();
  const rows = await prisma.turbineModel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return rows;
}

export async function createTurbineModel(
  input: TurbineModelInput,
): Promise<ActionResult<{ id: string; name: string; slug: string }>> {
  await requireSession();

  const parsed = turbineModelSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const name = parsed.data.name.replace(/\s+/g, " ").trim();
  const slug = slugifyTurbineModel(name);

  if (!slug) {
    return { ok: false, error: "Model name must contain letters or numbers." };
  }

  // If a model with the same slug exists, treat as a no-op return.
  const existing = await prisma.turbineModel.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (existing) {
    return { ok: true, ...existing };
  }

  try {
    const created = await prisma.turbineModel.create({
      data: { name, slug },
      select: { id: true, name: true, slug: true },
    });
    revalidatePath("/sites");
    return { ok: true, ...created };
  } catch (err) {
    if (isUniqueViolation(err)) {
      const conflict = await prisma.turbineModel.findFirst({
        where: { OR: [{ slug }, { name }] },
        select: { id: true, name: true, slug: true },
      });
      if (conflict) return { ok: true, ...conflict };
    }
    console.error("[turbine-models] create failed:", err);
    return { ok: false, error: "Could not create turbine model." };
  }
}
