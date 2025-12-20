import { Injectable } from '@nestjs/common'
import { BaseRepository, TransactionContext } from '@shared/database'
import { Menu } from '../domain/menu.entity'

@Injectable()
export class MenuRepository extends BaseRepository {
  constructor(transactionContext: TransactionContext) {
    super(transactionContext)
  }

  /**
   * Obtiene todos los menús activos con su jerarquía completa
   * Solo retorna menús padre (parentId = null), cada uno con sus hijos
   */
  async findAllWithHierarchy(): Promise<Menu[]> {
    const prisma = this.prisma

    const menusData = await prisma.menu.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        parentId: null, // Solo menús padre
      },
      include: {
        permissions: {
          select: { id: true },
        },
        children: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          include: {
            permissions: {
              select: { id: true },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return menusData.map((menuData) => {
      const children =
        menuData.children?.map((child) =>
          Menu.fromPersistence({
            ...child,
            children: [],
          }),
        ) || []

      return Menu.fromPersistence({
        ...menuData,
        children,
      })
    })
  }

  /**
   * Obtiene un menú por su ID
   */
  async findById(id: string): Promise<Menu | null> {
    const prisma = this.prisma

    const menuData = await prisma.menu.findUnique({
      where: { id },
      include: {
        permissions: {
          select: { id: true },
        },
      },
    })

    if (!menuData) {
      return null
    }

    return Menu.fromPersistence({
      ...menuData,
      children: [],
    })
  }
}
