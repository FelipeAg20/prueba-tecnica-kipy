# Informe Detallado de la Prueba Técnica

**Objetivo**  
Este documento describe con detalle la estructura del proyecto, la arquitectura lógica y comunicación entre capas, los requisitos de la prueba, y el proceso completo de solución con las decisiones técnicas y su justificación.

**Fecha**  
07 de febrero de 2026

**Repositorio**  
`c:\Users\DELL\Desktop\prueba_tecnica\fullstack2025`

---

**Estructura del Proyecto**

```
src/
  domain/
    entities/
    interfaces/
    rules/
    value-objects/
  application/
    dtos/
    use-cases/
  infrastructure/
    database/
      entities/
      seed.ts
      database.module.ts
    repositories/
  presentation/
    controllers/
  app.module.ts
  main.ts
test/
  unit/
    application/
    domain/
  integration/
.env.example
.eslintrc.js
.prettierrc
eslint.config.js
tsconfig.json
tsconfig.eslint.json
package.json
```

---

**Arquitectura Lógica**

El proyecto sigue Clean Architecture y DDD con dependencias que apuntan hacia el dominio.

**Capas y responsabilidades**

- `domain`: entidades, reglas y value objects. No depende de ninguna otra capa.
- `application`: casos de uso que orquestan reglas del dominio. Depende de `domain`.
- `infrastructure`: repositorios y DB (TypeORM). Implementa interfaces del dominio.
- `presentation`: controladores HTTP. Depende de `application`.

**Reglas de dependencia**

- `presentation` → `application` → `domain`
- `infrastructure` → `domain`
- `domain` no depende de ninguna capa

---

**Comunicación Entre Capas (Flujo Completo)**

1. Una petición HTTP llega a un controller.
2. El controller invoca un caso de uso de `application`.
3. El caso de uso consulta repositorios (interfaces del dominio).
4. Los repositorios (infraestructura) consultan la base de datos con TypeORM.
5. El caso de uso aplica reglas del dominio y devuelve la respuesta.

**Ejemplo de flujo: préstamo de libro**

- `LoansController.createLoan(...)`
- `CreateLoanUseCase.execute(dto)`
- `BookRepository.findById(...)`
- `UserRepository.findById(...)`
- `LoanRepository.findActiveByUserId(...)`
- `LoanRules.canUserBorrowBook(...)`
- `Loan.createNew(...)`
- `Book.decreaseAvailableCopies()`
- `LoanRepository.save(...)` + `BookRepository.update(...)`

---

**Requisitos de la Prueba**

- Implementar casos de uso en `src/application/use-cases`.
- Implementar repositorios en `src/infrastructure/repositories` con TypeORM.
- Respetar reglas de negocio:
  - Estudiantes máximo 3 préstamos.
  - Profesores máximo 5 préstamos.
  - No se puede prestar si no hay copias.
  - Estudiantes vencen a 14 días.
  - Profesores vencen a 30 días.
  - Usuarios con préstamos vencidos no pueden pedir más.
  - Multa de 1.50 USD por día de retraso.
- Pasar todos los tests (unitarios + integración).
- Validar con `npm run validate` (lint + type-check + tests).

---

**Proceso de Resolución (Paso a Paso)**

**1. Preparación del entorno**

- Configuración de variables de entorno con `.env`.
- Levantar base de datos local.
- Ejecutar `npm run seed` para datos de ejemplo.

**2. Diagnóstico inicial**

- Se ejecutó `npm test`.
- Fallas detectadas en casos de uso no implementados.
- Dominio ya estaba completo.

**3. Implementación de casos de uso**

Se implementaron los 4 casos de uso con el flujo esperado por los tests y las reglas del dominio.

**4. Implementación de repositorios**

Se implementaron repositorios con TypeORM y mapeos entre entidades de DB y entidades del dominio.

**5. Ajustes técnicos para validación**

- Se cambió `uuid` por `crypto.randomUUID()` para compatibilidad con Jest.
- Se adaptó ESLint v9 con `eslint.config.js`.
- Se agregó `tsconfig.eslint.json` para incluir `/test`.
- Se ajustó Prettier con `endOfLine: "auto"` para CRLF.
- Se corrigieron restricciones de lint en strings de error.
- Se agregaron tipos de retorno explícitos en controllers.

---

**Implementación Detallada de Cada Proceso**

**CreateLoanUseCase**

Ubicación: `src/application/use-cases/CreateLoanUseCase.ts`

