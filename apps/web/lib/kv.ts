import prisma from '@/lib/prisma'

export async function getKV<T = any>(namespace: string, key: string): Promise<T | null> {
  const row = await prisma.keyValue.findUnique({ where: { namespace_key: { namespace, key } } as any })
  return (row?.value as any) ?? null
}

export async function setKV<T = any>(namespace: string, key: string, value: T) {
  return prisma.keyValue.upsert({
    where: { namespace_key: { namespace, key } } as any,
    update: { value: value as any },
    create: { namespace, key, value: value as any },
  })
}
