# Preguntas al Frontend (ronda 2): roles/permisos y agrupación de evidencias

> Para rediseñar el scoring y el modelo de evidencias en `/api/v2` necesitamos
> entender cómo gestiona HOY el frontend (a) los roles y permisos y (b) los casos
> en que una característica tiene varias evidencias (complementarias/jerárquicas).
> Por favor respondan anclando a código real (archivo:línea), como en
> `CONTRATO-FRONTEND-EVIDENCIAS.md`.
>
> Contexto del backend hoy: solo distingue `ROL_ADMIN` (`'Administrador'`) y
> `ROL_USER` (`'Ciudadano'`). `subindicator.responsible` es un string libre.
> La rúbrica (`Rubric`) hoy es **por evidencia**. Cada `Evidence` tiene un solo
> `link`. La nota la calcula el FE como `1 + criterios_marcados`.

---

## A. Roles y permisos (estado actual)

1. **¿Qué roles existen hoy exactamente?** Nombres y propósito de cada uno.
   ¿Hay algún rol **intermedio** entre Administrador y Ciudadano (p.ej.
   técnico/responsable/evaluador)? ¿De dónde sale el catálogo de roles (colección
   `Rol`, enum del FE, env)?

2. **¿Cómo gatea la UI las acciones por rol?** ¿Existe un mapa `rol → permisos`
   en el front, o se compara directamente `rol.name` (p.ej. `=== 'Administrador'`)?
   Indiquen el archivo donde está esa lógica (guards/directivas/`*ngIf`).

3. **Matriz de quién puede hacer qué HOY** (marquen el/los rol/es por acción):
   - Crear/editar **indicadores** del catálogo y **crear instancias** por periodo.
   - Crear/editar **características** y su **rúbrica** (criterios/valuations).
   - **Subir** evidencia.
   - **Calificar** evidencia (`qualify`, marcar criterios).
   - **Verificar/publicar** evidencia (`verified`, visibilidad ciudadana).
   - **Configurar el GAD** (`publishAuto`, `reportDefault`).
   - **Gestionar usuarios** (alta/roles).

4. **Token y resolución de rol:** el JWT lleva `rol` (id). ¿El FE resuelve el
   **nombre** del rol para decidir permisos, o usa el id? ¿Dónde
   (`auth`/`session`)?

5. **Multi-tenant:** ¿el rol de un usuario es **global** o **por GAD/tenant**?
   Es decir, ¿un mismo usuario puede ser Administrador en un GAD y otra cosa en
   otro? ¿El `tenant` (header) define el workspace y el rol va por workspace?

6. **Segregación de funciones (clave para la tesis):** hoy en la UI,
   ¿puede **el mismo usuario** subir una evidencia y luego calificarla? ¿Hay
   alguna restricción de que **quien sube ≠ quien califica ≠ quien publica**?
   El backend guarda `author` (quien sube) y `qualificationBy` (quien califica):
   ¿la UI los fuerza a ser distintos o no?

7. **`subindicator.responsible`** (string libre en el modelo): ¿la UI lo usa?
   ¿Representa una persona/área responsable del subindicador? ¿Se asigna y filtra
   por él? ¿Debería ser un **usuario** (relación) en vez de texto?

8. **¿Falta algún rol?** Para el rediseño evaluamos separar: *creador de
   indicadores/metodólogo*, *cargador de evidencia (GAD)*, *evaluador/calificador*,
   *publicador*, *configurador de rúbrica y pesos*. ¿Cuáles de esos perfiles
   existen ya en la práctica aunque hoy todos sean "Administrador"?

---

## B. Agrupación de evidencias (varias por característica)

> En pruebas se vio que un GAD a veces sube **más de un archivo** para una misma
> característica: pueden ser **complementarios** (1 informe principal + contratos/
> imágenes) o tener **jerarquía** (2 informes que respaldan el subindicador).

9. **¿Cómo lo modela la UI hoy?** Cuando se suben varios archivos para una
   característica, ¿se crean **varias `Evidence` separadas** (cada una con su
   `link`) o **una `Evidence` con varios adjuntos**? (El modelo actual tiene un
   solo `link` por evidencia.)

10. **¿Existe noción de evidencia "principal" vs "complementaria"?** ¿La UI lo
    distingue visualmente o las trata como iguales? ¿Hay un **orden/jerarquía**
    entre ellas?

11. **POA / documento global:** cuando la evidencia es un documento global (POA)
    que cubre varias características, ¿se **sube una vez y se referencia** desde
    varias características, o se **re-sube** por cada característica? ¿Hay forma de
    indicar "página/sección" del documento que aplica a la característica?

12. **¿La calificación es por evidencia o por característica?** Hoy la `Rubric`
    es **por evidencia**. Si una característica tiene 3 evidencias complementarias,
    ¿el evaluador marca los criterios **una sola vez para la característica** o
    **una vez por cada evidencia**? ¿Cuál creen que es el modelo correcto?

13. **Decisión de nota con varias evidencias:** cuando hay varias, ¿el evaluador
    las revisa todas y marca el criterio si **alguna** lo cumple (unión), o evalúa
    cada evidencia por separado? (Define cómo agregamos en el backend.)

---

## C. Rúbrica, pesos y posible rol nuevo

14. **Pesos por criterio:** hoy `Valuation.maxValue` solo se usa como flag
    (`===1` → checkbox). Queremos permitir **criterios ponderados** (peso por
    criterio). ¿Quién debería **definir esos pesos**: el Administrador actual o un
    **rol nuevo** (p.ej. "metodólogo/configurador de rúbrica")?

15. **Alcance de la rúbrica:** ¿los criterios/rúbrica son **globales** (catálogo
    ISO 18091, iguales para todos los GAD) o **personalizables por GAD**? ¿La UI
    permite editar criterios por GAD?

16. **Criterios críticos (`tier`):** confirmado que el FE no usa `tier` en el
    cálculo. ¿Están de acuerdo con que el backend trate `tier>1` como
    **criterio crítico** (si falta, el subindicador no pasa de rojo)? ¿Quién marca
    un criterio como crítico y dónde en la UI?

---

## Resumen de lo que el backend necesita decidir con estas respuestas
- Si la **rúbrica pasa a ser por característica** (no por evidencia) y si la
  evidencia gana un modelo **principal + complementarias / adjuntos**.
- Qué **roles** existen y la **matriz de permisos** real → para diseñar guards v2
  por rol (crear/subir/calificar/publicar/configurar) y posible segregación de
  funciones (`author ≠ qualificationBy`).
- Si introducimos **pesos** y un **rol** que los gestione, y si la rúbrica es
  global o por GAD.