Pasos internos:

- Buscar libro por `bookId`.  
  Si no existe: error `Book not found`.
- Buscar usuario por `userId`.  
  Si no existe: error `User not found`.
- Consultar préstamos activos y vencidos del usuario.
- Validar reglas con `LoanRules.canUserBorrowBook(...)`.
- Crear préstamo con `Loan.createNew(...)` y `randomUUID()`.
- Disminuir copias disponibles del libro.
- Persistir préstamo y libro.

Motivo del enfoque:

- La lógica vive en el dominio (`LoanRules`, `Loan`, `Book`).
- El caso de uso solo orquesta y respeta Clean Architecture.

**ReturnBookUseCase**

Ubicación: `src/application/use-cases/ReturnBookUseCase.ts`

Pasos internos:

- Buscar préstamo por `loanId`.  
  Si no existe: error `Loan not found`.
- Validar devolución con `LoanRules.validateReturnBook(...)`.
- Buscar el libro asociado al préstamo.
- Parsear fecha de devolución (si no existe, usar `new Date()`).
- Marcar el préstamo como devuelto.
- Calcular multa con `LoanRules.calculateFine(...)`.
- Incrementar copias disponibles del libro.
- Persistir préstamo y libro.

Motivo del enfoque:

- El cálculo de multa está encapsulado en `Loan`.
- Se conserva consistencia entre préstamo y stock.

**GetUserLoansUseCase**

Ubicación: `src/application/use-cases/GetUserLoansUseCase.ts`

Pasos internos:

- Consultar préstamos por `userId` en el repositorio.
- Retornar lista completa.

Motivo del enfoque:

- Caso de lectura simple, sin reglas extra.

**CheckBookAvailabilityUseCase**

Ubicación: `src/application/use-cases/CheckBookAvailabilityUseCase.ts`

Pasos internos:

- Buscar libro por `bookId`.  
  Si no existe: error `Book not found`.
- Retornar disponibilidad, copias disponibles, copias totales, título.

Motivo del enfoque:

- Reutiliza métodos del dominio (`hasAvailableCopies`, `getAvailableCopies`).

---

**Implementación de Repositorios**

**BookRepository**

Ubicación: `src/infrastructure/repositories/BookRepository.ts`

- `findById`, `findByISBN`, `findAll`, `save`, `update`, `delete`.
- Mapeo `BookEntity` ⇄ `Book`.
- Uso de `ISBN.create(...)`.

**UserRepository**

Ubicación: `src/infrastructure/repositories/UserRepository.ts`

- `findById`, `findByEmail`, `findAll`, `save`, `update`, `delete`.
- Mapeo `UserEntity` ⇄ `User`.
- Uso de `Email.create(...)`.

**LoanRepository**

Ubicación: `src/infrastructure/repositories/LoanRepository.ts`

- `findById`, `findByUserId`, `findActiveByUserId`, `findOverdueByUserId`, `findByBookId`, `findAll`, `save`, `update`, `delete`.
- Mapeo `LoanEntity` ⇄ `Loan`.
- Conversión de `status` y `userType` a enums.

---

**Ajustes de Infraestructura y Herramientas**

**Compatibilidad Jest + UUID**

`uuid` en ESM fallaba con Jest. Se reemplazó por:

- `import { randomUUID } from 'crypto';`
- `randomUUID()` en `CreateLoanUseCase`.

**ESLint v9**

- Se creó `eslint.config.js` usando FlatCompat.
- Se agregó `tsconfig.eslint.json` para incluir tests.

**Prettier y CRLF**

- Se agregó `"endOfLine": "auto"` en `.prettierrc`.

**Lint de controllers**

Se agregaron tipos de retorno explícitos en:

- `src/presentation/controllers/books.controller.ts`
- `src/presentation/controllers/loans.controller.ts`

---

**Resultados de Validación**

- `npm test`: 24/24 tests en verde.
- `npm run validate`: requiere lint, type-check y tests en verde.

---

**Conclusión**

El proyecto quedó implementado conforme a los requisitos funcionales y técnicos:  
- Casos de uso completos.  
- Repositorios TypeORM con mapeo DDD.  
- Reglas de negocio aplicadas correctamente.  
- Validación lista para pasar en CI con `npm run validate`.  

El enfoque asegura Clean Architecture:  
el dominio es independiente, los casos de uso orquestan, y la infraestructura se mantiene desacoplada mediante interfaces.
