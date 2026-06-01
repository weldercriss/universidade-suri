# ADR 002 — Clean Architecture no Backend

**Data:** 2025-05-26
**Status:** Aceito

---

## Contexto

O backend da Universidade Suri precisa de uma arquitetura que permita:
- Separação clara de responsabilidades
- Facilidade de testes unitários (mocking de dependências)
- Substituição de implementações sem impacto no domínio (ex: trocar ORM)
- Escalabilidade da equipe (cada desenvolvedor trabalha em uma camada)

## Decisão

Adotamos **Clean Architecture** com separação em camadas:

```
src/
├── domain/              # Regras de negócio puras (sem dependências externas)
│   ├── entities/        # Entidades do domínio
│   └── repositories/    # Interfaces dos repositórios (contratos)
│
├── infrastructure/      # Implementações concretas
│   ├── database/        # PrismaService, implementações de repositórios
│   │   ├── prisma.service.ts
│   │   └── repositories/
│   │       ├── prisma-user.repository.ts
│   │       ├── prisma-course.repository.ts
│   │       └── prisma-post.repository.ts
│   └── http/            # Controllers, strategies, guards
│       ├── controllers/
│       └── strategies/
│
└── main.ts              # Bootstrap
```

### Princípios

1. **Dependency Inversion**: O domínio define interfaces; a infraestrutura as implementa
2. **Injeção de Dependência**: NestJS resolve as dependências via `@Module()` providers
3. **Isolamento**: Entidades não importam Prisma, Express, ou qualquer framework

### Exemplo de Binding (app.module.ts)

```ts
providers: [
  {
    provide: IUserRepository,     // Interface do domínio
    useClass: PrismaUserRepository, // Implementação concreta
  },
]
```

## Consequências

### Positivas
- **Testabilidade**: Domínio pode ser testado com mocks simples
- **Flexibilidade**: Trocar Prisma por outro ORM requer apenas nova implementação do repositório
- **Organização**: Cada desenvolvedor sabe onde colocar cada tipo de código

### Negativas
- **Boilerplate**: Mais arquivos e interfaces para cada entidade
- **Curva de aprendizado**: Desenvolvedores juniores podem ter dificuldade inicial
- **Over-engineering para CRUDs simples**: Para operações triviais, a indireção pode parecer excessiva

## Referências

- Código: `backend/src/domain/` e `backend/src/infrastructure/`
- [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
